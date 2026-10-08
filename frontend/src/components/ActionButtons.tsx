import { FileText, Loader2, Trash2 } from 'lucide-react'
import type { ActionButtonsProps } from '../types'
import { useTranslation } from '../utils/i18n'

export default function ActionButtons({ onGenerateHTML, onClear, loading }: ActionButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onClear}
          disabled={!!loading}
          className="btn-secondary w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>{t.btnClearForm}</span>
        </button>

        <button
          type="button"
          onClick={onGenerateHTML}
          disabled={!!loading}
          aria-busy={loading === 'html'}
          className="btn-primary w-full sm:min-w-44"
        >
          {loading === 'html' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t.btnGenerating}</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>{t.btnGenerateHTML}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
