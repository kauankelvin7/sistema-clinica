import { FileText, FileCheck, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

// Botões de ação para gerar documentos
export default function ActionButtons({ onGenerateWord, onGeneratePDF, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        onClick={onGenerateWord}
        disabled={!!loading}
        className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading === 'word' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Gerando...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Gerar Word</span>
          </>
        )}
      </button>

      <button
        onClick={onGeneratePDF}
        disabled={!!loading}
        className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading === 'pdf' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Gerando...</span>
          </>
        ) : (
          <>
            <FileCheck className="w-4 h-4" />
            <span>Gerar PDF</span>
          </>
        )}
      </button>

      <button
        onClick={onClear}
        disabled={!!loading}
        className="btn-danger flex items-center justify-center gap-2 px-6 disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Limpar</span>
      </button>
    </div>
  )
}
