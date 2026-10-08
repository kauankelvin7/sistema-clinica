import { Printer, Loader2, Trash2, ArrowUpRight } from 'lucide-react'
import type { ActionButtonsProps } from '../types'
import { useTranslation } from '../utils/i18n'

export default function ActionButtons({ onGenerateHTML, onClear, loading }: ActionButtonsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row clinical-action-group">
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
          className="btn-primary w-full sm:min-w-44 clinical-action-primary"
        >
          {loading === 'html' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{t.btnGenerating}</span>
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>{t.btnGenerateHTML}</span>
              <ArrowUpRight className="h-4 w-4 clinical-action-arrow" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
