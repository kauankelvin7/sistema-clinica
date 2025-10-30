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
        className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <div className="relative flex items-center justify-center gap-3">
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
        className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <div className="relative flex items-center justify-center gap-3">
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
        className="group relative overflow-hidden bg-gradient-to-r from-gray-600 to-gray-700 hover:from-rose-600 hover:to-rose-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-gray-500/20 hover:shadow-xl hover:shadow-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none sm:col-span-2 lg:col-span-1"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        <div className="relative flex items-center justify-center gap-3">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm md:text-base font-semibold">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}
