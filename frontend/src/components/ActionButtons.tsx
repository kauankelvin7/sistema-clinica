import { FileText, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

export default function ActionButtons({ onGenerateHTML, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
      {/* Botão Limpar - Secondary Ghost/Outline */}
      <button
        type="button"
        onClick={onClear}
        disabled={!!loading}
        className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>Limpar Formulário</span>
      </button>

      {/* Botão Gerar Documento - Única Ação Primária Sólida da Tela */}
      <button
        type="button"
        onClick={onGenerateHTML}
        disabled={!!loading}
        className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold font-display text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 group"
      >
        {loading === 'html' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Gerando Documento...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 text-white group-hover:scale-105 transition-transform" />
            <span>Abrir Documento</span>
          </>
        )}
      </button>
    </div>
  )
}

