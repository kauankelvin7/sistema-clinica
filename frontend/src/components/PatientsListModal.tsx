import { X, User, Phone, Mail, Briefcase, Building2, Search, Filter, Hash, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { searchPatients } from '../services/api'

interface Paciente {
  id: number
  nome_completo: string
  tipo_doc: string
  numero_doc: string
  cargo?: string
  empresa?: string
  telefone?: string
  email?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const PAGE_SIZE = 25

export default function PatientsListModal({ isOpen, onClose }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filtros locais (operam sobre a página atual)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoDoc, setFilterTipoDoc] = useState<'TODOS' | 'CPF' | 'RG'>('TODOS')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback((search: string, targetPage: number) => {
    setLoading(true)
    console.log('[PatientsListModal] Carregando pacientes...', { search, targetPage })
    searchPatients(search || undefined, targetPage, PAGE_SIZE)
      .then(data => {
        console.log('[PatientsListModal] Pacientes recebidos:', data)
        setPacientes(data.patients || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[PatientsListModal] Erro ao carregar pacientes:', err)
        setPacientes([])
        setTotal(0)
        setLoading(false)
      })
  }, [])

  // Carregar ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      setSearchTerm('')
      setFilterTipoDoc('TODOS')
      fetchPage('', 1)
    }
  }, [isOpen, fetchPage])

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

  // Filtro local por tipo de documento
  const filteredPacientes = filterTipoDoc === 'TODOS'
    ? pacientes
    : pacientes.filter(p => p.tipo_doc === filterTipoDoc)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-200">

        {/* Header Adaptativo Glassmorphism */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-5 sm:px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                Pacientes Cadastrados
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {loading
                  ? 'Buscando registros...'
                  : `${filteredPacientes.length} exibidos · ${total} no total`
                }
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
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="input-field pl-10 py-2 text-xs sm:text-sm bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <select
                value={filterTipoDoc}
                onChange={(e) => setFilterTipoDoc(e.target.value as 'TODOS' | 'CPF' | 'RG')}
                className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer pr-2"
              >
                <option value="TODOS" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Todos Documentos</option>
                <option value="CPF" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">CPF</option>
                <option value="RG" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">RG</option>
              </select>
            </div>

            {(searchTerm || filterTipoDoc !== 'TODOS') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterTipoDoc('TODOS')
                  setPage(1)
                  fetchPage('', 1)
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-500/10 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 text-xs font-semibold rounded-xl transition-all border border-zinc-200 dark:border-zinc-700 ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Pacientes - Layout Fluido Sem Corte */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-zinc-50/40 dark:bg-surface-page/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-xs text-zinc-500 font-medium">Buscando pacientes...</p>
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Nenhum paciente encontrado</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                {total === 0
                  ? 'A base de dados de pacientes está vazia no momento.'
                  : 'Nenhum paciente corresponde aos filtros aplicados.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPacientes.map((paciente, index) => (
                <div
                  key={paciente.id}
                  className="bg-white dark:bg-surface-card border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-4.5 hover:border-orange-500/40 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Badge numérica compacta */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-colors duration-200">
                      <span className="text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm group-hover:text-white transition-colors">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nome Completo */}
                      <h3 className="text-sm sm:text-base font-bold text-orange-600 dark:text-orange-400 leading-snug break-words mb-2.5 group-hover:text-orange-500 transition-colors">
                        {paciente.nome_completo}
                      </h3>
                      
                      {/* Metadados: Flex Wrap limpo sem caixas espremidas e sem break-all em numeros */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                          <Hash className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{paciente.tipo_doc}:</span>
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{paciente.numero_doc}</span>
                        </div>

                        {paciente.cargo && (
                          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                            <Briefcase className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{paciente.cargo}</span>
                          </div>
                        )}

                        {paciente.empresa && (
                          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                            <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{paciente.empresa}</span>
                          </div>
                        )}

                        {paciente.telefone && (
                          <div className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                            <Phone className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{paciente.telefone}</span>
                          </div>
                        )}

                        {paciente.email && (
                          <div className="flex items-center gap-1.5 bg-zinc-100/70 dark:bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-200/50 dark:border-zinc-700/50">
                            <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{paciente.email}</span>
                          </div>
                        )}
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
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Página <span className="font-bold text-zinc-800 dark:text-zinc-200">{page}</span> de <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-zinc-100 hover:bg-orange-500 dark:bg-zinc-800 dark:hover:bg-orange-500
                  text-zinc-700 hover:text-white dark:text-zinc-300 dark:hover:text-white
                  border border-zinc-200 dark:border-zinc-700 hover:border-orange-500"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-zinc-100 hover:bg-orange-500 dark:bg-zinc-800 dark:hover:bg-orange-500
                  text-zinc-700 hover:text-white dark:text-zinc-300 dark:hover:text-white
                  border border-zinc-200 dark:border-zinc-700 hover:border-orange-500"
              >
                Próximo
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
