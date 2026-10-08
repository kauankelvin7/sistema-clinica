import { useUiCopy } from '../utils/uiCopy'
import { Check, Database, HardDrive, RefreshCw, WifiOff } from 'lucide-react'
import type { DirectoryStatus as Status } from '../hooks/useClinicDirectory'

interface DirectoryStatusProps {
  status: Status
  cachedAt: number | null
  patientCount: number
  doctorCount: number
  pendingCount: number
  onRefresh: () => void
}

function formatTime(timestamp: number | null) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export default function DirectoryStatus({
  status,
  cachedAt,
  patientCount,
  doctorCount,
  pendingCount,
  onRefresh,
}: DirectoryStatusProps) {
  const c = useUiCopy()
  const syncing = status === 'loading' || status === 'syncing'
  const stale = status === 'cache' || status === 'stale'
  const unavailable = status === 'error'

  return (
    <div className="directory-status" role="status">
      <div className="directory-status__icon" aria-hidden="true">
        {syncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : unavailable ? (
          <WifiOff className="h-4 w-4" />
        ) : stale ? (
          <HardDrive className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="directory-status__title">
            {syncing
              ? c.syncing
              : unavailable
                ? c.unavailable
                : stale
                  ? c.local
                  : c.fresh}
          </span>
          {cachedAt && (
            <span className="directory-status__time">{formatTime(cachedAt)}</span>
          )}
        </div>
        <p className="directory-status__meta">
          <Database className="h-3 w-3" />
          {patientCount} {c.patients} · {doctorCount} {c.doctors}
          {pendingCount > 0 && ` · ${pendingCount} ${c.pending}`}
          {stale && ` · ${c.refreshing}`}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={syncing}
        className="directory-status__refresh"
        aria-label={c.refresh}
        title={c.refresh}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
