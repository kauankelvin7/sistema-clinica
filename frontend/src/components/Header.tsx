import { useEffect, useState } from 'react'
import { Columns3, LogOut, Moon, Rows3, Settings, Sun } from 'lucide-react'
import { getSavedLanguage, TRANSLATIONS, Language } from '../utils/i18n'
import PaletteSelector from './PaletteSelector'
import SettingsModal from './SettingsModal'
import { themeManager } from '../utils/themeManager'

interface HeaderProps {
  onLogout?: () => void
  layoutMode?: 'vertical' | 'horizontal'
  onToggleLayout?: () => void
}

export default function Header({ onLogout, layoutMode = 'horizontal', onToggleLayout }: HeaderProps) {
  const [lang, setLang] = useState<Language>(getSavedLanguage)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (localStorage.getItem('theme') === 'dark') return 'dark'
    } catch {
      // Preferência indisponível: usa o tema do sistema.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<Language>
      setLang(customEvent.detail || getSavedLanguage())
    }
    window.addEventListener('language_changed', handleLangChange)
    return () => window.removeEventListener('language_changed', handleLangChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // O tema continua funcional mesmo sem persistência.
    }
    themeManager.updateThemeColor()
  }, [theme])

  const t = TRANSLATIONS[lang] || TRANSLATIONS.pt

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-surface-page/95">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="app-container flex min-h-[68px] items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-garnet-500/15 bg-garnet-500/10 text-garnet-500">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 12 0V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <path d="M8 15v1a6 6 0 0 0 12 0v-4" />
              <circle cx="20" cy="10" r="2" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-sm font-bold tracking-tight text-zinc-950 dark:text-white sm:text-base">
                {t.headerTitle}
              </h1>
              <span className="hidden rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 sm:inline-flex">
                V2
              </span>
            </div>
            <p className="mt-0.5 hidden truncate text-xs text-zinc-500 dark:text-zinc-400 md:block">
              {t.headerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden lg:block">
            <PaletteSelector />
          </div>

          {onToggleLayout && (
            <button
              type="button"
              onClick={onToggleLayout}
              className="hidden min-h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition-colors hover:border-garnet-500/25 hover:text-garnet-500 dark:border-zinc-800 dark:bg-zinc-900/45 dark:text-zinc-300 md:inline-flex"
              title="Alternar organização do formulário"
            >
              {layoutMode === 'horizontal' ? <Columns3 className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
              <span className="hidden xl:inline">
                {layoutMode === 'horizontal' ? t.modeSideBySide : t.modeColumn}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="icon-button"
            aria-label="Abrir configurações"
            title="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            className="icon-button"
            aria-label={t.toggleTheme}
            title={t.toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="icon-button hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400"
              aria-label={t.logout}
              title={t.logout}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
