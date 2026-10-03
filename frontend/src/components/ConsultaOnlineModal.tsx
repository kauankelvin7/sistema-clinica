import { X, ExternalLink, ShieldAlert } from 'lucide-react'
import Dialog from './Dialog'

interface ConsultaOnlineModalProps {
  isOpen: boolean
  onClose: () => void
  tipoRegistro: 'CRM' | 'CRO' | 'RMS' | null
}

export default function ConsultaOnlineModal({ isOpen, onClose, tipoRegistro }: ConsultaOnlineModalProps) {
  if (!tipoRegistro) return null

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
    <Dialog isOpen={isOpen} onClose={onClose} label={`Consulta Oficial ${tipoRegistro}`}>
      <div className="bg-white dark:bg-surface-card rounded-3xl shadow-2xl w-full max-w-5xl h-[82vh] max-h-[780px] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 transform animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header Adaptativo Glassmorphism */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-slate-500/10 dark:bg-slate-400/15 border border-slate-500/20 rounded-2xl flex items-center justify-center text-slate-500 flex-shrink-0">
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Consulta Oficial: <span className="text-slate-400 dark:text-slate-300">{tipoRegistro}</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-md">
                {targetUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-button"
            title="Fechar"
            aria-label="Fechar consulta"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Alerta de Segurança e Ação de Janela Externa */}
        <div className="bg-slate-500/10 border-b border-slate-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <p className="font-medium">
              Caso o conselho bloqueie a exibição direta nesta aba, utilize o botão ao lado para abrir a consulta oficial em uma janela externa.
            </p>
          </div>
          <button 
            onClick={handleOpenPopup}
            className="min-h-11 shrink-0 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Abrir Janela Externa</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
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
    </Dialog>
  )
}
