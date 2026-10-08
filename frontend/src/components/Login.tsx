import BrandMark from './BrandMark'
import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Settings, User as UserIcon } from 'lucide-react'
import { loginUser } from '../services/api'
import { useTranslation } from '../utils/i18n'
import ClinicalArtwork from './ClinicalArtwork'
import SettingsModal from './SettingsModal'
import './AppShell.css'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginUser(username, password, rememberMe)
      onLoginSuccess()
    } catch {
      setError(t.loginError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <button type="button" onClick={() => setIsSettingsOpen(true)} className="icon-button login-settings" aria-label={t.navSettings} title={t.navSettings}>
        <Settings className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="login-stage">
        <aside className="login-story">
          <div className="login-story-brand"><BrandMark className="h-8 w-8" /></div>
          <div className="login-story-eyebrow">{t.loginAppTitle}</div>
          <h1>{t.loginHeroTitle}</h1>
          <p className="login-story-description">{t.loginAppSubtitle}</p>
          <ClinicalArtwork className="login-art" />
        </aside>
        <main className="login-panel">
          <div className="login-panel-inner">
            <div className="login-panel-top">
              <div className="login-brand-lockup">
                <div className="brand-mark"><BrandMark /></div>
                <div className="login-brand-label">
                  <strong>Sistema Clínica</strong>
                  <span>{t.headerTitle}</span>
                </div>
              </div>
            </div>
            <h2 className="login-heading">{t.loginHeading}</h2>
            <p className="login-intro">{t.loginIntro}</p>
            <form className="login-form" onSubmit={handleSubmit} aria-busy={loading}>
              <div>
                <label htmlFor="username" className="field-label">{t.loginUserLabel}</label>
                <div className="login-input">
                  <UserIcon aria-hidden="true" />
                  <input id="username" type="text" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="input-field" placeholder={t.loginUserPlaceholder} aria-describedby={error ? 'login-error' : undefined} />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="field-label">{t.loginPassLabel}</label>
                <div className="login-input login-input--password">
                  <Lock aria-hidden="true" />
                  <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="input-field" placeholder={t.loginPassPlaceholder} aria-describedby={error ? 'login-error' : undefined} />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="login-password-toggle" aria-label={showPassword ? t.loginHidePassword : t.loginShowPassword} aria-pressed={showPassword}>
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <label className="login-remember">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                <span>{t.loginDemoCredentials}</span>
              </label>
              {error && <div id="login-error" role="alert" className="login-error">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>{t.btnAuthenticating}</span></> : <><span>{t.btnEnterSystem}</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
