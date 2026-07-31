import { useState, useEffect } from 'react'
import { Search, Stethoscope, ExternalLink } from 'lucide-react'
import { searchDoctors } from '../services/api'
import type { Medico } from '../types'
import ConsultaOnlineModal from './ConsultaOnlineModal'

interface DoctorSearchProps {
  onSelect: (doctor: Medico) => void
}

export default function DoctorSearch({ onSelect }: DoctorSearchProps) {
  const [search, setSearch] = useState('')
  const [doctors, setDoctors] = useState<Medico[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estado para controlar o Modal de Consulta Externa
  const [modalRegistro, setModalRegistro] = useState<'CRM' | 'CRO' | 'RMS' | null>(null)

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
      console.log('[DoctorSearch] Buscando médicos:', search)
      const results = await searchDoctors(search)
      console.log('[DoctorSearch] Resultados recebidos:', results)
      const list = results.doctors || (Array.isArray(results) ? results : [])
      setDoctors(list)
      setShowResults(true)
    } catch (error) {
      console.error('[DoctorSearch] Erro ao buscar médicos:', error)
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
      {/* Input de Busca (Tema Zinc/Orange) */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
        <input
          type="text"
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
          placeholder="Buscar médico cadastrado ou CRM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          // Atraso aumentado para dar tempo de clicar no botão "Consultar Online" sem fechar a lista
          onBlur={() => setTimeout(() => setShowResults(false), 250)}
        />
      </div>

      {/* Dropdown de Resultados */}
      {showResults && search.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          {/* Lista Interna */}
          {doctors.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => handleSelect(doctor)}
                  className="w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                      <Stethoscope className="w-5 h-5 text-zinc-400 group-hover:text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{doctor.nome_completo}</p>
                      <p className="text-xs font-medium text-zinc-500 mt-0.5">
                        {doctor.tipo_crm}: {doctor.crm} - {doctor.uf_crm}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // Empty State quando não acha internamente
            !loading && (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-500 font-medium">Nenhum médico encontrado no sistema.</p>
              </div>
            )
          )}

          {/* Rodapé Dinâmico: Consultar em Base Nacional (Sempre visível ao buscar) */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 text-center">
              Consultar Base Nacional
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setModalRegistro('CRM')}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-500 transition-all text-zinc-600 dark:text-zinc-400"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs font-bold">CRM</span>
              </button>
              <button 
                onClick={() => setModalRegistro('CRO')}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-500 transition-all text-zinc-600 dark:text-zinc-400"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs font-bold">Dentista</span>
              </button>
              <button 
                onClick={() => setModalRegistro('RMS')}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-500 transition-all text-zinc-600 dark:text-zinc-400"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs font-bold">RMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renderiza o Modal se acionado */}
      <ConsultaOnlineModal 
        isOpen={!!modalRegistro} 
        onClose={() => setModalRegistro(null)} 
        tipoRegistro={modalRegistro}
      />
    </div>
  )
}
