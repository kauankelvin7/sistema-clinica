import DocumentModels from './components/DocumentModels'
import useDocumentModels from './hooks/useDocumentModels'
import type { DocumentModel } from './services/documentModels'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, FileText, Stethoscope, User, X, XCircle } from 'lucide-react'
import ActionButtons from './components/ActionButtons'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import DocumentPreviewModal from './components/DocumentPreviewModal'
import DirectoryStatus from './components/DirectoryStatus'
import AppShell from './components/AppShell'
import Dialog from './components/Dialog'
import { ValidationContext } from './utils/validationContext'
import { localCalendarDate } from './utils/localDate'
import { applyAppUpdate, hasAppUpdate } from './utils/appUpdates'
import PatientsListModal from './components/PatientsListModal'
import DoctorsListModal from './components/DoctorsListModal'
import Login from './components/Login'
import PatientForm from './components/PatientForm'
import SectionCard from './components/SectionCard'
import { ValidationModal } from './components/ValidationModal'
import { useClinicDirectory } from './hooks/useClinicDirectory'
import api, { checkSession, logoutUser } from './services/api'
import { clearDirectoryCache } from './services/directoryCache'
import type { AppFormData, Medico, Paciente } from './types'
import { getSavedLanguage, Language, TRANSLATIONS } from './utils/i18n'

type AuthState = 'checking' | 'authenticated' | 'anonymous'

function getDefaultFormData(): AppFormData {
  return {
    nomePaciente: '',
    tipoDocumento: 'CPF',
    numeroDocumento: '',
    cargo: '',
    empresa: '',
    dataAtestado: localCalendarDate(),
    diasAfastamento: '',
    cid: '',
    cidNaoInformado: false,
    tipoAtestado: 'saude',
    nomeMedico: '',
    tipoRegistro: 'CRM',
    numeroRegistro: '',
    ufRegistro: 'DF',
  }
}

