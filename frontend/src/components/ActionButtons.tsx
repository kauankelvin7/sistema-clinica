import { FileText, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { ActionButtonsProps } from '../types'

// Botões de ação para gerar documentos
export default function ActionButtons({ onGenerateWord, onGenerateHTML, onClear, loading }: ActionButtonsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenerateWord = () => {
    setDropdownOpen(false)
    onGenerateWord()
  }

  const handleGenerateHTML = () => {
    setDropdownOpen(false)
    onGenerateHTML()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Botão Gerar Documento com Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-1">
          {/* Botão Principal */}
          <button
            onClick={handleGenerateHTML}
            disabled={!!loading}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-5 px-6 rounded-l-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed dark:from-emerald-500 dark:to-green-500 transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-3">
              {loading === 'html' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base font-bold">Gerando Homologação...</span>
                </>
              ) : loading === 'word' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-base font-bold">Gerando Word...</span>
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6" />
                  <span className="text-base font-bold">Gerar Documento</span>
                </>
              )}
            </div>
          </button>

          {/* Botão Dropdown */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={!!loading}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-5 px-4 rounded-r-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed dark:from-emerald-500 dark:to-green-500 transition-all duration-200 border-l border-emerald-500/30"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Menu Dropdown */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-dropdown">
            <div className="py-2">
              {/* Opção HTML/PDF */}
              <button
                onClick={handleGenerateHTML}
                disabled={!!loading}
                className="w-full px-6 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      Gerar Documento HTML
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Visualizar e imprimir como PDF
                    </div>
                  </div>
                </div>
              </button>

              {/* Opção Word */}
              <button
                onClick={handleGenerateWord}
                disabled={!!loading}
                className="w-full px-6 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">
                      Gerar Documento Word
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Formato DOCX para edição
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botão Limpar */}
      <button
        onClick={onClear}
        disabled={!!loading}
        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-5 px-8 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        <div className="flex items-center justify-center gap-3">
          <Trash2 className="w-6 h-6" />
          <span className="text-base font-bold">Limpar Tudo</span>
        </div>
      </button>
    </div>
  )
}
