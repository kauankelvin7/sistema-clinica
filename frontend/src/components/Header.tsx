import { Columns3, HeartPulse, Menu, Moon, Rows3, Settings, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from '../utils/i18n'
import PaletteSelector from './PaletteSelector'

interface HeaderProps {
  layoutMode: 'vertical' | 'horizontal'
  onToggleLayout: () => void
  onOpenNavigation: () => void
  onOpenSettings: () => void
}

export default function Header({ layoutMode, onToggleLayout, onOpenNavigation, onOpenSettings }: HeaderProps) {
  const { t, lang } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const settingsLabel = { pt: 'Abrir configurações', en: 'Open settings', es: 'Abrir configuración' }[lang]
  return (
    <header className="clinic-topbar">
      <div className="app-container topbar-inner">
        <div className="topbar-identity">
          <button type="button" onClick={onOpenNavigation} className="icon-button topbar-mobile-menu" aria-label={t.navOpenMenu}><Menu className="h-5 w-5" aria-hidden="true" /></button>
          <div className="brand-mark" aria-hidden="true"><HeartPulse className="h-5 w-5" /></div>
          <div className="min-w-0"><h1 className="text-sm font-semibold text-ink">{t.headerTitle}</h1><p>{t.headerSubtitle}</p></div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-palette"><PaletteSelector /></div>
          <button type="button" onClick={onToggleLayout} className="btn-secondary layout-toggle" title="Alternar organização do formulário" aria-label={layoutMode === 'horizontal' ? t.modeSideBySide : t.modeColumn}>
            {layoutMode === 'horizontal' ? <Columns3 className="h-4 w-4" aria-hidden="true" /> : <Rows3 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="button" onClick={toggleTheme} className="icon-button" aria-label={t.toggleTheme} title={t.toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="button" onClick={onOpenSettings} className="icon-button" aria-label={settingsLabel} title={settingsLabel}><Settings className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </header>
  )
}
