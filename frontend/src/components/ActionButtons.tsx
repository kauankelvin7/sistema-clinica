import { FileText, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { ActionButtonsProps } from '../types'

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
      {/* Botão Gerar Documento com Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex">
          {/* Botão Principal (Ação Padrão = HTML) */}
          <button
            onClick={handleGenerateHTML}
            disabled={!!loading}
            className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-5 px-6 rounded-l-2xl shadow-lg hover:shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 border border-transparent hover:border-orange-500/50 group"
          >
            <div className="flex items-center justify-center gap-3">
              {loading === 'html' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="text-base font-extrabold tracking-tight">Gerando HTML...</span>
                </>
              ) : loading === 'word' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="text-base font-extrabold tracking-tight">Gerando Word...</span>
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6 group-hover:text-orange-500 transition-colors" />
                  <span className="text-base font-extrabold tracking-tight">Gerar Documento</span>
                </>
              )}
            </div>
          </button>

          {/* Botão Dropdown (Seta) */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={!!loading}
            className="bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold py-5 px-4 rounded-r-2xl shadow-lg hover:bg-zinc-900 dark:hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 border-l border-zinc-700 dark:border-zinc-300 hover:border-orange-500/50"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${dropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
          </button>
        </div>

        {/* Menu Dropdown - Agora com Glassmorphism e tema Zinc */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50 animate-dropdown">
            <div className="py-2">
              
              {/* Opção HTML/PDF */}
              <button
                onClick={handleGenerateHTML}
                disabled={!!loading}
                className="w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-zinc-900 dark:text-white text-sm tracking-tight">
                      Gerar Documento HTML
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      Visualizar e imprimir como PDF
                    </div>
                  </div>
                </div>
              </button>

              {/* Opção Word */}
              <button
                onClick={handleGenerateWord}
                disabled={!!loading}
                className="w-full px-6 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-4">
                  {/* Para Word, mantemos um tom azulado neutro, mas ajustado para a estética moderna */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-zinc-900 dark:text-white text-sm tracking-tight">
                      Gerar Documento Word
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
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
