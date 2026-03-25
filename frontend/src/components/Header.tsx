import { useEffect, useState } from 'react'
import { Sun, Moon, Menu, X, BadgeCheck, Shield, HeartPulse, Dumbbell } from 'lucide-react'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'homologacao', label: 'Homologação', icon: BadgeCheck, color: 'from-blue-500 to-indigo-600' },
  { id: 'vigilante', label: 'Vigilante', icon: Shield, color: 'from-amber-500 to-orange-600' },
  { id: 'saude', label: 'Saúde', icon: HeartPulse, color: 'from-rose-500 to-pink-600' },
  { id: 'atividades', label: 'Atividades Físicas', icon: Dumbbell, color: 'from-emerald-500 to-teal-600' },
]

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark') return 'dark'
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <header className="bg-gradient-header rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
      <div className="px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                  <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                  <circle cx="20" cy="10" r="2" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-white text-xl lg:text-2xl font-extrabold tracking-tight">
                NOVA Atestados
              </h1>
              <p className="text-primary-200 text-xs font-medium mt-0.5">
                Medicina e Segurança do Trabalho
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`tab-button ${isActive ? 'active' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${tab.color} shadow-md`}>
                    <Icon className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                  <span className="hidden xl:inline">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full tab-indicator"></div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all duration-200"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-300" />
              ) : (
                <Moon className="w-5 h-5 text-primary-200" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-all duration-200"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pb-4 animate-slide-down">
          <nav className="grid grid-cols-2 gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${tab.color} shadow-md`}>
                    <Icon className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                  <span className="text-sm font-semibold">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      )}

      {/* Gradient bar */}
      <div className="h-1 bg-gradient-to-r from-primary-400 via-accent-400 to-pink-400"></div>
    </header>
  )
}
