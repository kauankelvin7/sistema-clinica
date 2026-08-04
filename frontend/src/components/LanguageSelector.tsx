import { useState, useRef, useEffect } from 'react'
import { Language, getSavedLanguage, setSavedLanguage } from '../utils/i18n'
import { ChevronDown, Check, Globe } from 'lucide-react'

interface LanguageOption {
  code: Language
  label: string
  shortLabel: string
  flagSvg: React.ReactNode
}

export function FlagBR() {
  return (
    <svg viewBox="0 0 36 36" className="w-5 h-5 rounded-full overflow-hidden shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110">
      <rect fill="#229e46" width="36" height="36"/>
      <polygon fill="#f8c100" points="18,5 33,18 18,31 3,18"/>
      <circle fill="#2b4498" cx="18" cy="18" r="7.5"/>
      <path fill="#ffffff" d="M11,17.5 C14,15.5 22,15.5 25,18.5 L24.5,19 C21.5,16.5 14.5,16.5 11.5,18 Z"/>
    </svg>
  )
}

export function FlagUS() {
  return (
    <svg viewBox="0 0 36 36" className="w-5 h-5 rounded-full overflow-hidden shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110">
      <rect fill="#b22234" width="36" height="36"/>
      <rect fill="#ffffff" y="4" width="36" height="4"/>
      <rect fill="#ffffff" y="12" width="36" height="4"/>
      <rect fill="#ffffff" y="20" width="36" height="4"/>
      <rect fill="#ffffff" y="28" width="36" height="4"/>
      <rect fill="#3c3b6e" width="18" height="20"/>
    </svg>
  )
}

export function FlagES() {
  return (
    <svg viewBox="0 0 36 36" className="w-5 h-5 rounded-full overflow-hidden shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110">
      <rect fill="#c60b1e" width="36" height="36"/>
      <rect fill="#ffc400" y="9" width="36" height="18"/>
    </svg>
  )
}

const LANGUAGES: LanguageOption[] = [
  { code: 'pt', label: 'Português (BR)', shortLabel: 'PT', flagSvg: <FlagBR /> },
  { code: 'en', label: 'English (US)', shortLabel: 'EN', flagSvg: <FlagUS /> },
  { code: 'es', label: 'Español', shortLabel: 'ES', flagSvg: <FlagES /> },
]

export default function LanguageSelector() {
  const [currentLang, setCurrentLang] = useState<Language>(getSavedLanguage)
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectLanguage = (lang: Language) => {
    if (lang === currentLang) {
      setIsOpen(false)
      return
    }
    
    // Disparar animação fluida SVGator-style
    setIsAnimating(true)
    setCurrentLang(lang)
    setSavedLanguage(lang)
    setIsOpen(false)

    setTimeout(() => {
      setIsAnimating(false)
    }, 600)
  }

  const selectedOption = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0]

  return (
    <div className="relative inline-block text-left z-30" ref={menuRef}>
      {/* Botão Seletor de Idioma em Pílula Flutuante */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-300 shadow-xs active:scale-95 ${
          isOpen ? 'ring-2 ring-orange-500/30 border-orange-500/50' : ''
        }`}
        title="Alterar Idioma / Change Language"
      >
        {/* Anel de Brilho Animado Estilo SVGator no Clique */}
        <div className={`relative flex items-center justify-center transition-transform duration-500 ${isAnimating ? 'scale-125 rotate-[360deg]' : ''}`}>
          {selectedOption.flagSvg}
        </div>

        <span className="font-bold tracking-wide text-xs">{selectedOption.shortLabel}</span>

        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      {/* Popover Dropdown de Seleção de Idioma com Animação Fluida */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 mb-1 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Idioma / Language</span>
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isSelected
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="transition-transform duration-300 group-hover:scale-110">
                      {lang.flagSvg}
                    </div>
                    <span>{lang.label}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-orange-500 animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
