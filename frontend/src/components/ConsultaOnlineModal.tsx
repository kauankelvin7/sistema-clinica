import { X, ExternalLink, ShieldAlert } from 'lucide-react'

interface ConsultaOnlineModalProps {
  isOpen: boolean
  onClose: () => void
  tipoRegistro: 'CRM' | 'CRO' | 'RMS' | null
}

export default function ConsultaOnlineModal({ isOpen, onClose, tipoRegistro }: ConsultaOnlineModalProps) {
  if (!isOpen || !tipoRegistro) return null

  // URLs Reais de Busca dos Conselhos
  const urls = {
    CRM: 'https://portal.cfm.org.br/busca-medicos/',
    CRO: 'https://website.cfo.org.br/profissionais-cadastrados/',
    RMS: 'https://maismedicos.saude.gov.br/new/web/app.php/maismedicos/rms'
  }

  const targetUrl = urls[tipoRegistro]

  const handleOpenPopup = () => {
    const width = 1000;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(targetUrl, '_blank', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 transform animate-in zoom-in-95 duration-200">
        
        {/* Header Adaptativo Glassmorphism */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 flex-shrink-0">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Consulta Oficial: <span className="text-orange-500">{tipoRegistro}</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-md">
                {targetUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 rounded-xl flex items-center justify-center transition-all border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerta de Segurança e Ação de Janela Externa */}
        <div className="bg-orange-500/10 border-b border-orange-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="font-medium">
              Caso o conselho bloqueie a exibição direta nesta aba, utilize o botão ao lado para abrir a consulta oficial em uma janela externa.
            </p>
          </div>
          <button 
            onClick={handleOpenPopup}
            className="shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Abrir Janela Externa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Iframe da Consulta Oficial */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 relative">
          <iframe 
            src={targetUrl} 
            className="absolute inset-0 w-full h-full border-0"
            title={`Consulta ${tipoRegistro}`}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
