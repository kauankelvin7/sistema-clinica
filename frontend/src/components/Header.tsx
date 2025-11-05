import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return 'dark';
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  // Ranking removido

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
    <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo e Título */}
          <div className="flex items-center gap-5">
            {/* Logo Container com Estetoscópio */}
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Estetoscópio */}
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </div>
            </div>
            
            {/* Títulos */}
            <div className="text-center sm:text-left">
              <h1 className="text-white text-3xl font-extrabold tracking-tight leading-tight">
                Sistema de Homologação
              </h1>
              <p className="text-emerald-50 text-sm font-medium mt-1">
                Atestados Médicos Digitais
              </p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="w-12 h-12 rounded-xl bg-white/95 dark:bg-emerald-800 shadow-md hover:shadow-lg flex items-center justify-center group"
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
            ) : (
              <Moon className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
      
      {/* Barra decorativa inferior */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500"></div>
    </div>
  )
}
