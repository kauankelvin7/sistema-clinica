import { useEffect, useState } from 'react'
import { Check, Download, Globe, Monitor, Moon, Palette, Sun, X } from 'lucide-react'
import { useTranslation, setSavedLanguage, type Language } from '../utils/i18n'
import { themeManager, THEME_PALETTES } from '../utils/themeManager'
import { usePWA } from '../utils/usePWA'
import { useTheme } from '../hooks/useTheme'
import Dialog from './Dialog'

interface Props { isOpen: boolean; onClose: () => void }
export default function SettingsModal({ isOpen, onClose }: Props) {
  const { lang } = useTranslation()
  const { appearance, setAppearance } = useTheme()
  const { isStandalone, installed, deferredPrompt, installApp } = usePWA()
  const [palette, setPalette] = useState(() => themeManager.getPalette())
  const [compact, setCompact] = useState(() => document.documentElement.dataset.density === 'compact')
  const [reduced, setReduced] = useState(() => document.documentElement.dataset.transparency === 'reduced')
  const [feedback, setFeedback] = useState('')
  const c = {
    pt: { title: 'Configurações do Sistema', intro: 'Aparência, idioma e aplicativo.', appearance: 'Aparência', palette: 'Paleta de Cores do Sistema', language: 'Idioma da Interface / Language', light: 'Modo Claro', dark: 'Modo Escuro', system: 'Automático (sistema)', classicPalettes: 'Paletas da clínica', levePalettes: 'Paletas do Leve', density: 'Modo compacto', densityHelp: 'Menos espaço entre grupos, mesmos controles.', transparency: 'Reduzir transparência', done: 'Concluído', close: 'Fechar', saved: 'Preferência aplicada.', install: 'Instalar App Agora', installed: 'App Instalado no Dispositivo', installHelp: 'A instalação depende do navegador. Use seu menu para instalar quando esta opção estiver disponível.', installStarted: 'Instalação iniciada.' },
    en: { title: 'System settings', intro: 'Appearance, language and application.', appearance: 'Appearance', palette: 'System color palette', language: 'Interface language', light: 'Light mode', dark: 'Dark mode', system: 'System preference', classicPalettes: 'Clinical palettes', levePalettes: 'Leve palettes', density: 'Compact mode', densityHelp: 'Less space between groups, same controls.', transparency: 'Reduce transparency', done: 'Done', close: 'Close', saved: 'Preference applied.', install: 'Install app', installed: 'App installed on this device', installHelp: 'Installation depends on your browser. Use its menu to install when available.', installStarted: 'Installation started.' },
    es: { title: 'Configuración del sistema', intro: 'Apariencia, idioma y aplicación.', appearance: 'Apariencia', palette: 'Paleta de colores del sistema', language: 'Idioma de la interfaz', light: 'Modo claro', dark: 'Modo oscuro', system: 'Automático (sistema)', classicPalettes: 'Paletas clínicas', levePalettes: 'Paletas de Leve', density: 'Modo compacto', densityHelp: 'Menos espacio entre grupos, mismos controles.', transparency: 'Reducir transparencia', done: 'Listo', close: 'Cerrar', saved: 'Preferencia aplicada.', install: 'Instalar aplicación', installed: 'Aplicación instalada en este dispositivo', installHelp: 'La instalación depende del navegador. Use su menú para instalar cuando esté disponible.', installStarted: 'Instalación iniciada.' },
  }[lang]
  useEffect(() => { const update = () => setPalette(themeManager.getPalette()); window.addEventListener('palette_changed', update); return () => window.removeEventListener('palette_changed', update) }, [])
  const persistDisplay = (key: 'density' | 'transparency', value: string) => {
    document.documentElement.dataset[key] = value
    try { localStorage.setItem(`display_${key}`, value) } catch { /* Preference does not block work. */ }
    setFeedback(c.saved)
  }
  return <Dialog isOpen={isOpen} onClose={onClose} label={c.title}>
    <section className="settings-panel">
      <header><div><h2>{c.title}</h2><p>{c.intro}</p></div><button className="icon-button" data-testid="settings-close" onClick={onClose} aria-label={c.close} title={c.close}><X className="h-4 w-4" aria-hidden="true" /></button></header>
      <div className="settings-content">
        <section><h3>{c.appearance}</h3><div className="settings-theme">
            <button data-testid="theme-light" className="btn-secondary" aria-pressed={appearance === 'light'} onClick={() => { setAppearance('light'); setFeedback(c.saved) }}><Sun className="h-4 w-4" aria-hidden="true" />{c.light}</button>
            <button data-testid="theme-dark" className="btn-secondary" aria-pressed={appearance === 'dark'} onClick={() => { setAppearance('dark'); setFeedback(c.saved) }}><Moon className="h-4 w-4" aria-hidden="true" />{c.dark}</button>
            <button data-testid="theme-system" className="btn-secondary" aria-pressed={appearance === 'system'} onClick={() => { setAppearance('system'); setFeedback(c.saved) }}><Monitor className="h-4 w-4" aria-hidden="true" />{c.system}</button>
          </div>
          <label className="settings-check"><input type="checkbox" checked={compact} onChange={(event) => { setCompact(event.target.checked); persistDisplay('density', event.target.checked ? 'compact' : 'comfortable') }} /><span>{c.density}<small>{c.densityHelp}</small></span></label>
          <label className="settings-check"><input type="checkbox" checked={reduced} onChange={(event) => { setReduced(event.target.checked); persistDisplay('transparency', event.target.checked ? 'reduced' : 'normal') }} /><span>{c.transparency}</span></label>
          <h3><Palette className="h-4 w-4" aria-hidden="true" />{c.palette}</h3>
          {([false, true] as const).map((isLeve) => (
            <div key={String(isLeve)} className="settings-palette-group">
              <h4 className="settings-palette-heading">{isLeve ? c.levePalettes : c.classicPalettes}</h4>
              <div className="settings-palettes">
                {Object.values(THEME_PALETTES).filter((item) => Boolean(item.leve) === isLeve).map((item) => (
                  <button key={item.name} className="btn-secondary" aria-pressed={palette === item.name} onClick={() => { themeManager.applyPalette(item.name); setFeedback(c.saved) }}>
                    <i aria-hidden="true" style={{ background: `rgb(${item.colors[500]})` }} />{item.label}{palette === item.name && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
        <section><h3><Globe className="h-4 w-4" aria-hidden="true" />{c.language}</h3><div className="settings-languages">{[['pt', 'Português (BR)'], ['en', 'English (US)'], ['es', 'Español']].map(([code, label]) => <button key={code} className="btn-secondary" aria-pressed={lang === code} onClick={() => { setSavedLanguage(code as Language); setFeedback('') }}>{label}</button>)}</div></section>
        {!isStandalone && <section><h3><Download className="h-4 w-4" aria-hidden="true" />{installed ? c.installed : c.install}</h3><p>{c.installHelp}</p>{!installed && deferredPrompt && <button className="btn-secondary" onClick={() => void installApp().then((success) => { if (success) setFeedback(c.installStarted) })}>{c.install}</button>}</section>}
      </div>
      <footer><p role="status">{feedback}</p><button className="btn-primary" onClick={onClose}>{c.done}</button></footer>
    </section>
  </Dialog>
}
