import { useState } from 'react'
import { Lock, User as UserIcon, Loader2, Settings } from 'lucide-react'
import { loginUser } from '../services/api'
import { useTranslation } from '../utils/i18n'
import SettingsModal from './SettingsModal'

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await loginUser(username, password, rememberMe)
      onLoginSuccess(data.access_token)
    } catch (err: any) {
      setError('Credenciais inválidas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-surface-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Botão de Configurações no Topo Direito da Tela de Login */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-md transition-all group"
          title="Configurações (Idioma e Tema)"
        >
          <Settings className="w-4 h-4 text-garnet-500 group-hover:rotate-90 transition-transform duration-300" />
          <span>Configurações</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-garnet-500/10 dark:bg-garnet-500/15 border border-garnet-500/20 rounded-2xl flex items-center justify-center text-garnet-500 flex-shrink-0 shadow-lg shadow-garnet-500/10">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>
              <circle cx="20" cy="10" r="2"></circle>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight transition-all duration-300">
          {t.loginAppTitle}
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400 transition-all duration-300">
          {t.loginAppSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-surface-card py-10 px-6 sm:rounded-3xl sm:px-12 shadow-[0_0_60px_-15px_rgba(110,45,41,0.2)] border border-zinc-100 dark:border-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t.loginUserLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-surface-input text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-garnet-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder={t.loginUserPlaceholder}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t.loginPassLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-surface-input text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-garnet-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder={t.loginPassPlaceholder}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-garnet-500 focus:ring-garnet-500 border-zinc-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer">
                {t.loginDemoCredentials}
              </label>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 border-l-4 border-rose-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-rose-700 dark:text-rose-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-garnet-500 to-garnet-600 hover:from-garnet-600 hover:to-garnet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garnet-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.btnEnterSystem
                )}
              </button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs text-zinc-500 transition-all duration-300">
          {t.loginRestrictedNotice}
        </p>
      </div>
    </div>
  )
}
