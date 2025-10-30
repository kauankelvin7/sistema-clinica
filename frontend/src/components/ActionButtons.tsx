import { FileCheck, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

export default function ActionButtons({ onGenerate, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        onClick={onGenerate}
        disabled={loading}
        className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Gerando...</span>
          </>
        ) : (
          <>
            <FileCheck className="w-4 h-4" />
            <span>Gerar Declaração</span>
          </>
        )}
      </button>

      <button
        onClick={onClear}
        disabled={loading}
        className="btn-danger flex items-center justify-center gap-2 px-6 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Limpar</span>
      </button>
    </div>
  )
}
