import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, FilePlus2, FileText, Loader2, Pencil, Plus, RefreshCw, Save } from 'lucide-react'
import axios from 'axios'
import { generateModelDocument, modelFieldKeys, saveDocumentModel, type DocumentModel } from '../services/documentModels'
import { maskCPF } from '../utils/maskCPF'
import { useTranslation } from '../utils/i18n'
import Field from './Field'
import './DocumentModels.css'

const COPY = {
  pt: {
      title: 'Modelos de documentos',
      intro: 'Escreva uma vez, preencha os campos e emita quando precisar.',
      new: 'Novo modelo',
      edit: 'Editar',
      fill: 'Preencher e emitir',
      back: 'Voltar aos modelos',
      empty: 'Você ainda não criou modelos.',
      retry: 'Tentar novamente',
      refresh: 'Atualizar lista',
      unavailable: 'Não foi possível carregar os modelos.',
      loading: 'Carregando modelos...',
      modelName: 'Nome do modelo',
      documentTitle: 'Título do documento',
      body: 'Texto do modelo',
      help: 'Use {{nome}}, {{cpf}} ou outro nome entre chaves duplas para criar campos. CPF recebe máscara; os demais campos são texto livre.',
      add: 'Adicionar campo',
      field: 'Nome do campo',
      labels: 'Campos do modelo',
      save: 'Salvar modelo',
      emit: 'Emitir documento',
      required: 'Preencha todos os campos. CPF deve ter 11 dígitos.',
      invalid: 'Revise os marcadores: use letras minúsculas, números e _. Limite de 30 campos.',
      failure: 'Não foi possível concluir. Seus dados foram mantidos.',
      conflict: 'O modelo mudou em outra sessão. Seus dados foram mantidos. Volte à lista e atualize antes de continuar.',
      static: 'Este modelo não tem campos para preencher.',
      saving: 'Salvando...',
      emitting: 'Gerando documento...',
  },
  en: {
      title: 'Document templates',
      intro: 'Write once, fill the fields and issue when needed.',
      new: 'New template',
      edit: 'Edit',
      fill: 'Fill and issue',
      back: 'Back to templates',
      empty: 'You have no templates yet.',
      retry: 'Try again',
      refresh: 'Refresh list',
      unavailable: 'Could not load templates.',
      loading: 'Loading templates...',
      modelName: 'Template name',
      documentTitle: 'Document title',
      body: 'Template text',
      help: 'Use {{nome}}, {{cpf}} or another name in double braces to create fields. CPF is formatted; other fields are free text.',
      add: 'Add field',
      field: 'Field name',
      labels: 'Template fields',
      save: 'Save template',
      emit: 'Issue document',
      required: 'Fill every field. CPF needs 11 digits.',
      invalid: 'Check placeholders: use lowercase letters, numbers and _. Limit: 30 fields.',
      failure: 'Could not complete. Your data was kept.',
      conflict: 'This template changed in another session. Your data was kept. Return to the list and refresh before continuing.',
      static: 'This template has no fields to fill.',
      saving: 'Saving...',
      emitting: 'Generating document...',
  },
  es: {
      title: 'Modelos de documentos',
      intro: 'Escriba una vez, complete los campos y emita cuando lo necesite.',
      new: 'Nuevo modelo',
      edit: 'Editar',
      fill: 'Completar y emitir',
      back: 'Volver a los modelos',
      empty: 'Todavía no creó modelos.',
      retry: 'Intentar de nuevo',
      refresh: 'Actualizar lista',
      unavailable: 'No se pudieron cargar los modelos.',
      loading: 'Cargando modelos...',
      modelName: 'Nombre del modelo',
      documentTitle: 'Título del documento',
      body: 'Texto del modelo',
      help: 'Use {{nome}}, {{cpf}} u otro nombre entre llaves dobles para crear campos. CPF recibe formato; los demás son texto libre.',
      add: 'Añadir campo',
      field: 'Nombre del campo',
      labels: 'Campos del modelo',
      save: 'Guardar modelo',
      emit: 'Emitir documento',
      required: 'Complete todos los campos. CPF necesita 11 dígitos.',
      invalid: 'Revise los marcadores: letras minúsculas, números y _. Límite: 30 campos.',
      failure: 'No se pudo completar. Sus datos se conservaron.',
      conflict: 'El modelo cambió en otra sesión. Sus datos se conservaron. Vuelva a la lista y actualice antes de continuar.',
      static: 'Este modelo no tiene campos para completar.',
      saving: 'Guardando...',
      emitting: 'Generando documento...',
  },
} as const

