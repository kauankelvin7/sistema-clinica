import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Printer, Download, Maximize2, Minimize2 } from 'lucide-react'
import Dialog from './Dialog'
import { useTranslation } from '../utils/i18n'

interface Props {
  isOpen: boolean
  onClose: () => void
  htmlContent: string
  fileName?: string
  /** Owned by the generation, survives preview rerenders/remounts; contains no PII. */
  generation: { attempted: boolean }
}
export default function DocumentPreviewModal({ isOpen, onClose, htmlContent, fileName = 'documento.html', generation }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [printBlocked, setPrintBlocked] = useState(false)
  const active = useRef({ isOpen, generation })
  active.current = { isOpen, generation }
  const { lang } = useTranslation()
  const c = {
    pt: { title: 'Pré-visualização do Documento', frame: 'Pré-visualização do documento', print: 'Imprimir', printLabel: 'Imprimir documento', download: 'Baixar', downloadLabel: 'Baixar como HTML', full: 'Tela cheia', exit: 'Sair de tela cheia', close: 'Fechar pré-visualização', loading: 'Carregando documento...', blocked: 'Se a impressão não abriu, use Imprimir documento.' },
    en: { title: 'Document preview', frame: 'Document preview', print: 'Print', printLabel: 'Print document', download: 'Download', downloadLabel: 'Download as HTML', full: 'Fullscreen', exit: 'Exit fullscreen', close: 'Close preview', loading: 'Loading document...', blocked: 'If printing did not open, use Print document.' },
    es: { title: 'Vista previa del documento', frame: 'Vista previa del documento', print: 'Imprimir', printLabel: 'Imprimir documento', download: 'Descargar', downloadLabel: 'Descargar como HTML', full: 'Pantalla completa', exit: 'Salir de pantalla completa', close: 'Cerrar vista previa', loading: 'Cargando documento...', blocked: 'Si no se abrió la impresión, use Imprimir documento.' },
  }[lang]
  useEffect(() => { if (isOpen) { setIframeLoaded(false); setPrintBlocked(false) } }, [isOpen, generation])
  const handlePrint = useCallback(() => {
    const frame = iframeRef.current
    if (!frame?.contentWindow) return
    try { frame.contentWindow.focus(); frame.contentWindow.print() }
    catch {
      setPrintBlocked(true)
      try { window.print() } catch { /* Existing fallback; manual action remains, never loop. */ }
    }
  }, [])
  const handleIframeLoad = useCallback(async () => {
    const frame = iframeRef.current
    const loadedDocument = frame?.contentDocument
    if (!loadedDocument) return
    try { await loadedDocument.fonts?.ready } catch { /* onLoad confirms readiness. */ }
    if (!frame?.isConnected || !active.current.isOpen || active.current.generation !== generation) return
    setIframeLoaded(true)
    if (!generation.attempted) { generation.attempted = true; handlePrint() }
  }, [generation, handlePrint])
  const handleDownload = useCallback(() => {
    const url = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html; charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = fileName
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url)
  }, [htmlContent, fileName])
  return <Dialog isOpen={isOpen && !!htmlContent} onClose={onClose} label={c.title}>
    <section className={`document-preview ${isFullscreen ? 'document-preview--full' : ''}`}>
      <header className="preview-toolbar">
        <h3>{c.title}</h3>
        <div>
          <button onClick={handlePrint} disabled={!iframeLoaded} title={c.printLabel} aria-label={c.printLabel} className="btn-primary"><Printer className="h-4 w-4" aria-hidden="true" /><span>{c.print}</span></button>
          <button onClick={handleDownload} title={c.downloadLabel} aria-label={c.downloadLabel} className="btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /><span>{c.download}</span></button>
          <button onClick={() => setIsFullscreen((previous) => !previous)} title={isFullscreen ? c.exit : c.full} aria-label={isFullscreen ? c.exit : c.full} className="icon-button">{isFullscreen ? <Minimize2 aria-hidden="true" className="h-4 w-4" /> : <Maximize2 aria-hidden="true" className="h-4 w-4" />}</button>
          <button onClick={onClose} title={c.close} aria-label={c.close} className="icon-button"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      </header>
      {printBlocked && <p role="status" className="print-fallback">{c.blocked}</p>}
      <div className="preview-document">
        {!iframeLoaded && <div role="status" className="preview-loading">{c.loading}</div>}
        <iframe ref={iframeRef} srcDoc={htmlContent} onLoad={() => void handleIframeLoad()} sandbox="allow-same-origin allow-modals" referrerPolicy="no-referrer" title={c.frame} />
      </div>
    </section>
  </Dialog>
}
