import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDirectory, syncDirectoryEntry } from '../services/api'
import {
  clearDirectoryCache,
  readDirectoryCache,
  writeDirectoryCache,
  type DirectoryMutation,
  type DirectorySnapshot,
} from '../services/directoryCache'
import type { AppFormData, Medico, Paciente } from '../types'

export type DirectoryStatus = 'idle' | 'loading' | 'cache' | 'syncing' | 'fresh' | 'stale' | 'error'

interface DirectoryState {
  patients: Paciente[]
  doctors: Medico[]
  status: DirectoryStatus
  cachedAt: number | null
  pending: DirectoryMutation[]
}

const EMPTY_STATE: DirectoryState = {
  patients: [],
  doctors: [],
  status: 'idle',
  cachedAt: null,
  pending: [],
}

function normalizedDigits(value: string) {
  return value.replace(/\D/g, '')
}

function normalizedRegister(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}

function applyMutation(
  patients: Paciente[],
  doctors: Medico[],
  mutation: DirectoryMutation
): { patients: Paciente[]; doctors: Medico[] } {
  const patientDoc = normalizedDigits(mutation.paciente.numero_documento)
  const patientIndex = patients.findIndex(
    (patient) => normalizedDigits(patient.numero_doc) === patientDoc
  )
  const patient: Paciente = {
    id: patientIndex >= 0 ? patients[patientIndex].id : -mutation.queuedAt,
    nome_completo: mutation.paciente.nome,
    tipo_doc: mutation.paciente.tipo_documento,
    numero_doc: mutation.paciente.numero_documento,
    cargo: mutation.paciente.cargo,
    empresa: mutation.paciente.empresa,
  }
  const nextPatients = patientIndex >= 0
    ? patients.map((item, index) => index === patientIndex ? patient : item)
    : [patient, ...patients]

  const doctorReg = normalizedRegister(mutation.medico.numero_registro)
  const doctorIndex = doctors.findIndex(
    (doctor) =>
      doctor.tipo_crm === mutation.medico.tipo_registro &&
      normalizedRegister(doctor.crm) === doctorReg
  )
  const doctor: Medico = {
    id: doctorIndex >= 0 ? doctors[doctorIndex].id : -(mutation.queuedAt + 1),
    nome_completo: mutation.medico.nome,
    tipo_crm: mutation.medico.tipo_registro,
    crm: mutation.medico.numero_registro,
    uf_crm: mutation.medico.uf_registro,
  }
  const nextDoctors = doctorIndex >= 0
    ? doctors.map((item, index) => index === doctorIndex ? doctor : item)
    : [doctor, ...doctors]

  return { patients: nextPatients, doctors: nextDoctors }
}

function applyPending(
  patients: Paciente[],
  doctors: Medico[],
  pending: DirectoryMutation[]
) {
  return pending.reduce(
    (current, mutation) => applyMutation(current.patients, current.doctors, mutation),
    { patients, doctors }
  )
}

function buildMutation(formData: AppFormData): DirectoryMutation {
  const randomId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    id: randomId,
    queuedAt: Date.now(),
    paciente: {
      nome: formData.nomePaciente.trim(),
      tipo_documento: formData.tipoDocumento,
      numero_documento: formData.numeroDocumento,
      cargo: formData.cargo.trim(),
      empresa: formData.empresa.trim(),
    },
    medico: {
      nome: formData.nomeMedico.trim(),
      tipo_registro: formData.tipoRegistro,
      numero_registro: formData.numeroRegistro.trim(),
      uf_registro: formData.ufRegistro,
    },
  }
}

function sameMutationTarget(a: DirectoryMutation, b: DirectoryMutation) {
  return (
    normalizedDigits(a.paciente.numero_documento) === normalizedDigits(b.paciente.numero_documento) &&
    a.medico.tipo_registro === b.medico.tipo_registro &&
    normalizedRegister(a.medico.numero_registro) === normalizedRegister(b.medico.numero_registro)
  )
}

