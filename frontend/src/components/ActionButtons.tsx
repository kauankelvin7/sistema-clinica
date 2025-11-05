import { FileText, Trash2, Loader2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'

// Botões de ação para gerar documentos
export default function ActionButtons({ onGenerateWord, onClear, loading }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Botão Gerar Word */}
      <button
        onClick={onGenerateWord}
        disabled={!!loading}
        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed dark:from-emerald-500 dark:to-green-500"
      >
        <div className="flex items-center justify-center gap-3">
          {loading === 'word' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-base font-bold">Gerando Documento...</span>
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
              <span className="text-base font-bold">Gerar Documento</span>
            </>
          )}
        </div>
      </button>

      {/* Botão Limpar */}
      <button
        onClick={onClear}
        disabled={!!loading}
        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-center gap-3">
          <Trash2 className="w-6 h-6" />
          <span className="text-base font-bold">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}
