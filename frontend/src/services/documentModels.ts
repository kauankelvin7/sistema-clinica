import api from './api'

export interface DocumentModel {
  id: string
  name: string
  title: string
  body: string
  fields: Array<{ key: string; label: string }>
  revision: number
  updated_at: string
}
export type ModelDraft = Pick<DocumentModel, 'name' | 'title' | 'body' | 'fields'>

export const fetchDocumentModels = async (signal?: AbortSignal): Promise<DocumentModel[]> => (await api.get('/api/document-models', { signal })).data
export const saveDocumentModel = async (draft: ModelDraft, current?: DocumentModel): Promise<DocumentModel> => (
  await api.post(current ? `/api/document-models/${current.id}` : '/api/document-models',
    current ? { ...draft, revision: current.revision } : draft)
).data
export const generateModelDocument = async (model: DocumentModel, values: Record<string, string>): Promise<string> => (
  await api.post(`/api/document-models/${model.id}/generate`, { revision: model.revision, values }, { timeout: 20000 })
).data

export function modelFieldKeys(body: string): string[] {
  return [...new Set([...body.matchAll(/\{\{([a-z][a-z0-9_]{0,39})\}\}/g)].map((match) => match[1]))]
}
