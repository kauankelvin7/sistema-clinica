import { useEffect, useState, type ReactNode } from 'react'
import { FileText, HeartPulse, LogOut, Palette, Settings, Stethoscope, Users, X } from 'lucide-react'
import { useTranslation } from '../utils/i18n'
import { themeManager, THEME_PALETTES } from '../utils/themeManager'
import Dialog from './Dialog'
import Header from './Header'
import SettingsModal from './SettingsModal'
import './AppShell.css'

interface AppShellProps {
  children: ReactNode
  layoutMode: 'vertical' | 'horizontal'
  onToggleLayout: () => void
  onLogout: () => void
  onOpenPatients: () => void
  onOpenDoctors: () => void
  onOpenModels: () => void
  onHomologation: () => void
  view: 'homologation' | 'models'
}

export default function AppShell({ children, layoutMode, onToggleLayout, onLogout, onOpenPatients, onOpenDoctors, onOpenModels, onHomologation, view }: AppShellProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [palette, setPalette] = useState(() => themeManager.getPalette())
  useEffect(() => {
    const updatePalette = () => setPalette(themeManager.getPalette())
    window.addEventListener('palette_changed', updatePalette)
    return () => window.removeEventListener('palette_changed', updatePalette)
  }, [])
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const closeDesktopMenu = () => { if (media.matches) setMenuOpen(false) }
    media.addEventListener('change', closeDesktopMenu)
    return () => media.removeEventListener('change', closeDesktopMenu)
  }, [])

  const navigate = (action: () => void) => {
    setMenuOpen(false)
    action()
  }
  const focusForm = () => {
    onHomologation()
    requestAnimationFrame(() => document.getElementById('clinic-workspace')?.focus())
  }
  const sidebar = (mobile: boolean) => (
    <aside className={`clinic-sidebar ${mobile ? '' : 'clinic-sidebar--desktop'}`}>
      {mobile && <div className="mobile-sidebar-close"><button type="button" className="icon-button" aria-label={t.navCloseMenu} onClick={() => setMenuOpen(false)}><X className="h-5 w-5" aria-hidden="true" /></button></div>}
      <div className="sidebar-brand">
        <div className="brand-mark"><HeartPulse className="h-5 w-5" aria-hidden="true" /></div>
        <div><strong>{t.headerTitle}</strong><p>{t.headerSubtitle}</p></div>
      </div>
      <nav className="sidebar-nav" aria-label={t.navTitle}>
        <button type="button" className="sidebar-link" aria-current={view === 'homologation' ? 'page' : undefined} onClick={() => navigate(focusForm)}><FileText aria-hidden="true" /><span>{t.navHomologation}</span></button>
        <button type="button" className="sidebar-link" aria-current={view === 'models' ? 'page' : undefined} onClick={() => navigate(onOpenModels)}><FileText aria-hidden="true" /><span>{t.navModels}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(onOpenPatients)}><Users aria-hidden="true" /><span>{t.navPatients}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(onOpenDoctors)}><Stethoscope aria-hidden="true" /><span>{t.navDoctors}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(() => setSettingsOpen(true))}><Settings aria-hidden="true" /><span>{t.navSettings}</span></button>
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="sidebar-link" onClick={() => navigate(onLogout)}><LogOut aria-hidden="true" /><span>{t.logout}</span></button>
        <div className="sidebar-palette"><Palette aria-hidden="true" /><div>{THEME_PALETTES[palette].label}<small>{t.themeCurrent}</small></div></div>
      </div>
    </aside>
  )

  return (
    <div className="clinic-shell">
      <a href="#clinic-workspace" className="skip-link">{t.skipContent}</a>
      {sidebar(false)}
      <Dialog isOpen={menuOpen} onClose={() => setMenuOpen(false)} label={t.navTitle} className="navigation-dialog">{sidebar(true)}</Dialog>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="clinic-workspace">
        <Header layoutMode={layoutMode} onToggleLayout={onToggleLayout} onOpenNavigation={() => setMenuOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
        {children}
      </div>
    </div>
  )
}
