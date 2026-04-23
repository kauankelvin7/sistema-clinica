import { useState } from 'react'
import { Stethoscope, Lock, User as UserIcon, Loader2 } from 'lucide-react'
import { loginUser } from '../services/api'

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <Stethoscope className="w-10 h-10 text-white -rotate-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Acesso Restrito
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Sistema de Homologação de Atestados
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-10 px-6 sm:rounded-3xl sm:px-12 shadow-[0_0_60px_-15px_rgba(249,115,22,0.15)] border border-zinc-100 dark:border-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Usuário
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
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Senha
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
                  className="block w-full pl-10 pr-3 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
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
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-zinc-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-100 cursor-pointer">
                Lembrar de mim (30 dias)
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs text-zinc-500">
          Esta área é restrita para profissionais autorizados. Todo acesso é monitorado.
        </p>
      </div>
    </div>
  )
}
