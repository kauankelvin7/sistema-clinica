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
    RMS: 'https://maismedicos.saude.gov.br/new/web/app.php/maismedicos/rms' // Portal genérico RMS
  }

  const targetUrl = urls[tipoRegistro]

  const handleOpenPopup = () => {
    // Abre uma janela menor sobreposta (estilo popup de login) em vez de uma aba perdida
    const width = 1000;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(targetUrl, '_blank', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 transform animate-in zoom-in-95">
        
        {/* Header do Modal */}
        <div className="bg-zinc-900 dark:bg-black p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Consulta Oficial: {tipoRegistro}</h2>
              <p className="text-zinc-400 text-xs">Fonte: {targetUrl}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alerta de Segurança (Caso o iframe seja bloqueado pelo CFM) */}
        <div className="bg-orange-50 dark:bg-orange-500/10 border-b border-orange-200 dark:border-orange-500/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-orange-800 dark:text-orange-300">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Por segurança, alguns conselhos bloqueiam a exibição direta aqui. Se a página abaixo ficar em branco, clique no botão ao lado.
            </p>
          </div>
          <button 
            onClick={handleOpenPopup}
            className="shrink-0 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-md"
          >
            Abrir Janela Externa
          </button>
        </div>

        {/* Iframe */}
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
