import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        loadPatients()
      } else {
        setPatients([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const results = await searchPatients(search)
      setPatients(results)
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error)
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (patient: Paciente) => {
    onSelect(patient)
    setSearch('')
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="input-field flex-1 border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-secondary-50 focus:border-primary-500 focus:ring-4 focus:ring-primary-400/20 shadow-lg placeholder:text-primary-400 transition-all duration-200"
          placeholder="Buscar paciente cadastrado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
      </div>

      {showResults && patients.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelect(patient)}
              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{patient.nome_completo}</p>
                  <p className="text-xs text-gray-500">
                    {patient.tipo_doc}: {patient.numero_doc} • {patient.cargo || 'Sem cargo'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && search.length >= 2 && patients.length === 0 && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-500 text-center">Nenhum paciente encontrado</p>
        </div>
      )}
    </div>
  )
}
