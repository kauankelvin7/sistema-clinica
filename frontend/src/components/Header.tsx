import { useEffect, useState } from 'react'
import { Sun, Moon, LogOut, Download, CheckCircle2, User, Monitor, Smartphone } from 'lucide-react'

interface HeaderProps {
  onLogout?: () => void
  layoutMode?: 'vertical' | 'horizontal'
  onToggleLayout?: () => void
}

export default function Header({ onLogout, layoutMode = 'horizontal', onToggleLayout }: HeaderProps) {
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
    <header className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-8 py-3.5 sm:py-4 transition-all duration-200 z-20 shadow-xs dark:shadow-none">
      {/* Linha de Destaque Superior em Gradiente Laranja */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: Logo + Título + Subtítulo */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-amber-500/5 dark:from-orange-500/25 dark:via-orange-500/15 dark:to-amber-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0 shadow-sm shadow-orange-500/10 transition-transform hover:scale-105 duration-200">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
              <circle cx="20" cy="10" r="2.2" fill="currentColor" />
            </svg>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                Sistema de Homologação
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hidden xs:inline-block">
                v2.0
              </span>
            </div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none hidden sm:block">
              Atestados Médicos Digitais
            </p>
          </div>
        </div>

        {/* CENTRO: Status do Sistema + Alternador de Layout */}
        <div className="flex items-center gap-3">
          {/* Badge de Status Online */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Sistema Operacional</span>
          </div>

          {/* Botão de Alternar Modo de Layout */}
          {onToggleLayout && (
            <button
              onClick={onToggleLayout}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all duration-200 shadow-xs"
              title="Alternar entre visualização lado a lado e coluna"
            >
              {layoutMode === 'horizontal' ? (
                <Monitor className="w-4 h-4 text-orange-500" />
              ) : (
                <Smartphone className="w-4 h-4 text-orange-500" />
              )}
              <span>Modo {layoutMode === 'horizontal' ? 'Lado a Lado' : 'Coluna'}</span>
            </button>
          )}
        </div>

        {/* LADO DIREITO: Perfil do Operador + PWA + Tema + Sair */}
        <div className="flex items-center gap-2.5">
          
          {/* Indicador do Usuário/Operador */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
            <User className="w-3.5 h-3.5 text-orange-500" />
            <span>Operador Clínico</span>
          </div>

          {/* Botão de Instalação PWA Desktop */}
          {!isStandalone && (
            <button
              onClick={handleInstallClick}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-200 shadow-xs ${
                installed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-transparent shadow-md shadow-orange-500/20'
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

          {/* Alternador de Tema Claro/Escuro */}
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 hover:border-orange-500/40 text-zinc-500 dark:text-zinc-300 hover:text-orange-500 transition-all duration-200 flex items-center justify-center group shadow-xs"
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
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-500/20 rounded-xl transition-all duration-200"
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
