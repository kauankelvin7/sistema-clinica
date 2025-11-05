import { X, User, Phone, Mail, Briefcase, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../config/api'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch(api.endpoints.pacientes)
        .then(res => res.json())
        .then(data => {
          setPacientes(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Erro ao carregar pacientes:', err)
          setLoading(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border-2 border-emerald-200 dark:border-emerald-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Pacientes Cadastrados</h2>
              <p className="text-emerald-100 text-sm">Total: {pacientes.length} registro{pacientes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando pacientes...</p>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum paciente cadastrado ainda</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pacientes.map((paciente, index) => (
                <div
                  key={paciente.id}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {paciente.nome_completo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{paciente.tipo_doc}:</span>
                          <span>{paciente.numero_doc}</span>
                        </div>
                        {paciente.cargo && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Briefcase className="w-4 h-4 text-emerald-600" />
                            <span>{paciente.cargo}</span>
                          </div>
                        )}
                        {paciente.empresa && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>{paciente.empresa}</span>
                          </div>
                        )}
                        {paciente.telefone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <span>{paciente.telefone}</span>
                          </div>
                        )}
                        {paciente.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4 text-emerald-600" />
                            <span className="truncate">{paciente.email}</span>
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
