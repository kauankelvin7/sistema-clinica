import { useState } from 'react'
import { Eye, EyeOff, HeartPulse, Loader2, Lock, Settings, ShieldCheck, User as UserIcon } from 'lucide-react'
import { loginUser } from '../services/api'
import { useTranslation } from '../utils/i18n'
import SettingsModal from './SettingsModal'

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
      setError('Não foi possível entrar. Confira o usuário e a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-surface flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className="icon-button absolute right-4 top-4 sm:right-6 sm:top-6"
        aria-label="Abrir configurações"
        title="Configurações"
      >
        <Settings className="h-4 w-4" />
      </button>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_80px_-44px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-surface-card lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-garnet-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-garnet-300">
              <HeartPulse className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-garnet-300">NOVA Medicina</p>
            <h1 className="mt-3 max-w-md font-display text-3xl font-bold leading-tight tracking-tight">
              {t.loginAppTitle}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">{t.loginAppSubtitle}</p>
          </div>

          <div className="relative space-y-3 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sessão protegida por cookie HttpOnly</span>
            </div>
            <div className="h-px bg-white/10" />
            <p className="text-xs leading-5 text-zinc-500">{t.loginRestrictedNotice}</p>
          </div>
        </aside>

        <main className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-garnet-500/15 bg-garnet-500/10 text-garnet-500 lg:hidden">
                <Lock className="h-5 w-5" />
              </div>
              <p className="workspace-kicker">Acesso seguro</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Entrar no sistema
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Use suas credenciais autorizadas para iniciar um atendimento.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="field-label">{t.loginUserLabel}</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="input-field pl-10"
                    placeholder={t.loginUserPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="field-label">{t.loginPassLabel}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="input-field pl-10 pr-11"
                    placeholder={t.loginPassPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-garnet-500 focus:ring-garnet-500"
                />
                <span>{t.loginDemoCredentials}</span>
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-3 text-sm text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.btnAuthenticating}</span>
                  </>
                ) : (
                  <span>{t.btnEnterSystem}</span>
                )}
              </button>
            </form>

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t.loginRestrictedNotice}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
