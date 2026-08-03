import { useEffect, useState } from 'react'
import { User, Trophy, X } from 'lucide-react'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl p-6 w-full max-w-lg relative border border-zinc-200 dark:border-zinc-800 overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight">Ranking de Pacientes</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Pacientes com mais atestados homologados</p>
            </div>
          </div>
          
          <button
            className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center"
            onClick={onClose}
            aria-label="Fechar ranking"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabela de Ranking */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="px-3 py-2 text-left font-bold">#</th>
                <th className="px-3 py-2 text-left font-bold">Nome</th>
                <th className="px-3 py-2 text-left font-bold">Documento</th>
                <th className="px-3 py-2 text-right font-bold">Qtd.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-zinc-500">Carregando dados...</td></tr>
              ) : ranking.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-zinc-500">Nenhum paciente encontrado</td></tr>
              ) : ranking.map((p, i) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-orange-500">{i + 1}</td>
                  <td className="px-3 py-2.5 font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[140px]">{p.nome}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400">{p.tipo_documento}: {p.numero_documento}</td>
                  <td className="px-3 py-2.5 text-right font-black text-zinc-900 dark:text-zinc-100">{p.homologacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
