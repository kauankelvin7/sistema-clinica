import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './Dialog.css'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}

export default function Dialog({ isOpen, onClose, label, children, className = '' }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-dialog-focus]')?.focus()
    }
    else if (!isOpen && dialog.open) dialog.close()

    return () => {
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  if (typeof document === 'undefined') return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={label}
      className={`app-dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {isOpen ? children : null}
    </dialog>,
    document.body
  )
}
