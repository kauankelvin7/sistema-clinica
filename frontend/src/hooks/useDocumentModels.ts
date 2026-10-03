import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDocumentModels, type DocumentModel } from '../services/documentModels'

export default function useDocumentModels(active: boolean) {
  const [models, setModels] = useState<DocumentModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const request = useRef<AbortController>()
  const refresh = useCallback(async () => {
    if (!active) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true); setError(false)
    try { const items = await fetchDocumentModels(controller.signal); if (!controller.signal.aborted) setModels(items) }
    catch { if (!controller.signal.aborted) setError(true) }
    finally { if (!controller.signal.aborted) setLoading(false) }
  }, [active])
  useEffect(() => {
    setModels([]); setError(false); setLoading(false)
    if (active) void refresh()
    return () => request.current?.abort()
  }, [active, refresh])
  const onSaved = (model: DocumentModel) => setModels((current) => [model, ...current.filter((item) => item.id !== model.id)])
  return { models, loading, error, refresh, onSaved }
}
