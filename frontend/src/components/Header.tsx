import { useEffect, useState } from 'react'
import { Sun, Moon, LogOut, Download, CheckCircle2 } from 'lucide-react'

interface HeaderProps {
  onLogout?: () => void
}

export default function Header({ onLogout }: HeaderProps) {
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

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

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

  useEffect(() => {
    // Detect if already running as standalone app
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instructions if prompt not available directly
      alert('Para instalar o App no Desktop:\n1. Clique no ícone de instalação (ou 3 pontos) na barra do seu navegador.\n2. Selecione "Instalar NOVA - Sistema de Homologação".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <header className="relative bg-white/90 dark:bg-surface-card/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-[clamp(12px,2vw,32px)] py-2.5 transition-all duration-200 z-20">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        
        {/* Logo e Título com Sora */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
              <circle cx="20" cy="10" r="2" />
            </svg>
          </div>
          
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
              Sistema de Homologação
            </h1>
            <p className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none hidden sm:block">
              Atestados Médicos Digitais
            </p>
          </div>
        </div>

        {/* Botões de Ação do Header (PWA Desktop + Tema + Logout) */}
        <div className="flex items-center gap-2">
          
          {/* Botão de Instalação PWA Desktop */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 shadow-xs ${
                installed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600'
              }`}
              title="Instalar Sistema no Desktop"
            >
              {installed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">App Instalado</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 animate-bounce" />
                  <span>Instalar App</span>
                </>
              )}
            </button>
          )}

          {/* Alternador de Tema */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 hover:border-orange-500/40 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 transition-all duration-200 flex items-center justify-center group"
            title="Alternar Tema Claro/Escuro"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>

          {/* Botão de Sair / Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700/60 rounded-lg transition-all duration-200"
              title="Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
