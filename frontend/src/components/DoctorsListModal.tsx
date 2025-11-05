import { X, Stethoscope, MapPin, Award } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../config/api'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch(api.endpoints.medicos)
        .then(res => res.json())
        .then(data => {
          setMedicos(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Erro ao carregar médicos:', err)
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
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Médicos Cadastrados</h2>
              <p className="text-emerald-100 text-sm">Total: {medicos.length} registro{medicos.length !== 1 ? 's' : ''}</p>
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
              <p className="text-gray-600 dark:text-gray-400 mt-4">Carregando médicos...</p>
            </div>
          ) : medicos.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">Nenhum médico cadastrado ainda</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {medicos.map((medico, index) => (
                <div
                  key={medico.id}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {medico.nome_completo}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold">{medico.tipo_crm}:</span>
                          <span>{medico.crm}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="font-semibold">UF:</span>
                          <span>{medico.uf_crm}</span>
                        </div>
                        {medico.especialidade && (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Stethoscope className="w-4 h-4 text-emerald-600" />
                            <span>{medico.especialidade}</span>
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