function App() {
  const [lang, setLang] = useState<Language>(getSavedLanguage)
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>(() => {
    try {
      return localStorage.getItem('layout_mode') === 'vertical' ? 'vertical' : 'horizontal'
    } catch {
      return 'horizontal'
    }
  })
  const initialForm = useRef(getDefaultFormData())
  const authEpoch = useRef(0)
  const generationPending = useRef(false)
  const [appUpdating, setAppUpdating] = useState(false)
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [showClear, setShowClear] = useState(false)
  const [modelDirty, setModelDirty] = useState(false)
  const [modelBusy, setModelBusy] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(hasAppUpdate)
  const [printGeneration, setPrintGeneration] = useState({ attempted: false })
  const [formData, setFormData] = useState<AppFormData>(getDefaultFormData)
  const [loading, setLoading] = useState<'word' | 'html' | false>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [directoryView, setDirectoryView] = useState<'patients' | 'doctors' | null>(null)
  const [view, setView] = useState<'homologation' | 'models'>('homologation')
  const [selectedModel, setSelectedModel] = useState<{ model: DocumentModel | null } | null>(null)
  const [modelPreviewTitle, setModelPreviewTitle] = useState<string | null>(null)
  const models = useDocumentModels(authState === 'authenticated')
  const directory = useClinicDirectory(authState === 'authenticated')
  const clearDirectory = directory.clear

  const t = TRANSLATIONS[lang] || TRANSLATIONS.pt
  const dirty = Object.keys(initialForm.current).some((key) => formData[key as keyof AppFormData] !== initialForm.current[key as keyof AppFormData])
  const c = {
    pt: { clearTitle: 'Limpar formulário?', clearText: 'Os dados deste atendimento serão descartados.', cancel: 'Cancelar', confirm: 'Limpar atendimento', update: 'Atualização disponível', updateHelp: 'Conclua ou limpe o trabalho em edição antes de atualizar.', apply: 'Atualizar agora', leave: 'Descartar alterações do modelo?', ready: 'Declaração pronta para revisão.', error: 'Não foi possível gerar a declaração. Verifique os dados e tente novamente.', checking: 'Verificando sessão...', close: 'Fechar mensagem' },
    en: { clearTitle: 'Clear form?', clearText: 'The data for this visit will be discarded.', cancel: 'Cancel', confirm: 'Clear visit', update: 'Update available', updateHelp: 'Finish or clear your work before updating.', apply: 'Update now', leave: 'Discard template changes?', ready: 'Document ready for review.', error: 'Could not generate the document. Check the data and try again.', checking: 'Checking session...', close: 'Close message' },
    es: { clearTitle: '¿Limpiar formulario?', clearText: 'Se descartarán los datos de esta atención.', cancel: 'Cancelar', confirm: 'Limpiar atención', update: 'Actualización disponible', updateHelp: 'Finalice o limpie su trabajo antes de actualizar.', apply: 'Actualizar ahora', leave: '¿Descartar cambios del modelo?', ready: 'Documento listo para revisar.', error: 'No se pudo generar el documento. Revise los datos e intente de nuevo.', checking: 'Verificando sesión...', close: 'Cerrar mensaje' },
  }[lang]
  useEffect(() => {
    const notify = () => setUpdateAvailable(true)
    window.addEventListener('app_update_available', notify)
    return () => window.removeEventListener('app_update_available', notify)
  }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || modelDirty || loading || modelBusy) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, modelDirty, loading, modelBusy])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang
  }, [lang])

  useEffect(() => {
    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<Language>
      setLang(customEvent.detail || getSavedLanguage())
    }
    window.addEventListener('language_changed', handleLangChange)
    return () => window.removeEventListener('language_changed', handleLangChange)
  }, [])

  useEffect(() => {
    let active = true
    checkSession().then((authenticated) => {
      if (!active) return
      setAuthState(authenticated ? 'authenticated' : 'anonymous')
      if (!authenticated) void clearDirectoryCache()
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleAuthLogout = () => {
      authEpoch.current++
      generationPending.current = false
      setLoading(false)
      setFormData(getDefaultFormData())
      initialForm.current = getDefaultFormData()
      setMessage(null)
      setShowClear(false)
      setShowValidationModal(false)
      setValidationAttempted(false)
      setModelDirty(false)
      setModelBusy(false)
      void clearDirectory()
      setDirectoryView(null)
      setView('homologation')
      setSelectedModel(null)
      setModelPreviewTitle(null)
      setPreviewHtml(null)
      setAuthState('anonymous')
    }
    window.addEventListener('auth_logout', handleAuthLogout)
    return () => window.removeEventListener('auth_logout', handleAuthLogout)
  }, [clearDirectory])

  useEffect(() => {
    try {
      localStorage.setItem('layout_mode', layoutMode)
    } catch {
      // Preferência visual não precisa bloquear o uso do sistema.
    }
  }, [layoutMode])

  const completion = useMemo(() => {
    const checks = [
      formData.nomePaciente.trim(),
      formData.numeroDocumento.trim(),
      formData.cargo.trim(),
      formData.empresa.trim(),
      formData.dataAtestado,
      Number(formData.diasAfastamento) > 0,
      formData.cidNaoInformado || formData.cid.trim(),
      formData.nomeMedico.trim(),
      formData.numeroRegistro.trim(),
      formData.ufRegistro.trim(),
    ]
    const completed = checks.filter(Boolean).length
    return {
      completed,
      total: checks.length,
      percentage: Math.round((completed / checks.length) * 100),
    }
  }, [formData])

  const updateFormData = (field: keyof AppFormData, value: string | boolean) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setMessage(null)
  }

  const selectPatient = (patient: Paciente) => {
    updateFormData('nomePaciente', patient.nome_completo)
    updateFormData('tipoDocumento', patient.tipo_doc)
    updateFormData('numeroDocumento', patient.numero_doc)
    updateFormData('cargo', patient.cargo || '')
    updateFormData('empresa', patient.empresa || '')
  }

  const selectDoctor = (doctor: Medico) => {
    updateFormData('nomeMedico', doctor.nome_completo)
    updateFormData('tipoRegistro', doctor.tipo_crm)
    updateFormData('numeroRegistro', doctor.crm)
    updateFormData('ufRegistro', doctor.uf_crm)
  }

  const openModels = (model: DocumentModel | null = null) => {
    if (modelDirty && view === 'homologation' && !model) { setView('models'); return }
    if (modelBusy || (modelDirty && !window.confirm(c.leave))) return
    setModelDirty(false)
    setMessage(null)
    setSelectedModel({ model })
    setView('models')
    requestAnimationFrame(() => document.getElementById('clinic-workspace')?.focus())
  }

  const validateFormData = (): string[] => {
    const missing: string[] = []
    if (!formData.nomePaciente.trim()) missing.push(t.patientNameLabel)
    if (!formData.numeroDocumento.trim()) missing.push(t.docNumberLabel)
    if (!formData.cargo.trim()) missing.push(t.positionLabel)
    if (!formData.empresa.trim()) missing.push(t.companyLabel)
    if (!formData.dataAtestado) missing.push(t.certificateDateLabel)
    if (!formData.diasAfastamento || parseInt(formData.diasAfastamento, 10) <= 0) {
      missing.push(t.leaveDaysLabel)
    }
    if (!formData.cidNaoInformado && !formData.cid.trim()) missing.push(t.cidLabel)
    if (!formData.nomeMedico.trim()) missing.push(t.doctorNameLabel)
    if (!formData.numeroRegistro.trim()) missing.push(t.regNumberLabel)
    if (!formData.ufRegistro.trim()) missing.push(t.regUfLabel)
    return missing
  }

  const handleGenerateHTML = async () => {
    if (generationPending.current) return
    setValidationAttempted(true)
    const missing = validateFormData()
    if (missing.length > 0) {
      setMissingFields(missing)
      setShowValidationModal(true)
      return
    }

    generationPending.current = true
    const operationEpoch = authEpoch.current
    setLoading('html')
    setMessage(null)

    try {
      const response = await api.post('/api/generate-html', {
        paciente: {
          nome: formData.nomePaciente,
          tipo_documento: formData.tipoDocumento,
          numero_documento: formData.numeroDocumento,
          cargo: formData.cargo,
          empresa: formData.empresa,
        },
        atestado: {
          data_atestado: formData.dataAtestado,
          dias_afastamento: parseInt(formData.diasAfastamento, 10) || 0,
          cid: formData.cid,
          cid_nao_informado: formData.cidNaoInformado,
          tipo_atestado: formData.tipoAtestado,
        },
        medico: {
          nome: formData.nomeMedico,
          tipo_registro: formData.tipoRegistro,
          numero_registro: formData.numeroRegistro,
          uf_registro: formData.ufRegistro,
        },
      }, { timeout: 20000 })

      if (operationEpoch !== authEpoch.current) return
      setPrintGeneration({ attempted: false })
      setModelPreviewTitle(null)
      setPreviewHtml(response.data)
      directory.rememberForm(formData)
      setMessage({ type: 'success', text: c.ready })
    } catch {
      if (operationEpoch !== authEpoch.current) return
      setMessage({
        type: 'error',
        text: c.error,
      })
    } finally {
      if (operationEpoch === authEpoch.current) { setLoading(false); generationPending.current = false }
    }
  }

  const handleClear = (confirmed = false) => {
    if (dirty && !confirmed) { setShowClear(true); return }
    initialForm.current = getDefaultFormData()
    setFormData(initialForm.current)
    setShowClear(false)
    setValidationAttempted(false)
    setPreviewHtml(null)
    setMessage({ type: 'success', text: t.msgFormCleared })
  }

  const handleLogout = async () => {
    const operationEpoch = ++authEpoch.current
    generationPending.current = false
    setLoading(false)
    setModelDirty(false)
    setModelBusy(false)
    initialForm.current = getDefaultFormData()
    setFormData(initialForm.current)
    setMessage(null)
    setShowClear(false)
    setShowValidationModal(false)
    setValidationAttempted(false)
    setDirectoryView(null)
    setView('homologation')
    setSelectedModel(null)
    setModelPreviewTitle(null)
    setPreviewHtml(null)
    setAuthState('checking')
    await Promise.all([logoutUser(), directory.clear()])
    if (operationEpoch === authEpoch.current) setAuthState('anonymous')
  }

  if (authState === 'checking' || appUpdating) {
    return (
      <div className="app-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-garnet-500/20 border-t-garnet-500" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{c.checking}</p>
        </div>
      </div>
    )
  }

  if (authState === 'anonymous') {
    return <Login onLoginSuccess={() => setAuthState('authenticated')} />
  }

  const documentName =
    formData.nomePaciente
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'documento'

  return (
    <AppShell
      onLogout={handleLogout}
      layoutMode={layoutMode}
      onToggleLayout={() => setLayoutMode((current) => current === 'horizontal' ? 'vertical' : 'horizontal')}
      onOpenPatients={() => setDirectoryView('patients')}
      onOpenDoctors={() => setDirectoryView('doctors')}
      view={view}
      onOpenModels={() => openModels()}
      onHomologation={() => { if (!modelBusy) setView('homologation') }}
    >
      {updateAvailable && <div className="update-banner" role="status"><div><strong>{c.update}</strong>{(dirty || modelDirty || loading || modelBusy || previewHtml || directoryView) && <p>{c.updateHelp}</p>}</div><button className="btn-secondary" disabled={dirty || modelDirty || !!loading || modelBusy || !!previewHtml || !!directoryView || showClear || showValidationModal} onClick={() => { setAppUpdating(true); applyAppUpdate() }}>{c.apply}</button></div>}
      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className="clinic-toast"
        >
          {message.type === 'success' ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          )}
          <p className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{message.text}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="rounded-md p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
            aria-label={c.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main id="clinic-workspace" tabIndex={-1} className="app-container clinic-main">
        <div hidden={view !== 'homologation'}>
        <section className="clinic-hero" aria-label={t.workspaceTitle}>

            <div className="clinic-hero-copy">
              <h2 className="workspace-title">{t.workspaceTitle}</h2>
              <p className="workspace-description">{t.workspaceDescription}</p>
            </div>

            <div className="clinic-status-panel">
              <DirectoryStatus
                status={directory.status}
                cachedAt={directory.cachedAt}
                patientCount={directory.patients.length}
                doctorCount={directory.doctors.length}
                pendingCount={directory.pendingCount}
                onRefresh={() => void directory.refresh()}
              />
              <div>
              <div className="clinic-progress-label">
                <span className="font-semibold">{t.progressLabel}</span>
                <span className="tabular-nums font-bold">{completion.percentage}%</span>
              </div>
              <div className="progress-track" role="progressbar" aria-label={t.progressLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage}>
                <div className="progress-fill" style={{ width: completion.percentage + '%' }} />
              </div>
              <p className="clinic-progress-count">
                {completion.completed}/{completion.total}
              </p>
              </div>
            </div>
        </section>

        <details className="model-shortcuts"><summary>{t.modelsShortcuts}</summary><section aria-label={t.modelsShortcuts}>
          <div className="model-shortcuts-header"><h2>{t.modelsShortcuts}</h2><button type="button" className="btn-secondary" onClick={() => openModels()}>{t.modelsAll}</button></div>
          {models.error && <p role="status" className="text-sm text-muted">{t.modelsLoadError}</p>}
          <div className="model-shortcuts-list">{models.models.slice(0, 6).map((model) => <button key={model.id} type="button" className="btn-secondary" onClick={() => openModels(model)}>{model.name}</button>)}
          {!models.loading && !models.error && models.models.length === 0 && <button type="button" className="btn-secondary" onClick={() => openModels()}>{t.modelsCreate}</button>}</div>
        </section></details>

        <ValidationContext.Provider value={new Set(validationAttempted ? [['nomePaciente','patient-name'],['numeroDocumento','patient-document'],['cargo','patient-position'],['empresa','patient-company'],['dataAtestado','certificate-date'],['diasAfastamento','certificate-days'],['cid','certificate-cid'],['nomeMedico','doctor-name'],['numeroRegistro','doctor-register-number'],['ufRegistro','doctor-register-state']].filter(([key]) => key === 'cid' ? !formData.cidNaoInformado && !formData.cid.trim() : key === 'diasAfastamento' ? !(Number(formData.diasAfastamento) > 0) : !String(formData[key as keyof AppFormData]).trim()).map(([, id]) => id) : [])}>
        <div
          className={
            layoutMode === 'vertical'
              ? 'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4'
              : 'workspace-grid'
          }
        >
          <SectionCard
            step="01"
            title={t.patientDataTitle}
            description={t.patientSectionHint}
            icon={User}
          >
            <PatientForm formData={formData} updateFormData={updateFormData} patients={directory.patients} onLoadPatient={selectPatient} />
          </SectionCard>

          <SectionCard
            step="02"
            title={t.certificateDataTitle}
            description={t.certificateSectionHint}
            icon={FileText}
          >
            <CertificateForm formData={formData} updateFormData={updateFormData} />
          </SectionCard>

          <SectionCard
            step="03"
            title={t.doctorDataTitle}
            description={t.doctorSectionHint}
            icon={Stethoscope}
          >
            <DoctorForm formData={formData} updateFormData={updateFormData} doctors={directory.doctors} onLoadDoctor={selectDoctor} />
          </SectionCard>
        </div>
        </ValidationContext.Provider>
        </div>
        <div hidden={view !== 'models'}><DocumentModels onDirtyChange={setModelDirty} onBusyChange={setModelBusy} models={models.models} loading={models.loading} error={models.error} selected={selectedModel} onRefresh={() => void models.refresh()} onSaved={models.onSaved} onPreview={(html, title) => { setPrintGeneration({ attempted: false }); setModelPreviewTitle(title); setPreviewHtml(html) }} /></div>
      </main>

      <footer hidden={view !== 'homologation'} className="clinic-footer">
        <div className="app-container">
          <ActionButtons
            onGenerateHTML={handleGenerateHTML}
            onClear={() => handleClear()}
            loading={loading}
          />
        </div>
      </footer>

      <PatientsListModal isOpen={directoryView === 'patients'} onClose={() => setDirectoryView(null)} onSelect={selectPatient} patients={directory.patients} />
      <DoctorsListModal isOpen={directoryView === 'doctors'} onClose={() => setDirectoryView(null)} onSelect={selectDoctor} doctors={directory.doctors} />

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false)
          const fields = [ ['nomePaciente', 'patient-name'], ['numeroDocumento', 'patient-document'], ['cargo', 'patient-position'], ['empresa', 'patient-company'], ['dataAtestado', 'certificate-date'], ['diasAfastamento', 'certificate-days'], ['cid', 'certificate-cid'], ['nomeMedico', 'doctor-name'], ['numeroRegistro', 'doctor-register-number'], ['ufRegistro', 'doctor-register-state'] ]
          const first = fields.find(([key]) => key === 'cid' ? !formData.cidNaoInformado && !formData.cid.trim() : key === 'diasAfastamento' ? !(Number(formData.diasAfastamento) > 0) : !String(formData[key as keyof AppFormData]).trim())
          requestAnimationFrame(() => { if (first) document.getElementById(first[1])?.focus() })
        }}
        missingFields={missingFields}
      />

      <Dialog isOpen={showClear} onClose={() => setShowClear(false)} label={c.clearTitle}><section className="confirm-panel"><h2>{c.clearTitle}</h2><p>{c.clearText}</p><div><button data-dialog-focus className="btn-secondary" onClick={() => setShowClear(false)}>{c.cancel}</button><button className="btn-primary" onClick={() => handleClear(true)}>{c.confirm}</button></div></section></Dialog>
      <DocumentPreviewModal
        generation={printGeneration}
        isOpen={!!previewHtml}
        onClose={() => setPreviewHtml(null)}
        htmlContent={previewHtml || ''}
        fileName={modelPreviewTitle ? modelPreviewTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120) + '.html' : 'atestado_' + documentName + '.html'}
      />
    </AppShell>
  )
}

export default App
