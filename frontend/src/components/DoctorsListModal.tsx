import { X, Stethoscope, MapPin, Award, Search, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import { searchDoctors } from '../services/api'
import { normalizeText } from '../utils/normalize'
import { useTranslation } from '../utils/i18n'

interface Medico {
  id: number
  nome_completo: string
  tipo_crm: string
  crm: string
  uf_crm: string
  especialidade?: string
  telefone?: string
  email?: string
  created_at?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function DoctorsListModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoCRM, setFilterTipoCRM] = useState<'TODOS' | 'CRM' | 'CRO' | 'RMS'>('TODOS')
  const [filterUF, setFilterUF] = useState<string>('TODAS')
  const [ufs, setUfs] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      searchDoctors()
        .then(data => {
          const doctorsList = (data as any).doctors || (Array.isArray(data) ? data : []);
          setMedicos(doctorsList)
          setFilteredMedicos(doctorsList)
          
          const uniqueUFs = Array.from(new Set(
            doctorsList.map((m: Medico) => m.uf_crm)
          )) as string[]
          setUfs(uniqueUFs.sort())
          
          setLoading(false)
        })
        .catch(() => {
          setMedicos([])
          setFilteredMedicos([])
          setLoading(false)
        })
    }
  }, [isOpen])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...medicos]

    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm)
      filtered = filtered.filter(m =>
        normalizeText(m.nome_completo).includes(normalizedSearch) ||
        normalizeText(m.crm).includes(normalizedSearch) ||
        (m.especialidade && normalizeText(m.especialidade).includes(normalizedSearch))
      )
    }

    if (filterTipoCRM !== 'TODOS') {
      filtered = filtered.filter(m => m.tipo_crm === filterTipoCRM)
    }

    if (filterUF !== 'TODAS') {
      filtered = filtered.filter(m => m.uf_crm === filterUF)
    }

    setFilteredMedicos(filtered)
  }, [searchTerm, filterTipoCRM, filterUF, medicos])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Header Adaptativo Glassmorphism */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-5 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-500/10 dark:bg-zinc-400/15 border border-zinc-500/20 dark:border-zinc-400/25 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {t.modalDoctorsTitle}
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {filteredMedicos.length} / {medicos.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros Modernizados */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800/80 p-3 sm:p-4 space-y-3 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder={t.searchDoctorsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2 text-xs sm:text-sm bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={filterTipoCRM}
                onChange={(e) => setFilterTipoCRM(e.target.value as 'TODOS' | 'CRM' | 'CRO' | 'RMS')}
                className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer pr-2"
              >
                <option value="TODOS" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">CRM / CRO / RMS</option>
                <option value="CRM" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">CRM</option>
                <option value="CRO" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">CRO</option>
                <option value="RMS" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">RMS</option>
              </select>
            </div>

            {ufs.length > 0 && (
              <select
                value={filterUF}
                onChange={(e) => setFilterUF(e.target.value)}
                className="bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-orange-500 shadow-xs cursor-pointer"
              >
                <option value="TODAS" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">UF (Todas)</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">{uf}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de Médicos */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-zinc-50/40 dark:bg-surface-page/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full mb-3"></div>
            </div>
          ) : filteredMedicos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                <Stethoscope className="w-7 h-7" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                {t.noDoctorsFound}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredMedicos.map((medico, index) => (
                <div
                  key={medico.id}
                  className="bg-white dark:bg-surface-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-4.5 hover:border-orange-500/40 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors duration-200">
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm group-hover:text-white transition-colors">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400 leading-snug break-words mb-2.5 group-hover:text-orange-500 transition-colors">
                        {medico.nome_completo}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                          <Award className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{medico.tipo_crm}:</span>
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{medico.crm}</span>
                        </div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">UF:</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{medico.uf_crm}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
