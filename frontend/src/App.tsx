import DocumentModels from './components/DocumentModels'
import useDocumentModels from './hooks/useDocumentModels'
import type { DocumentModel } from './services/documentModels'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, FileText, Stethoscope, User, X, XCircle } from 'lucide-react'
import ActionButtons from './components/ActionButtons'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import DocumentPreviewModal from './components/DocumentPreviewModal'
import DirectoryStatus from './components/DirectoryStatus'
import AppShell from './components/AppShell'
import ClinicalArtwork from './components/ClinicalArtwork'
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
    dataAtestado: new Date().toISOString().split('T')[0],
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

  const t = TRANSLATIONS[lang] || TRANSLATIONS.pt

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
      void clearDirectoryCache()
      setDirectoryView(null)
      setView('homologation')
      setSelectedModel(null)
      setModelPreviewTitle(null)
      setPreviewHtml(null)
      setAuthState('anonymous')
    }
    window.addEventListener('auth_logout', handleAuthLogout)
    return () => window.removeEventListener('auth_logout', handleAuthLogout)
  }, [])

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
    setMessage(null)
    setSelectedModel({ model })
    setView('models')
    requestAnimationFrame(() => document.getElementById('clinic-workspace')?.focus())
  }

  const validateFormData = (): string[] => {
    const missing: string[] = []
    if (!formData.nomePaciente.trim()) missing.push('Nome do Paciente')
    if (!formData.numeroDocumento.trim()) missing.push('Número do Documento do Paciente')
    if (!formData.cargo.trim()) missing.push('Cargo do Paciente')
    if (!formData.empresa.trim()) missing.push('Empresa do Paciente')
    if (!formData.dataAtestado) missing.push('Data do Atestado')
    if (!formData.diasAfastamento || parseInt(formData.diasAfastamento, 10) <= 0) {
      missing.push('Dias de Afastamento')
    }
    if (!formData.cidNaoInformado && !formData.cid.trim()) missing.push('Código CID')
    if (!formData.nomeMedico.trim()) missing.push('Nome do Médico')
    if (!formData.numeroRegistro.trim()) missing.push('Número de Registro do Médico')
    if (!formData.ufRegistro.trim()) missing.push('UF do Registro do Médico')
    return missing
  }

  const handleGenerateHTML = async () => {
    const missing = validateFormData()
    if (missing.length > 0) {
      setMissingFields(missing)
      setShowValidationModal(true)
      return
    }

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

      setModelPreviewTitle(null)
      setPreviewHtml(response.data)
      directory.rememberForm(formData)
      setMessage({ type: 'success', text: 'Declaração pronta para revisão.' })
    } catch {
      setMessage({
        type: 'error',
        text: 'Não foi possível gerar a declaração. Verifique os dados e tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFormData(getDefaultFormData())
    setPreviewHtml(null)
    setMessage({ type: 'success', text: 'Formulário limpo. Pronto para um novo atendimento.' })
  }

  const handleLogout = async () => {
    await logoutUser()
    await directory.clear()
    setFormData(getDefaultFormData())
    setDirectoryView(null)
    setView('homologation')
    setSelectedModel(null)
    setModelPreviewTitle(null)
    setPreviewHtml(null)
    setAuthState('anonymous')
  }

  if (authState === 'checking') {
    return (
      <div className="app-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-garnet-500/20 border-t-garnet-500" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Verificando sessão...</p>
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
      onHomologation={() => setView('homologation')}
    >
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
            aria-label="Fechar mensagem"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <main id="clinic-workspace" tabIndex={-1} className="app-container clinic-main">
        <div hidden={view !== 'homologation'}>
        <section className="clinic-hero" aria-label={t.workspaceTitle}>
            <ClinicalArtwork className="clinic-hero-art" />
            <div className="clinic-hero-copy">
              <p className="workspace-kicker">{t.workspaceEyebrow}</p>
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

        <section className="model-shortcuts" aria-label={t.modelsShortcuts}>
          <div className="model-shortcuts-header"><h2>{t.modelsShortcuts}</h2><button type="button" className="btn-secondary" onClick={() => openModels()}>{t.modelsAll}</button></div>
          {models.error && <p role="status" className="text-sm text-muted">{t.modelsLoadError}</p>}
          <div className="model-shortcuts-list">{models.models.slice(0, 6).map((model) => <button key={model.id} type="button" className="btn-secondary" onClick={() => openModels(model)}>{model.title}</button>)}
          {!models.loading && !models.error && models.models.length === 0 && <button type="button" className="btn-secondary" onClick={() => openModels()}>{t.modelsCreate}</button>}</div>
        </section>

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
        </div>
        <div hidden={view !== 'models'}><DocumentModels models={models.models} loading={models.loading} error={models.error} selected={selectedModel} onRefresh={() => void models.refresh()} onSaved={models.onSaved} onPreview={(html, title) => { setModelPreviewTitle(title); setPreviewHtml(html) }} /></div>
      </main>

      <footer hidden={view !== 'homologation'} className="clinic-footer">
        <div className="app-container">
          <ActionButtons
            onGenerateHTML={handleGenerateHTML}
            onClear={handleClear}
            loading={loading}
          />
        </div>
      </footer>

      <PatientsListModal isOpen={directoryView === 'patients'} onClose={() => setDirectoryView(null)} onSelect={selectPatient} patients={directory.patients} />
      <DoctorsListModal isOpen={directoryView === 'doctors'} onClose={() => setDirectoryView(null)} onSelect={selectDoctor} doctors={directory.doctors} />

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        missingFields={missingFields}
      />

      <DocumentPreviewModal
        isOpen={!!previewHtml}
        onClose={() => setPreviewHtml(null)}
        htmlContent={previewHtml || ''}
        fileName={modelPreviewTitle ? modelPreviewTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 120) + '.html' : 'atestado_' + documentName + '.html'}
      />
    </AppShell>
  )
}

export default App
