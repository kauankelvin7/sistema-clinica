import { useEffect, useState } from 'react'
import { Sun, Moon, LogOut, Monitor, Smartphone, Settings } from 'lucide-react'
import { getSavedLanguage, TRANSLATIONS, Language } from '../utils/i18n'
import SettingsModal from './SettingsModal'
import PaletteSelector from './PaletteSelector'
import { themeManager } from '../utils/themeManager'

interface HeaderProps {
  onLogout?: () => void
  layoutMode?: 'vertical' | 'horizontal'
  onToggleLayout?: () => void
}

export default function Header({ onLogout, layoutMode = 'horizontal', onToggleLayout }: HeaderProps) {
  const [lang, setLang] = useState<Language>(getSavedLanguage)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Versão de paleta: força re-render quando a paleta muda
  const [paletteVersion, setPaletteVersion] = useState(0)

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>
      setLang(customEvent.detail || getSavedLanguage())
    }
    window.addEventListener('language_changed', handleLangChange)
    return () => window.removeEventListener('language_changed', handleLangChange)
  }, [])

  useEffect(() => {
    const handlePaletteChange = () => setPaletteVersion(v => v + 1)
    window.addEventListener('palette_changed', handlePaletteChange)
    return () => window.removeEventListener('palette_changed', handlePaletteChange)
  }, [])

  const t = TRANSLATIONS[lang] || TRANSLATIONS.pt
  // Cor primária dinâmica via CSS variable (reflete paleta atual)
  const primaryColor = `rgb(var(--color-primary-500))`
  const primaryColorLight = `rgba(var(--color-primary-500) / 0.12)`
  void paletteVersion // garante reatividade

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return 'dark';
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      themeManager.updateThemeColor()
    } catch {}
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <header className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 sm:py-4 transition-all duration-200 z-20 shadow-xs dark:shadow-none">
      {/* Modal de Configurações Unificado */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Linha de Destaque Superior em Gradiente Dinâmico — cor da paleta ativa */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-500"
        style={{
          background: `linear-gradient(to right, ${primaryColor}, rgba(var(--color-primary-300) / 0.6), ${primaryColor})`
        }}
      />

      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: Logo + Título + Subtítulo */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105 duration-200"
            style={{
              background: primaryColorLight,
              border: `1px solid rgba(var(--color-primary-500) / 0.30)`,
              color: primaryColor,
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
              <circle cx="20" cy="10" r="2.2" fill="currentColor" />
            </svg>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none transition-all duration-300">
                {t.headerTitle}
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-slate-500/10 text-slate-400 dark:text-slate-300 border border-slate-500/20 hidden xs:inline-block">
                v2.0
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none hidden sm:block transition-all duration-300">
              {t.headerSubtitle}
            </p>
          </div>
        </div>

        {/* CENTRO: Seletor Rápido de Paleta + Alternador de Layout */}
        <div className="flex items-center gap-3">
          {/* Seletor Rápido de Paletas de Cores */}
          <PaletteSelector />

          {onToggleLayout && (
            <button
              onClick={onToggleLayout}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all duration-200 shadow-xs"
              title="Alternar entre visualização lado a lado e coluna"
            >
              {layoutMode === 'horizontal' ? (
                <Monitor className="w-4 h-4" style={{ color: primaryColor }} />
              ) : (
                <Smartphone className="w-4 h-4" style={{ color: primaryColor }} />
              )}
              <span>{layoutMode === 'horizontal' ? t.modeSideBySide : t.modeColumn}</span>
            </button>
          )}
        </div>

        {/* LADO DIREITO: Engrenagem de Configurações + PWA + Tema + Sair */}
        <div className="flex items-center gap-2.5">

          {/* Botão de Engrenagem de Configurações */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-200 shadow-xs group"
            title="Configurações do Sistema"
          >
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" style={{ color: primaryColor }} />
            <span className="hidden sm:inline">Configurações</span>
          </button>

          {/* Alternador Rápido de Tema Claro/Escuro */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 hover:border-garnet-500/40 text-zinc-500 dark:text-zinc-300 hover:text-garnet-500 transition-all duration-200 flex items-center justify-center group shadow-xs"
            title={t.toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          {/* Botão de Sair / Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-500/20 rounded-xl transition-all duration-200"
              title="Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
