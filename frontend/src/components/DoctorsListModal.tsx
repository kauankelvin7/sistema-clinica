import { X, Stethoscope, MapPin, Award, Search, Filter } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../config/api'
import { normalizeText } from '../utils/normalize'

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
      fetch(api.endpoints.medicos)
        .then(res => res.json())
        .then(data => {
          setMedicos(data)
          setFilteredMedicos(data)
          
          // Extrair lista única de UFs
          const uniqueUFs = Array.from(new Set(
            data.map((m: Medico) => m.uf_crm)
          )) as string[]
          setUfs(uniqueUFs.sort())
          
          setLoading(false)
        })
        .catch(err => {
          console.error('Erro ao carregar médicos:', err)
          setMedicos([])
          setFilteredMedicos([])
          setLoading(false)
        })
    }
  }, [isOpen])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...medicos]

    // Filtro por termo de busca (nome, CRM, especialidade) - ignorando acentos
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm)
      filtered = filtered.filter(m =>
        normalizeText(m.nome_completo).includes(normalizedSearch) ||
        normalizeText(m.crm).includes(normalizedSearch) ||
        (m.especialidade && normalizeText(m.especialidade).includes(normalizedSearch))
      )
    }

    // Filtro por tipo de registro
    if (filterTipoCRM !== 'TODOS') {
      filtered = filtered.filter(m => m.tipo_crm === filterTipoCRM)
    }

    // Filtro por UF
    if (filterUF !== 'TODAS') {
      filtered = filtered.filter(m => m.uf_crm === filterUF)
    }

    setFilteredMedicos(filtered)
  }, [searchTerm, filterTipoCRM, filterUF, medicos])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterTipoCRM('TODOS')
    setFilterUF('TODAS')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-300">
        
        {/* Header Premium Glassmorphism */}
        <div className="bg-zinc-900 dark:bg-black p-6 sm:p-8 flex items-center justify-between border-b border-zinc-800 relative overflow-hidden">
          {/* Efeito Glow no fundo do Header */}
          <div className="absolute top-0 left-0 w-full h-full bg-orange-500/10 blur-2xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-0.5">Médicos Cadastrados</h2>
              <p className="text-zinc-400 text-sm font-medium">
                {filteredMedicos.length} de {medicos.length} registro{medicos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 w-10 h-10 bg-zinc-800/50 hover:bg-orange-500/20 rounded-xl flex items-center justify-center transition-colors border border-zinc-700/50 hover:border-orange-500/50 group"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shrink-0">
          {/* Busca por texto */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome, CRM ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <Filter className="w-4 h-4 text-orange-500 shrink-0" />
              <select
                value={filterTipoCRM}
                onChange={(e) => setFilterTipoCRM(e.target.value as 'TODOS' | 'CRM' | 'CRO' | 'RMS')}
                className="py-2.5 bg-transparent text-sm font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none pr-6"
              >
                <option value="TODOS">Todos Registros</option>
                <option value="CRM">CRM</option>
                <option value="CRO">CRO</option>
                <option value="RMS">RMS</option>
              </select>
            </div>

            {ufs.length > 0 && (
              <select
                value={filterUF}
                onChange={(e) => setFilterUF(e.target.value)}
                className="py-2.5 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer appearance-none pr-8"
              >
                <option value="TODAS">Todas UFs</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            )}

            {/* Botão Limpar Filtros */}
            {(searchTerm || filterTipoCRM !== 'TODOS' || filterUF !== 'TODAS') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-500/10 text-zinc-600 hover:text-rose-600 dark:text-zinc-300 dark:hover:text-rose-400 text-sm font-bold rounded-xl transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Content (Listagem) */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/50 dark:bg-zinc-950/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-zinc-500 font-medium">Buscando base de médicos...</p>
            </div>
          ) : filteredMedicos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-5">
                <Stethoscope className="w-10 h-10 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nenhum médico encontrado</h3>
              <p className="text-zinc-500 max-w-md">
                {medicos.length === 0 
                  ? 'A base de dados de médicos está vazia no momento.' 
                  : 'Nenhum médico corresponde aos filtros de busca aplicados.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMedicos.map((medico, index) => (
                <div
                  key={medico.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-md hover:border-orange-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-5">
                    {/* Número/Avatar Laranja */}
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20 group-hover:bg-orange-500 transition-colors duration-300">
                      <span className="text-orange-600 dark:text-orange-400 font-black text-lg group-hover:text-white transition-colors">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white mb-3 truncate">
                        {medico.nome_completo}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Award className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{medico.tipo_crm}:</span>
                          <span>{medico.crm}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <MapPin className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">UF:</span>
                          <span>{medico.uf_crm}</span>
                        </div>
                        {medico.especialidade && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Stethoscope className="w-4 h-4 text-orange-500" />
                            <span className="font-medium truncate">{medico.especialidade}</span>
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
      </div>
    </div>
  )
}
