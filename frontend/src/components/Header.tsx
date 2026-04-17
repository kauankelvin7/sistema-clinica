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
    // Transformado em tag <header> para melhor semântica
    <header className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
      <div className="px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo e Títulos */}
          <div className="flex items-center gap-5">
            {/* Logo Container com Gradiente Laranja e Efeito Glow */}
            <div className="relative group">
              {/* Sombra de luz que acende no hover */}
              <div className="absolute inset-0 bg-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform group-hover:scale-105 transition-all duration-300">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Estetoscópio */}
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </div>
            </div>
            
            {/* Títulos com Nova Tipografia Premium */}
            <div className="text-center sm:text-left">
              <h1 className="text-zinc-900 dark:text-white text-3xl sm:text-4xl font-black tracking-tighter leading-none mb-1.5">
                Sistema de Homologação
              </h1>
              <p className="text-orange-600 dark:text-orange-500 text-xs sm:text-sm font-bold tracking-widest uppercase">
                Atestados Médicos Digitais
              </p>
            </div>
          </div>

          {/* Theme toggle com design Glassmorphism e microinterações */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-transparent dark:border-zinc-700 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:bg-orange-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 transition-all duration-300 flex items-center justify-center group shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" strokeWidth={2.5} />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
      
      {/* Barra decorativa inferior - Fina e Elegante */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 opacity-90"></div>
    </header>
  )
}
