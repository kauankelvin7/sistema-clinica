import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Download, Maximize2, Minimize2 } from 'lucide-react'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  htmlContent: string
  fileName?: string
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  htmlContent,
  fileName = 'documento.html',
}: DocumentPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  // Criar e limpar Blob URL
  useEffect(() => {
    if (isOpen && htmlContent) {
      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
      blobUrlRef.current = URL.createObjectURL(blob)
      setIframeLoaded(false)
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [isOpen, htmlContent])

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Bloquear scroll do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    }
  }, [])

  const handleDownload = useCallback(() => {
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [htmlContent, fileName])

  if (!isOpen || !htmlContent) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 dark:bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`bg-white dark:bg-zinc-900 flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 transform animate-in zoom-in-95 duration-200 transition-all ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-[95vw] max-w-6xl h-[92vh] rounded-2xl'
        }`}
      >
        {/* Barra de Ferramentas */}
        <header className="flex items-center justify-between gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">
              Pré-visualização do Documento
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Botão Imprimir */}
            <button
              onClick={handlePrint}
              disabled={!iframeLoaded}
              title="Imprimir documento"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-orange-500 hover:bg-orange-600 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150 shadow-sm hover:shadow-md active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Botão Baixar */}
            <button
              onClick={handleDownload}
              title="Baixar como HTML"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600
                text-zinc-700 dark:text-zinc-200
                transition-all duration-150 shadow-sm hover:shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar</span>
            </button>

            {/* Separador */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-1" />

            {/* Botão Fullscreen */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400
                hover:bg-zinc-200 dark:hover:bg-zinc-700
                transition-all duration-150 active:scale-95"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Botão Fechar */}
            <button
              onClick={onClose}
              title="Fechar"
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400
                hover:bg-rose-100 dark:hover:bg-rose-900/30
                hover:text-rose-600 dark:hover:text-rose-400
                transition-all duration-150 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Área do Iframe com Preview */}
        <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
          {/* Indicador de carregamento */}
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Carregando documento...
                </span>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={blobUrlRef.current || undefined}
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-full border-0"
            title="Pré-visualização do documento"
            sandbox="allow-same-origin allow-scripts allow-modals"
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
