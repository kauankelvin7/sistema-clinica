import { useEffect, useState } from 'react'
import { User, Trophy } from 'lucide-react'
import api from '../services/api'

interface PatientRanking {
  id: number
  nome: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  empresa: string
  homologacoes: number
}

interface RankingModalProps {
  open: boolean
  onClose: () => void
}

export default function RankingModal({ open, onClose }: RankingModalProps) {
  const [ranking, setRanking] = useState<PatientRanking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      api.get('/api/patients/ranking')
        .then(res => setRanking(res.data))
        .catch(() => setRanking([]))
        .finally(() => setLoading(false))
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative border border-gray-200 dark:border-gray-700">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Fechar ranking"
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-7 h-7 text-amber-500" />
          <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-slate-100">Ranking de Pacientes</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Pacientes com mais homologações (atestados gerados)</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-800">
                <th className="px-3 py-2 text-left font-semibold">#</th>
                <th className="px-3 py-2 text-left font-semibold">Nome</th>
                <th className="px-3 py-2 text-left font-semibold">Documento</th>
                <th className="px-3 py-2 text-left font-semibold">Homologações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6">Carregando...</td></tr>
              ) : ranking.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6">Nenhum paciente encontrado</td></tr>
              ) : ranking.map((p, i) => (
                <tr key={p.id} className="hover:bg-primary-50 dark:hover:bg-primary-900/20 transition">
                  <td className="px-3 py-2 font-bold text-primary-600 dark:text-primary-300">{i + 1}</td>
                  <td className="px-3 py-2 flex items-center gap-2"><User className="w-4 h-4 text-primary-500" />{p.nome}</td>
                  <td className="px-3 py-2">{p.tipo_documento}: {p.numero_documento}</td>
                  <td className="px-3 py-2 font-semibold">{p.homologacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
