import BrandMark from './BrandMark'
import { useEffect, useState, type ReactNode } from 'react'
import { PanelLeftClose, PanelLeftOpen, ClipboardList, FileText, LogOut, Palette, Settings, Stethoscope, Users, X } from 'lucide-react'
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
  const { t, lang } = useTranslation()
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('sidebar_collapsed') === 'true' } catch { return false } })
  const collapseLabel = { pt: collapsed ? 'Expandir navegação' : 'Recolher navegação', en: collapsed ? 'Expand navigation' : 'Collapse navigation', es: collapsed ? 'Expandir navegación' : 'Contraer navegación' }[lang]
  const toggleSidebar = () => setCollapsed((current) => { try { localStorage.setItem('sidebar_collapsed', String(!current)) } catch { /* visual preference */ } return !current })
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
        <div className="brand-mark"><BrandMark /></div>
        <div><strong>{t.headerTitle}</strong><p>{t.headerSubtitle}</p></div>
      </div>
      <nav className="sidebar-nav" aria-label={t.navTitle}>
        <button type="button" className="sidebar-link" aria-current={view === 'homologation' ? 'page' : undefined} onClick={() => navigate(focusForm)} title={t.navHomologation}><FileText aria-hidden="true" /><span>{t.navHomologation}</span></button>
        <button type="button" className="sidebar-link" aria-current={view === 'models' ? 'page' : undefined} onClick={() => navigate(onOpenModels)} title={t.navModels}><ClipboardList aria-hidden="true" /><span>{t.navModels}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(onOpenPatients)} title={t.navPatients}><Users aria-hidden="true" /><span>{t.navPatients}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(onOpenDoctors)} title={t.navDoctors}><Stethoscope aria-hidden="true" /><span>{t.navDoctors}</span></button>
        <button type="button" className="sidebar-link" onClick={() => navigate(() => setSettingsOpen(true))} title={t.navSettings}><Settings aria-hidden="true" /><span>{t.navSettings}</span></button>
      </nav>
      <div className="sidebar-bottom">
        {!mobile && <button type="button" className="sidebar-link sidebar-collapse" aria-label={collapseLabel} title={collapseLabel} onClick={toggleSidebar}>{collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}<span>{collapseLabel}</span></button>}
        <button type="button" className="sidebar-link" onClick={() => navigate(onLogout)} title={t.logout}><LogOut aria-hidden="true" /><span>{t.logout}</span></button>
        <div className="sidebar-palette"><Palette aria-hidden="true" /><div>{THEME_PALETTES[palette].label}<small>{t.themeCurrent}</small></div></div>
      </div>
    </aside>
  )

  return (
    <div className={`clinic-shell ${collapsed ? 'clinic-shell--collapsed' : ''}`}>
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
