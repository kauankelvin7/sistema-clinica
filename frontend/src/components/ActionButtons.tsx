import { FileText, FileDown, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

// Botões de ação para gerar documentos
export default function ActionButtons({ onGenerateWord, onGeneratePDF, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-2">
      {/* Botão Gerar Word */}
      <button
        onClick={onGenerateWord}
        disabled={!!loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
      >
        <div className="flex items-center justify-center gap-3">
          {loading === 'word' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm md:text-base font-semibold">Gerando Word...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Gerar Word</span>
            </>
          )}
        </div>
      </button>

      {/* Botão Gerar PDF */}
      <button
        onClick={onGeneratePDF}
        disabled={!!loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
      >
        <div className="flex items-center justify-center gap-3">
          {loading === 'pdf' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm md:text-base font-semibold">Gerando PDF...</span>
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              <span className="text-sm md:text-base font-semibold">Gerar PDF</span>
            </>
          )}
        </div>
      </button>

      {/* Botão Limpar */}
      <button
        onClick={onClear}
        disabled={!!loading}
        className="bg-gray-600 hover:bg-rose-600 text-white font-semibold py-4 px-6 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 sm:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center justify-center gap-3">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm md:text-base font-semibold">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}