export function useClinicDirectory(enabled: boolean) {
  const [state, setState] = useState<DirectoryState>(EMPTY_STATE)
  const stateRef = useRef(state)
  const session = useRef(new AbortController())
  const epoch = useRef(0)
  const persistence = useRef<Promise<void>>(Promise.resolve())
  const refreshPromise = useRef<Promise<void> | null>(null)
  const flushPromise = useRef<Promise<void> | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const persist = useCallback(async (next: DirectoryState) => {
    if (!next.cachedAt) return
    const snapshot: DirectorySnapshot = {
      version: 1,
      cachedAt: next.cachedAt,
      patients: next.patients,
      doctors: next.doctors,
      pending: next.pending,
    }
    const operationEpoch = epoch.current
    persistence.current = persistence.current.catch(() => undefined).then(async () => {
      if (operationEpoch === epoch.current && !session.current.signal.aborted) await writeDirectoryCache(snapshot)
    })
    await persistence.current
  }, [])

  const flushPending = useCallback(async () => {
    if (!enabled) return
    if (flushPromise.current) return flushPromise.current

    const operationEpoch = epoch.current
    const signal = session.current.signal
    const queued = [...stateRef.current.pending]
    if (queued.length === 0) return

    const job = (async () => {
      const syncedIds = new Set<string>()

      for (const mutation of queued) {
        if (operationEpoch !== epoch.current || signal.aborted) return
        try {
          await syncDirectoryEntry({
            paciente: mutation.paciente,
            medico: mutation.medico,
          }, signal)
          syncedIds.add(mutation.id)
        } catch {
          // Mantém na fila local para retry em reconexão/refresh.
        }
      }

      if (syncedIds.size === 0 || operationEpoch !== epoch.current || signal.aborted) return

      const current = stateRef.current
      const next: DirectoryState = {
        ...current,
        pending: current.pending.filter((mutation) => !syncedIds.has(mutation.id)),
        status: current.status === 'error' ? 'cache' : current.status,
      }
      stateRef.current = next
      setState(next)
      await persist(next)
    })().finally(() => {
      if (operationEpoch === epoch.current) flushPromise.current = null
    })

    flushPromise.current = job
    return job
  }, [enabled, persist])

  const refresh = useCallback(async () => {
    if (!enabled) return
    if (refreshPromise.current) return refreshPromise.current

    const operationEpoch = epoch.current
    const signal = session.current.signal
    const job = (async () => {
      setState((current) => ({
        ...current,
        status: current.patients.length || current.doctors.length ? 'syncing' : 'loading',
      }))

      try {
        const payload = await fetchDirectory(signal)
        if (operationEpoch !== epoch.current || signal.aborted) return
        const current = stateRef.current
        const merged = applyPending(payload.patients, payload.doctors, current.pending)
        const next: DirectoryState = {
          patients: merged.patients,
          doctors: merged.doctors,
          status: current.pending.length ? 'cache' : 'fresh',
          cachedAt: Date.now(),
          pending: current.pending,
        }
        stateRef.current = next
        setState(next)
        await persist(next)
        if (next.pending.length) void flushPending()
      } catch {
        if (operationEpoch !== epoch.current || signal.aborted) return
        const current = stateRef.current
        const next: DirectoryState = {
          ...current,
          status: current.patients.length || current.doctors.length ? 'stale' : 'error',
        }
        stateRef.current = next
        setState(next)
      }
    })().finally(() => {
      if (operationEpoch === epoch.current) refreshPromise.current = null
    })

    refreshPromise.current = job
    return job
  }, [enabled, flushPending, persist])

  useEffect(() => {
    if (!enabled) { stateRef.current = EMPTY_STATE; setState(EMPTY_STATE); return }
    const controller = new AbortController()
    const lifecycleEpoch = epoch
    session.current = controller
    let active = true

    const bootstrap = async () => {
      setState((current) => ({ ...current, status: 'loading' }))
      const cached = await readDirectoryCache()
      if (!active) return

      if (cached) {
        const next: DirectoryState = {
          patients: cached.patients,
          doctors: cached.doctors,
          status: 'cache',
          cachedAt: cached.cachedAt,
          pending: cached.pending,
        }
        stateRef.current = next
        setState(next)
        if (cached.pending.length) void flushPending()
      }

      void refresh()
    }

    void bootstrap()
    return () => {
      active = false
      lifecycleEpoch.current++
      controller.abort()
      refreshPromise.current = null
      flushPromise.current = null
    }
  }, [enabled, flushPending, refresh])

  useEffect(() => {
    if (!enabled) return

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) {
        void refresh()
        void flushPending()
      }
    }, 15 * 60 * 1000)

    const handleOnline = () => {
      void refresh()
      void flushPending()
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, flushPending, refresh])

  const rememberForm = useCallback((formData: AppFormData) => {
    if (!enabled || session.current.signal.aborted) return
    const mutation = buildMutation(formData)
    const current = stateRef.current
    const optimistic = applyMutation(current.patients, current.doctors, mutation)
    const pending = [
      ...current.pending.filter((item) => !sameMutationTarget(item, mutation)),
      mutation,
    ]
    const next: DirectoryState = {
      ...current,
      patients: optimistic.patients,
      doctors: optimistic.doctors,
      cachedAt: Date.now(),
      pending,
      status: current.status === 'error' ? 'cache' : current.status,
    }

    stateRef.current = next
    setState(next)
    void persist(next)
    void Promise.resolve(flushPending()).then(() => {
      if (stateRef.current.pending.length > 0 && navigator.onLine !== false) {
        void flushPending()
      }
    })
  }, [enabled, flushPending, persist])

  const clear = useCallback(async () => {
    epoch.current++
    session.current.abort()
    refreshPromise.current = null
    flushPromise.current = null
    stateRef.current = EMPTY_STATE
    setState(EMPTY_STATE)
    await persistence.current.catch(() => undefined)
    await clearDirectoryCache()
  }, [])

  return {
    patients: state.patients,
    doctors: state.doctors,
    status: state.status,
    cachedAt: state.cachedAt,
    pendingCount: state.pending.length,
    refresh,
    rememberForm,
    clear,
  }
}
