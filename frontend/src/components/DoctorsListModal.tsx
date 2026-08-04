import { X, Stethoscope, MapPin, Award, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { searchDoctors } from '../services/api'
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
  onSelect?: (medico: Medico) => void
}

const PAGE_SIZE = 25

export default function DoctorsListModal({ isOpen, onClose, onSelect }: Props) {
  const { t } = useTranslation()
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoCRM, setFilterTipoCRM] = useState<'TODOS' | 'CRM' | 'CRO' | 'RMS'>('TODOS')
  const [filterUF, setFilterUF] = useState<string>('TODAS')
  const [ufs, setUfs] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback((search: string, targetPage: number) => {
    setLoading(true)
    searchDoctors(search || undefined, targetPage, PAGE_SIZE)
      .then(data => {
        const doctorsList = data.doctors || []
        setMedicos(doctorsList)
        setTotal(data.total || 0)

        // Atualiza lista de UFs disponíveis apenas na primeira página sem filtro
        if (targetPage === 1 && !search) {
          const uniqueUFs = Array.from(new Set(doctorsList.map((m: Medico) => m.uf_crm))) as string[]
          setUfs(uniqueUFs.sort())
        }

        setLoading(false)
      })
      .catch(() => {
        setMedicos([])
        setTotal(0)
        setLoading(false)
      })
  }, [])

  // Carregar ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      setSearchTerm('')
      setFilterTipoCRM('TODOS')
      setFilterUF('TODAS')
      fetchPage('', 1)
    }
  }, [isOpen, fetchPage])

  // Trancar scroll do body enquanto aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Busca com debounce de 400ms
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPage(value, 1)
    }, 400)
  }

  // Troca de página
  const goToPage = (newPage: number) => {
    setPage(newPage)
    fetchPage(searchTerm, newPage)
  }

  // Filtro local por tipo CRM e UF (sobre a página atual)
  const filteredMedicos = medicos.filter(m => {
    if (filterTipoCRM !== 'TODOS' && m.tipo_crm !== filterTipoCRM) return false
    if (filterUF !== 'TODAS' && m.uf_crm !== filterUF) return false
    return true
  })

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 dark:bg-black/90 backdrop-blur-md pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-5xl h-[82vh] max-h-[760px] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-200 my-auto">

        {/* Header Adaptativo Glassmorphism */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-500/10 dark:bg-zinc-400/15 border border-zinc-500/20 dark:border-zinc-400/25 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0 shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {t.modalDoctorsTitle}
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {loading
                  ? 'Carregando...'
                  : `${filteredMedicos.length} exibidos nesta página · ${total} no total`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros Modernizados */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-200/80 dark:border-zinc-800/80 p-3 sm:p-4 space-y-3 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-garnet-500 transition-colors" />
            <input
              type="text"
              placeholder={t.searchDoctorsPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              className="input-field pl-10 py-2 text-xs sm:text-sm bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-garnet-500 shrink-0" />
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
                className="bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-garnet-500 shadow-xs cursor-pointer"
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
              <div className="animate-spin w-9 h-9 border-3 border-garnet-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-xs text-zinc-500 font-medium">Buscando lista de médicos...</p>
            </div>
          ) : filteredMedicos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Nenhum médico encontrado</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                {t.noDoctorsFound}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 sm:gap-4">
              {filteredMedicos.map((medico, index) => (
                <div
                  key={medico.id}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(medico)
                      onClose()
                    }
                  }}
                  className={`bg-white dark:bg-surface-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4.5 transition-all duration-200 group ${
                    onSelect ? 'cursor-pointer hover:border-garnet-500/60 hover:shadow-lg active:scale-[0.995]' : 'hover:border-garnet-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-garnet-500/10 dark:bg-garnet-500/15 border border-garnet-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-garnet-500 transition-colors duration-200 mt-0.5">
                      <span className="text-garnet-600 dark:text-garnet-400 font-bold text-xs group-hover:text-white transition-colors">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3
                        className="text-sm sm:text-base font-bold text-garnet-600 dark:text-garnet-400 leading-snug truncate min-w-0 mb-2 group-hover:text-garnet-500 transition-colors"
                        title={medico.nome_completo}
                      >
                        {medico.nome_completo}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-full">
                        <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50 max-w-full min-w-0">
                          <Award className="w-3.5 h-3.5 text-garnet-500 shrink-0" />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">{medico.tipo_crm}:</span>
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate min-w-0">{medico.crm}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50 shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-garnet-500 shrink-0" />
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

        {/* Paginação */}
        {!loading && total > PAGE_SIZE && (
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              Página <span className="text-zinc-800 dark:text-zinc-200 font-bold">{page}</span> de <span className="text-zinc-800 dark:text-zinc-200 font-bold">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-100 hover:bg-garnet-500 dark:bg-zinc-800 dark:hover:bg-garnet-500 text-zinc-700 hover:text-white dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 hover:border-garnet-500"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-100 hover:bg-garnet-500 dark:bg-zinc-800 dark:hover:bg-garnet-500 text-zinc-700 hover:text-white dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 hover:border-garnet-500"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
