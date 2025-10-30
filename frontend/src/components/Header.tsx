import { useEffect, useState } from 'react'
import { FileHeart, Sparkles, Sun, Moon } from 'lucide-react'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark') return 'dark'
    } catch { }
    // default: follow prefers-color-scheme
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch {}
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-2xl p-6 md:p-8 shadow-2xl">
      {/* Efeito de brilho animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
      
      {/* Padrões decorativos */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
      </div>
      
  <div className="relative flex items-center gap-4 md:gap-6">
        {/* Logo com animação flutuante */}
        <div className="relative group animate-float">
          <div className="absolute inset-0 bg-white rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
            <FileHeart className="w-8 h-8 md:w-9 md:h-9 text-blue-600" />
          </div>
        </div>
        
        {/* Título */}
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-white text-xl md:text-3xl font-bold tracking-tight drop-shadow-md">
              Sistema de Homologação
            </h1>
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-blue-200 animate-pulse hidden sm:block" />
          </div>
          <p className="text-blue-100 text-xs md:text-sm font-medium mt-1 drop-shadow">
            Geração de Declarações Médicas - Por Kauan Kelvin
          </p>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema claro/escuro"
            title="Alternar tema"
            className="ml-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-slate-700 shadow-md hover:scale-105 transform transition"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
