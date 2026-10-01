import { useCallback, useEffect, useState } from 'react'
import { Search, User } from 'lucide-react'
import { searchPatients } from '../services/api'
import type { Paciente } from '../types'

interface PatientSearchProps {
  onSelect: (patient: Paciente) => void
}

export default function PatientSearch({ onSelect }: PatientSearchProps) {
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<Paciente[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true)
      const data = await searchPatients(search, 1, 20)
      setPatients(data.patients)
      setShowResults(true)
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        void loadPatients()
      } else {
        setPatients([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, loadPatients])

  const handleSelect = (patient: Paciente) => {
    onSelect(patient)
    setSearch('')
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-zinc-400" />
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Buscar paciente cadastrado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
      </div>

      {showResults && patients.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelect(patient)}
              className="w-full rounded-xl p-3 text-left transition-colors hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-garnet-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{patient.nome_completo}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {patient.tipo_doc}: {patient.numero_doc} • {patient.cargo || 'Sem cargo'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && search.length >= 2 && patients.length === 0 && !loading && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">Nenhum paciente encontrado</p>
        </div>
      )}
    </div>
  )
}
