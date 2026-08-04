import { useState, useEffect, useRef } from 'react'
import { Settings, X, Globe, Palette, Check, Moon, Sun, Monitor, Sparkles, Download, CheckCircle2 } from 'lucide-react'
import { useTranslation, Language, setSavedLanguage } from '../utils/i18n'
import { themeManager, THEME_PALETTES, PaletteName } from '../utils/themeManager'
import { FlagBR, FlagUS, FlagES } from './LanguageSelector'
import { usePWA } from '../utils/usePWA'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { lang } = useTranslation()
  const { isStandalone, installed, installApp } = usePWA()
  const [currentPalette, setCurrentPalette] = useState<PaletteName>(() => themeManager.getPalette())
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    } catch { }
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

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(null), 2500)
  }

  // Trata seleção de idioma
  const handleLanguageSelect = (newLang: Language) => {
    setSavedLanguage(newLang)
    const labels = { pt: 'Português (BR)', en: 'English (US)', es: 'Español' }
    showFeedback(`Idioma alterado para ${labels[newLang]}`)
  }

  // Trata seleção de paleta de cores
  const handlePaletteSelect = (palName: PaletteName) => {
    themeManager.applyPalette(palName)
    setCurrentPalette(palName)
    showFeedback(`Paleta alterada para ${THEME_PALETTES[palName].label}`)
  }

  // Trata alternância Claro / Escuro
  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    try {
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
        showFeedback('Modo Escuro ativado')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        showFeedback('Modo Claro ativado')
      }
      themeManager.updateThemeColor()
    } catch { }
  }

  // Trata auto-instalação PWA
  const handleAutoInstallPWA = async () => {
    const success = await installApp()
    if (success) {
      showFeedback('Instalação do aplicativo iniciada!')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 dark:bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header Elegante do Modal */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0 relative">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-garnet-500/10 dark:bg-garnet-500/15 border border-garnet-500/25 rounded-2xl flex items-center justify-center text-garnet-500 flex-shrink-0 shadow-sm shadow-garnet-500/10">
              <Settings className="w-5.5 h-5.5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                  Configurações do Sistema
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-garnet-500/10 text-garnet-600 dark:text-garnet-400 border border-garnet-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                Personalize idioma, cores, tema e instale o app no dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Fechar"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Notificação Toast de Feedback Live */}
          {feedbackMsg && (
            <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-garnet-500 text-white text-[11px] font-bold shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Corpo das Configurações Organizado por Blocos */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">

          {/* 1. SEÇÃO DE PALETA DE CORES DINÂMICA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
                <Palette className="w-4 h-4 text-garnet-500" />
                <span>Paleta de Cores do Sistema</span>
              </div>
              <span className="text-[11px] font-semibold text-garnet-600 dark:text-garnet-400">
                Altera todo o site em tempo real
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'garnet', label: 'Garnet Burgundy', desc: 'Vinho Tinto Escuro (Padrão)', colors: ['#6e2d29', '#3d0407', '#a6544d'] },
                { name: 'emerald', label: 'Emerald Health', desc: 'Verde Esmeralda Clínico', colors: ['#059669', '#047857', '#34d399'] },
                { name: 'sapphire', label: 'Sapphire Clinical', desc: 'Azul Safira Hospitalar', colors: ['#1d4ed8', '#1e3a8a', '#60a5fa'] },
                { name: 'amber', label: 'Amber Gold', desc: 'Dourado Ambar & Nobre', colors: ['#d97706', '#b45309', '#fbbf24'] },
              ].map((pal) => {
                const isSelected = currentPalette === pal.name
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => handlePaletteSelect(pal.name as PaletteName)}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 text-left ${isSelected
                      ? 'bg-garnet-500/15 border-garnet-500 text-zinc-900 dark:text-zinc-50 shadow-md ring-2 ring-garnet-500/20'
                      : 'bg-zinc-50/80 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Amostra Tríplice de Cores da Paleta */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        {pal.colors.map((c, idx) => (
                          <span
                            key={idx}
                            className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-xs inline-block"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div>
                        <p className="font-bold text-xs leading-tight text-zinc-900 dark:text-zinc-100">{pal.label}</p>
                        <p className="text-[10px] font-normal text-zinc-400 mt-0.5">{pal.desc}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-garnet-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

          {/* 2. SEÇÃO DE IDIOMA */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
              <Globe className="w-4 h-4 text-garnet-500" />
              <span>Idioma da Interface / Language</span>
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
                    className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${isSelected
                      ? 'bg-garnet-500/15 border-garnet-500 text-zinc-900 dark:text-zinc-50 shadow-md ring-2 ring-garnet-500/20'
                      : 'bg-zinc-50/80 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.flag}
                      <span>{item.label}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-garnet-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80" />

          {/* 3. SEÇÃO DE INSTALAÇÃO PWA AUTO-INSTALL */}
          {!isStandalone && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
                  <Download className="w-4 h-4 text-garnet-500" />
                  <span>Instalar Aplicativo no Dispositivo</span>
                </div>

                <div className="p-4 rounded-2xl bg-garnet-500/10 dark:bg-garnet-500/15 border border-garnet-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                      {installed ? 'App Instalado no Dispositivo' : 'Instalar sistema no seu Dispositivo'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {installed
                        ? 'O aplicativo já está pronto para uso no seu sistema.'
                        : 'Acesse o sistema diretamente da sua área de trabalho como um app nativo.'
                      }
                    </p>
                  </div>

                  {installed ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Instalado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAutoInstallPWA}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-garnet-500 to-garnet-600 hover:from-garnet-600 hover:to-garnet-700 shadow-md shadow-garnet-500/20 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>Instalar App Agora</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800/80" />
            </>
          )}

          {/* 4. SEÇÃO DE TEMA CLARO / ESCURO */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
              <Monitor className="w-4 h-4 text-garnet-500" />
              <span>Modo de Exibição</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeToggle('light')}
                className={`flex items-center justify-center gap-3 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${theme === 'light'
                  ? 'bg-garnet-500/15 border-garnet-500 text-zinc-900 dark:text-zinc-50 shadow-md ring-2 ring-garnet-500/20'
                  : 'bg-zinc-50/80 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/40'
                  }`}
              >
                <Sun className="w-4.5 h-4.5 text-amber-500" />
                <span>Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeToggle('dark')}
                className={`flex items-center justify-center gap-3 p-3.5 rounded-2xl border text-xs font-bold transition-all duration-200 ${theme === 'dark'
                  ? 'bg-garnet-500/15 border-garnet-500 text-zinc-900 dark:text-zinc-50 shadow-md ring-2 ring-garnet-500/20'
                  : 'bg-zinc-50/80 dark:bg-surface-input border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-garnet-500/40'
                  }`}
              >
                <Moon className="w-4.5 h-4.5 text-indigo-400" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer do Modal com Botão Concluído */}
        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-200/80 dark:border-zinc-800/80 px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-garnet-500 to-garnet-600 hover:from-garnet-600 hover:to-garnet-700 rounded-xl shadow-md shadow-garnet-500/20 transition-all active:scale-95"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  )
}
