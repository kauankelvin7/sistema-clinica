import BrandMark from './BrandMark'
import { useEffect, useRef, useState } from 'react'
import { Columns3, Menu, Moon, Palette, Rows3, Settings, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from '../utils/i18n'
import { themeManager, THEME_PALETTES } from '../utils/themeManager'
import ThemeSwatches from './ThemeSwatches'

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
  const copy = {
    pt: { choose: 'Escolher paleta', title: 'Cores da interface', hint: 'Experimente outra combinação de cores.', selected: 'Tema atual' },
    en: { choose: 'Choose palette', title: 'Interface colors', hint: 'Try a different color combination.', selected: 'Current theme' },
    es: { choose: 'Elegir paleta', title: 'Colores de la interfaz', hint: 'Pruebe otra combinación de colores.', selected: 'Tema actual' },
  }[lang]
  const [quickOpen, setQuickOpen] = useState(false)
  const [palette, setPalette] = useState(() => themeManager.getPalette())
  const pickerRef = useRef<HTMLDivElement>(null)
  const pickerButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const update = () => setPalette(themeManager.getPalette())
    window.addEventListener('palette_changed', update)
    return () => window.removeEventListener('palette_changed', update)
  }, [])
  useEffect(() => {
    if (!quickOpen) return
    const outside = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setQuickOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setQuickOpen(false); pickerButton.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [quickOpen])
  return (
    <header className="clinic-topbar">
      <div className="app-container topbar-inner">
        <div className="topbar-identity">
          <button type="button" onClick={onOpenNavigation} className="icon-button topbar-mobile-menu" aria-label={t.navOpenMenu}><Menu className="h-5 w-5" aria-hidden="true" /></button>
          <div className="brand-mark" aria-hidden="true"><BrandMark /></div>
          <div className="min-w-0"><h1 className="text-sm font-semibold text-ink">{t.headerTitle}</h1><p>{t.headerSubtitle}</p></div>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={onToggleLayout} className="btn-secondary layout-toggle" title={layoutMode === 'horizontal' ? t.modeColumn : t.modeSideBySide} aria-label={layoutMode === 'horizontal' ? t.modeSideBySide : t.modeColumn}>
            {layoutMode === 'horizontal' ? <Columns3 className="h-4 w-4" aria-hidden="true" /> : <Rows3 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <div className="theme-quick-wrap" ref={pickerRef}>
            <button type="button" ref={pickerButton} className="icon-button theme-quick-trigger" aria-label={copy.choose} title={copy.choose} aria-expanded={quickOpen} aria-controls={quickOpen ? 'theme-quick-panel' : undefined} onClick={() => setQuickOpen((value) => !value)}><Palette className="h-4 w-4" aria-hidden="true" /></button>
            {quickOpen && <div id="theme-quick-panel" className="theme-picker-popover" role="dialog" aria-label={copy.choose}>
              <h2 className="theme-picker-popover__title">{copy.title}</h2>
              <p className="theme-picker-popover__hint">{copy.hint}</p>
              <ThemeSwatches selected={palette} onSelect={(name) => themeManager.applyPalette(name)} />
              <div className="theme-palette-current" role="status"><span>{copy.selected}</span><strong>{THEME_PALETTES[palette].label}</strong></div>
            </div>}
          </div>
          <button type="button" onClick={toggleTheme} className="icon-button" aria-label={t.toggleTheme} title={t.toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="button" onClick={onOpenSettings} className="icon-button" aria-label={settingsLabel} title={settingsLabel}><Settings className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </div>
    </header>
  )
}
