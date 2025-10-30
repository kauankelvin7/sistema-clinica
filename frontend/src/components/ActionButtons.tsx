import { FileText, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

// Botões de ação para gerar documentos
export default function ActionButtons({ onGenerateWord, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-2">
      {/* Botão Gerar Word */}
      <button
        onClick={onGenerateWord}
        disabled={!!loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 dark:bg-sky-500 dark:hover:bg-sky-600 dark:text-slate-900"
      >
        <div className="flex items-center justify-center gap-3">
          {loading === 'word' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm md:text-base font-semibold">Gerando Documento...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Gerar Documento</span>
            </>
          )}
        </div>
      </button>

      {/* Botão Limpar */}
      <button
        onClick={onClear}
        disabled={!!loading}
        className="bg-gray-600 hover:bg-rose-600 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 dark:bg-slate-700 dark:hover:bg-rose-600"
      >
        <div className="flex items-center justify-center gap-3">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm md:text-base font-semibold">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}
