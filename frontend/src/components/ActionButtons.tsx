import { FileText, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

export default function ActionButtons({ onGenerateHTML, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
      {/* Botão Gerar Documento */}
      <button
        onClick={onGenerateHTML}
        disabled={!!loading}
        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-5 px-6 rounded-2xl shadow-lg hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 border border-transparent hover:border-orange-500/50 group"
      >
        <div className="flex items-center justify-center gap-3">
          {loading === 'html' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-base font-extrabold tracking-tight">Gerando HTML...</span>
            </>
          ) : (
            <>
              <FileText className="w-6 h-6 group-hover:text-orange-500 transition-colors" />
              <span className="text-base font-extrabold tracking-tight">Abrir Documento</span>
            </>
          )}
        </div>
      </button>

      {/* Botão Limpar */}
      <button
        onClick={onClear}
        disabled={!!loading}
        className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold py-5 px-8 rounded-2xl shadow-sm border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 group"
      >
        <div className="flex items-center justify-center gap-3">
          <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-base font-extrabold tracking-tight">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}

