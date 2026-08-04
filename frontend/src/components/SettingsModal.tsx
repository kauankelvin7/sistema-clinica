import { useState, useEffect, useRef } from 'react'
import { Settings, X, Globe, Palette, Check, Moon, Sun, Laptop } from 'lucide-react'
import { useTranslation, Language, setSavedLanguage } from '../utils/i18n'
import { themeManager, THEME_PALETTES, PaletteName } from '../utils/themeManager'
import { FlagBR, FlagUS, FlagES } from './LanguageSelector'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { lang } = useTranslation()
  const [currentPalette, setCurrentPalette] = useState<PaletteName>(() => themeManager.getPalette())
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    } catch {}
    return 'dark'
  })

  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Trata seleção de idioma
  const handleLanguageSelect = (newLang: Language) => {
    setSavedLanguage(newLang)
  }

  // Trata seleção de paleta de cores
  const handlePaletteSelect = (palName: PaletteName) => {
    themeManager.applyPalette(palName)
    setCurrentPalette(palName)
  }

  // Trata alternância Claro / Escuro
  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    try {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch {}
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 dark:bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header do Modal */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-garnet-500/10 dark:bg-garnet-500/15 border border-garnet-500/20 rounded-2xl flex items-center justify-center text-garnet-500 flex-shrink-0 shadow-xs">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                Configurações do Sistema
              </h2>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                Personalize o idioma, cores e preferências visuais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo das Configurações */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* 1. SEÇÃO DE IDIOMA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Globe className="w-4 h-4 text-garnet-500" />
              <span>Idioma do Sistema / Language</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { code: 'pt', label: 'Português (BR)', flag: <FlagBR /> },
                { code: 'en', label: 'English (US)', flag: <FlagUS /> },
                { code: 'es', label: 'Español', flag: <FlagES /> },
              ].map((item) => {
                const isSelected = lang === item.code
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleLanguageSelect(item.code as Language)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-garnet-500/15 border-garnet-500 text-garnet-600 dark:text-garnet-400 shadow-xs'
                        : 'bg-zinc-50 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.flag}
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-garnet-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

          {/* 2. SEÇÃO DE PALETA DE CORES */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Palette className="w-4 h-4 text-garnet-500" />
              <span>Paleta de Cores do Sistema</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(THEME_PALETTES).map((pal) => {
                const isSelected = currentPalette === pal.name
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => handlePaletteSelect(pal.name as PaletteName)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? 'bg-garnet-500/15 border-garnet-500 text-garnet-600 dark:text-garnet-400 shadow-xs'
                        : 'bg-zinc-50 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border border-black/20 shadow-xs shrink-0"
                        style={{ backgroundColor: `rgb(${pal.colors[500]})` }}
                      />
                      <span>{pal.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-garnet-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

          {/* 3. SEÇÃO DE TEMA CLARO / ESCURO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              <Laptop className="w-4 h-4 text-garnet-500" />
              <span>Modo de Exibição</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleThemeToggle('light')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-garnet-500/15 border-garnet-500 text-garnet-600 dark:text-garnet-400 shadow-xs'
                    : 'bg-zinc-50 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/30'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeToggle('dark')}
                className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-garnet-500/15 border-garnet-500 text-garnet-600 dark:text-garnet-400 shadow-xs'
                    : 'bg-zinc-50 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/30'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer do Modal */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800/80 px-6 py-3.5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-garnet-500 to-garnet-600 hover:from-garnet-600 hover:to-garnet-700 rounded-xl shadow-xs transition-all"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  )
}
