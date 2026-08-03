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
      {/* Input de Busca */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
        <input
          type="text"
          className="input-field pl-10 pr-4 py-2.5"
          placeholder="Buscar médico cadastrado ou CRM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 250)}
        />
      </div>

      {/* Dropdown de Resultados */}
      {showResults && search.length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Lista Interna */}
          {doctors.length > 0 ? (
            <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => handleSelect(doctor)}
                  className="w-full p-3 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 rounded-xl transition-all flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors">
                    <Stethoscope className="w-4 h-4 text-orange-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-orange-500 transition-colors">
                      {doctor.nome_completo}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {doctor.tipo_crm}: {doctor.crm} - {doctor.uf_crm}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="p-4 text-center">
                <p className="text-xs text-zinc-500 font-medium">Nenhum médico encontrado no sistema.</p>
              </div>
            )
          )}

          {/* Rodapé Dinâmico: Consultar em Base Nacional */}
          <div className="bg-zinc-50/80 dark:bg-zinc-950/60 p-3 border-t border-zinc-200 dark:border-zinc-800/80">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 text-center">
              Consultar Base Nacional
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setModalRegistro('CRM')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-orange-500/40 hover:text-orange-500 text-zinc-700 dark:text-zinc-300 transition-all text-xs font-bold shadow-xs group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                <span>CRM</span>
              </button>
              <button 
                onClick={() => setModalRegistro('CRO')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-orange-500/40 hover:text-orange-500 text-zinc-700 dark:text-zinc-300 transition-all text-xs font-bold shadow-xs group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                <span>Dentista</span>
              </button>
              <button 
                onClick={() => setModalRegistro('RMS')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 hover:border-orange-500/40 hover:text-orange-500 text-zinc-700 dark:text-zinc-300 transition-all text-xs font-bold shadow-xs group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                <span>RMS</span>
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
