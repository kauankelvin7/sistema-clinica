import { useState, useEffect } from 'react'
import { Search, Stethoscope } from 'lucide-react'
import { searchDoctors } from '../services/api'
import type { Medico } from '../types'

interface DoctorSearchProps {
  onSelect: (doctor: Medico) => void
}

export default function DoctorSearch({ onSelect }: DoctorSearchProps) {
  const [search, setSearch] = useState('')
  const [doctors, setDoctors] = useState<Medico[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        loadDoctors()
      } else {
        setDoctors([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const loadDoctors = async () => {
    try {
      setLoading(true)
      const results = await searchDoctors(search)
      setDoctors(results)
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao buscar médicos:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (doctor: Medico) => {
    onSelect(doctor)
    setSearch('')
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          className={
            `input-field flex-1 border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-secondary-50 focus:border-primary-500 focus:ring-4 focus:ring-primary-400/20 shadow-lg transition-all duration-200 ` +
            (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
              ? 'placeholder:text-slate-400'
              : 'placeholder:text-primary-400')
          }
          placeholder="Buscar médico cadastrado..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
      </div>

      {showResults && doctors.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {doctors.map((doctor) => (
            <button
              key={doctor.id}
              onClick={() => handleSelect(doctor)}
              className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{doctor.nome_completo}</p>
                  <p className="text-xs text-gray-500">
                    {doctor.tipo_crm}: {doctor.crm} - {doctor.uf_crm}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && search.length >= 2 && doctors.length === 0 && !loading && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-500 text-center">Nenhum médico encontrado</p>
        </div>
      )}
    </div>
  )
}
