import { FileCheck, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

export default function ActionButtons({ onGenerate, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="flex gap-4 pt-4">
      <button
        onClick={onGenerate}
        disabled={loading}
        className="btn-success flex-1 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Gerando...</span>
          </>
        ) : (
          <>
            <FileCheck className="w-5 h-5" />
            <span>Gerar Declaração</span>
          </>
        )}
      </button>

      <button
        onClick={onClear}
        disabled={loading}
        className="btn-danger flex items-center justify-center gap-3 px-12 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-5 h-5" />
        <span>Limpar</span>
      </button>
    </div>
  )
}
