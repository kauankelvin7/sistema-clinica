import { X, User, Phone, Mail, Briefcase, Building2, Search, Filter, Hash } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../config/api'
import { normalizeText } from '../utils/normalize'

interface Paciente {
  id: number
  nome_completo: string
  tipo_doc: string
  numero_doc: string
  cargo?: string
  empresa?: string
  telefone?: string
  email?: string
  created_at?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function PatientsListModal({ isOpen, onClose }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [filteredPacientes, setFilteredPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipoDoc, setFilterTipoDoc] = useState<'TODOS' | 'CPF' | 'RG'>('TODOS')
  const [filterEmpresa, setFilterEmpresa] = useState<string>('TODAS')
  const [empresas, setEmpresas] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch(api.endpoints.pacientes)
        .then(res => res.json())
        .then(data => {
          setPacientes(data)
          setFilteredPacientes(data)
          
          // Extrair lista única de empresas
          const uniqueEmpresas = Array.from(new Set(
            data.map((p: Paciente) => p.empresa).filter(Boolean)
          )) as string[]
          setEmpresas(uniqueEmpresas.sort())
          
          setLoading(false)
        })
        .catch(err => {
          console.error('Erro ao carregar pacientes:', err)
          setPacientes([])
          setFilteredPacientes([])
          setLoading(false)
        })
    }
  }, [isOpen])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...pacientes]

    // Filtro por termo de busca (nome, documento, cargo, empresa) - ignorando acentos
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm)
      filtered = filtered.filter(p =>
        normalizeText(p.nome_completo).includes(normalizedSearch) ||
        normalizeText(p.numero_doc).includes(normalizedSearch) ||
        (p.cargo && normalizeText(p.cargo).includes(normalizedSearch)) ||
        (p.empresa && normalizeText(p.empresa).includes(normalizedSearch))
      )
    }

    // Filtro por tipo de documento
    if (filterTipoDoc !== 'TODOS') {
      filtered = filtered.filter(p => p.tipo_doc === filterTipoDoc)
    }

    // Filtro por empresa
    if (filterEmpresa !== 'TODAS') {
      filtered = filtered.filter(p => p.empresa === filterEmpresa)
    }

    setFilteredPacientes(filtered)
  }, [searchTerm, filterTipoDoc, filterEmpresa, pacientes])

  const clearFilters = () => {
    setSearchTerm('')
    setFilterTipoDoc('TODOS')
    setFilterEmpresa('TODAS')
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
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-0.5">Pacientes Cadastrados</h2>
              <p className="text-zinc-400 text-sm font-medium">
                {filteredPacientes.length} de {pacientes.length} registro{pacientes.length !== 1 ? 's' : ''}
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
              placeholder="Buscar por nome, documento, cargo ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
            />
          </div>

          {/* Filtros em linha */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro Tipo de Documento */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <Filter className="w-4 h-4 text-orange-500 shrink-0" />
              <select
                value={filterTipoDoc}
                onChange={(e) => setFilterTipoDoc(e.target.value as 'TODOS' | 'CPF' | 'RG')}
                className="py-2.5 bg-transparent text-sm font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none pr-6"
              >
                <option value="TODOS">Todos Documentos</option>
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
              </select>
            </div>

            {/* Filtro Empresa */}
            {empresas.length > 0 && (
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Building2 className="w-4 h-4 text-orange-500 shrink-0" />
                <select
                  value={filterEmpresa}
                  onChange={(e) => setFilterEmpresa(e.target.value)}
                  className="py-2.5 bg-transparent text-sm font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none pr-6 max-w-[200px] truncate"
                >
                  <option value="TODAS">Todas Empresas</option>
                  {empresas.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão Limpar Filtros */}
            {(searchTerm || filterTipoDoc !== 'TODOS' || filterEmpresa !== 'TODAS') && (
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
              <p className="text-zinc-500 font-medium">Buscando base de pacientes...</p>
            </div>
          ) : filteredPacientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-5">
                <User className="w-10 h-10 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Nenhum paciente encontrado</h3>
              <p className="text-zinc-500 max-w-md">
                {pacientes.length === 0 
                  ? 'A base de dados de pacientes está vazia no momento.' 
                  : 'Nenhum paciente corresponde aos filtros de busca aplicados.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPacientes.map((paciente, index) => (
                <div
                  key={paciente.id}
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
                        {paciente.nome_completo}
                      </h3>
                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {/* Tipo de Doc e Numero */}
                        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Hash className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-zinc-700 dark:text-zinc-300">{paciente.tipo_doc}:</span>
                          <span>{paciente.numero_doc}</span>
                        </div>
                        
                        {/* Cargo */}
                        {paciente.cargo && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Briefcase className="w-4 h-4 text-orange-500" />
                            <span className="font-medium truncate">{paciente.cargo}</span>
                          </div>
                        )}
                        
                        {/* Empresa */}
                        {paciente.empresa && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Building2 className="w-4 h-4 text-orange-500" />
                            <span className="font-medium truncate">{paciente.empresa}</span>
                          </div>
                        )}

                        {/* Telefone */}
                        {paciente.telefone && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Phone className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{paciente.telefone}</span>
                          </div>
                        )}

                        {/* Email */}
                        {paciente.email && (
                          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <Mail className="w-4 h-4 text-orange-500" />
                            <span className="font-medium truncate">{paciente.email}</span>
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
