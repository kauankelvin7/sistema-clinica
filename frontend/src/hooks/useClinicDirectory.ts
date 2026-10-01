import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDirectory } from '../services/api'
import {
  clearDirectoryCache,
  readDirectoryCache,
  writeDirectoryCache,
  type DirectorySnapshot,
} from '../services/directoryCache'
import type { AppFormData, Medico, Paciente } from '../types'

export type DirectoryStatus = 'idle' | 'loading' | 'cache' | 'syncing' | 'fresh' | 'stale' | 'error'

interface DirectoryState {
  patients: Paciente[]
  doctors: Medico[]
  status: DirectoryStatus
  cachedAt: number | null
}

const EMPTY_STATE: DirectoryState = {
  patients: [],
  doctors: [],
  status: 'idle',
  cachedAt: null,
}

export function useClinicDirectory(enabled: boolean) {
  const [state, setState] = useState<DirectoryState>(EMPTY_STATE)
  const refreshPromise = useRef<Promise<void> | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const persist = useCallback(async (
    patients: Paciente[],
    doctors: Medico[],
    cachedAt = Date.now()
  ) => {
    const snapshot: DirectorySnapshot = {
      version: 1,
      cachedAt,
      patients,
      doctors,
    }
    await writeDirectoryCache(snapshot)
  }, [])

  const refresh = useCallback(async () => {
    if (!enabled) return
    if (refreshPromise.current) return refreshPromise.current

    const job = (async () => {
      setState((current) => ({
        ...current,
        status: current.patients.length || current.doctors.length ? 'syncing' : 'loading',
      }))

      try {
        const payload = await fetchDirectory()
        const cachedAt = Date.now()
        setState({
          patients: payload.patients,
          doctors: payload.doctors,
          status: 'fresh',
          cachedAt,
        })
        await persist(payload.patients, payload.doctors, cachedAt)
      } catch {
        setState((current) => ({
          ...current,
          status: current.patients.length || current.doctors.length ? 'stale' : 'error',
        }))
      }
    })().finally(() => {
      refreshPromise.current = null
    })

    refreshPromise.current = job
    return job
  }, [enabled, persist])

  useEffect(() => {
    if (!enabled) return
    let active = true

    const bootstrap = async () => {
      setState((current) => ({ ...current, status: 'loading' }))
      const cached = await readDirectoryCache()
      if (!active) return

      if (cached) {
        setState({
          patients: cached.patients,
          doctors: cached.doctors,
          status: 'cache',
          cachedAt: cached.cachedAt,
        })
      }

      void refresh()
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled) return

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine !== false) {
        void refresh()
      }
    }, 15 * 60 * 1000)

    const handleOnline = () => void refresh()
    window.addEventListener('online', handleOnline)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, refresh])

  const rememberForm = useCallback((formData: AppFormData) => {
    const current = stateRef.current
    const normalizedDoc = formData.numeroDocumento.replace(/\D/g, '')
    const normalizedReg = formData.numeroRegistro.replace(/\s/g, '').toUpperCase()

    let patients = current.patients
    let doctors = current.doctors

    if (formData.nomePaciente.trim() && normalizedDoc) {
      const existingIndex = patients.findIndex(
        (patient) => patient.numero_doc.replace(/\D/g, '') === normalizedDoc
      )
      const patient: Paciente = {
        id: existingIndex >= 0 ? patients[existingIndex].id : -Date.now(),
        nome_completo: formData.nomePaciente.trim(),
        tipo_doc: formData.tipoDocumento,
        numero_doc: formData.numeroDocumento,
        cargo: formData.cargo.trim(),
        empresa: formData.empresa.trim(),
      }
      patients = existingIndex >= 0
        ? patients.map((item, index) => index === existingIndex ? patient : item)
        : [patient, ...patients]
    }

    if (formData.nomeMedico.trim() && normalizedReg) {
      const existingIndex = doctors.findIndex(
        (doctor) => doctor.tipo_crm === formData.tipoRegistro &&
          doctor.crm.replace(/\s/g, '').toUpperCase() === normalizedReg
      )
      const doctor: Medico = {
        id: existingIndex >= 0 ? doctors[existingIndex].id : -(Date.now() + 1),
        nome_completo: formData.nomeMedico.trim(),
        tipo_crm: formData.tipoRegistro,
        crm: formData.numeroRegistro.trim(),
        uf_crm: formData.ufRegistro,
      }
      doctors = existingIndex >= 0
        ? doctors.map((item, index) => index === existingIndex ? doctor : item)
        : [doctor, ...doctors]
    }

    const cachedAt = Date.now()
    const nextState = {
      ...current,
      patients,
      doctors,
      cachedAt,
      status: current.status === 'error' ? 'cache' as const : current.status,
    }
    stateRef.current = nextState
    setState(nextState)
    void persist(patients, doctors, cachedAt)
  }, [persist])

  const clear = useCallback(async () => {
    await clearDirectoryCache()
    stateRef.current = EMPTY_STATE
    setState(EMPTY_STATE)
  }, [])

  return {
    ...state,
    refresh,
    rememberForm,
    clear,
  }
}