interface Props {
  models: DocumentModel[]
  loading: boolean
  error: boolean
  selected: { model: DocumentModel | null } | null
  onRefresh: () => void
  onSaved: (model: DocumentModel) => void
  onPreview: (html: string, title: string) => void
}

export default function DocumentModels({ models, loading, error, selected, onRefresh, onSaved, onPreview }: Props) {
  const { lang } = useTranslation()
  const c = COPY[lang]
  const [mode, setMode] = useState<'list' | 'edit' | 'fill'>('list')
  const [current, setCurrent] = useState<DocumentModel | undefined>()
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldName, setFieldName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const textRef = useRef<HTMLTextAreaElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const keys = useMemo(() => modelFieldKeys(body), [body])

  useEffect(() => {
    if (selected?.model) { setCurrent(selected.model); setValues({}); setMode('fill'); setMessage('') }
    else { setMode('list'); setMessage('') }
  }, [selected])
  useEffect(() => { headingRef.current?.focus() }, [mode])

  const edit = (model?: DocumentModel) => {
    setCurrent(model); setName(model?.name || model?.title || ''); setTitle(model?.title || ''); setBody(model?.body || '')
    setLabels(Object.fromEntries((model?.fields || []).map((field) => [field.key, field.label])))
    setMessage(''); setMode('edit')
  }
  const fill = (model: DocumentModel) => { setCurrent(model); setValues({}); setMessage(''); setMode('fill') }
  const fail = (error: unknown) => setMessage(axios.isAxiosError(error) && error.response?.status === 409 ? c.conflict : c.failure)
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const remainder = body.replace(/\{\{([a-z][a-z0-9_]{0,39})\}\}/g, '')
    if (remainder.includes('{{') || remainder.includes('}}') || keys.length > 30) { setMessage(c.invalid); return }
    setBusy(true); setMessage('')
    try {
      const model = await saveDocumentModel({ name, title, body, fields: keys.map((key) => ({ key, label: labels[key]?.trim() || (key === 'cpf' ? 'CPF' : key.replace(/_/g, ' ')) })) }, current)
      if (!mounted.current) return
      onSaved(model); setCurrent(model); setMode('list')
    } catch (error) { fail(error) }
    finally { setBusy(false) }
  }
  const emit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!current) return
    if (current.fields.some(({ key }) => !values[key]?.trim() || (key === 'cpf' && values[key].replace(/\D/g, '').length !== 11))) { setMessage(c.required); return }
    setBusy(true); setMessage('')
    try { const html = await generateModelDocument(current, values); if (mounted.current) onPreview(html, current.title) }
    catch (error) { fail(error) }
    finally { setBusy(false) }
  }
  const insert = () => {
    const key = fieldName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '_')
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key)) { setMessage(c.invalid); return }
    const control = textRef.current
    const start = control?.selectionStart ?? body.length
    const end = control?.selectionEnd ?? start
    setBody(body.slice(0, start) + `{{${key}}}` + body.slice(end))
    setLabels((previous) => ({ ...previous, [key]: fieldName.trim() }))
    setFieldName(''); setMessage('')
    requestAnimationFrame(() => { control?.focus(); control?.setSelectionRange(start + key.length + 4, start + key.length + 4) })
  }

  return (
    <section className="models-page" aria-label={c.title}>
      <header className="models-heading">
        <div><h2 ref={headingRef} tabIndex={-1}>{mode === 'fill' ? current?.name : c.title}</h2><p>{c.intro}</p></div>
        {mode === 'list'
          ? <div className="models-card-actions"><button className="btn-secondary" type="button" onClick={onRefresh} disabled={loading}><RefreshCw className="h-4 w-4" aria-hidden="true" />{c.refresh}</button><button className="btn-primary" type="button" onClick={() => edit()}><FilePlus2 className="h-4 w-4" aria-hidden="true" />{c.new}</button></div>
          : <button className="btn-secondary" type="button" disabled={busy} onClick={() => { setMode('list'); setMessage('') }}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{c.back}</button>}
      </header>
      {message && <p role="alert" className="models-error">{message}</p>}
      {mode === 'list' && <>
        {loading && <p role="status" className="models-status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{c.loading}</p>}
        {error && <div role="alert" className="models-error">{c.unavailable} <button type="button" className="btn-secondary" onClick={onRefresh}><RefreshCw className="h-4 w-4" aria-hidden="true" />{c.retry}</button></div>}
        {!loading && !error && models.length === 0 && <div className="models-empty"><FileText className="h-8 w-8" aria-hidden="true" /><p>{c.empty}</p></div>}
        <div className="models-grid">{models.map((model) => <article key={model.id} className="models-card">
          <FileText className="h-5 w-5 text-brand-foreground" aria-hidden="true" /><h3>{model.name}</h3><p className="models-document-title">{model.title}</p><p className="models-excerpt">{model.body}</p>
          <div className="models-card-actions"><button type="button" className="btn-primary" onClick={() => fill(model)}>{c.fill}</button><button type="button" className="btn-secondary" onClick={() => edit(model)}><Pencil className="h-4 w-4" aria-hidden="true" />{c.edit}</button></div>
        </article>)}</div>
      </>}
      {mode === 'edit' && <form onSubmit={save} className="models-editor" aria-busy={busy}>
        <fieldset disabled={busy} className="models-fields">
          <Field id="model-name" label={c.modelName}><input id="model-name" required maxLength={120} className="input-field" value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field id="model-title" label={c.documentTitle}><input id="model-title" required maxLength={120} className="input-field" value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field id="model-body" label={c.body} hint={c.help}><textarea ref={textRef} id="model-body" required maxLength={20000} rows={12} className="input-field models-textarea" value={body} onChange={(event) => setBody(event.target.value)} /></Field>
          <div className="models-insert"><Field id="model-field-name" label={c.field}><input id="model-field-name" maxLength={40} className="input-field" value={fieldName} onChange={(event) => setFieldName(event.target.value)} placeholder="nome, cpf, cargo" /></Field><button type="button" className="btn-secondary" onClick={insert} disabled={!fieldName.trim()}><Plus className="h-4 w-4" aria-hidden="true" />{c.add}</button></div>
          {keys.length > 0 && <div className="models-field-labels"><h3>{c.labels}</h3>{keys.map((key) => <Field key={key} id={`model-label-${key}`} label={`{{${key}}}`}><input id={`model-label-${key}`} className="input-field" maxLength={80} value={labels[key] ?? (key === 'cpf' ? 'CPF' : key.replace(/_/g, ' '))} onChange={(event) => setLabels((previous) => ({ ...previous, [key]: event.target.value }))} /></Field>)}</div>}
        </fieldset>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{busy ? c.saving : c.save}</button>
      </form>}
      {mode === 'fill' && current && <form onSubmit={emit} className="models-editor" aria-busy={busy}>
        <div className="models-text-preview">{current.body}</div>
        <fieldset disabled={busy} className="models-fields">
          {current.fields.length === 0 && <p className="text-muted">{c.static}</p>}
          {current.fields.map((field) => <Field key={field.key} id={`model-value-${field.key}`} label={field.label}><input id={`model-value-${field.key}`} required maxLength={field.key === 'cpf' ? 14 : 2000} inputMode={field.key === 'cpf' ? 'numeric' : 'text'} className="input-field" value={values[field.key] || ''} onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: field.key === 'cpf' ? maskCPF(event.target.value) : event.target.value }))} /></Field>)}
        </fieldset>
        <button type="submit" className="btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? c.emitting : c.emit}</button>
      </form>}
    </section>
  )
}
