import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, FileText, Stethoscope, User, X, XCircle } from 'lucide-react'
import ActionButtons from './components/ActionButtons'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import DocumentPreviewModal from './components/DocumentPreviewModal'
import Header from './components/Header'
import Login from './components/Login'
import PatientForm from './components/PatientForm'
import SectionCard from './components/SectionCard'
import { ValidationModal } from './components/ValidationModal'
import api, { checkSession, logoutUser } from './services/api'
import type { AppFormData } from './types'
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

  const t = TRANSLATIONS[lang] || TRANSLATIONS.pt

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
      if (active) setAuthState(authenticated ? 'authenticated' : 'anonymous')
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleAuthLogout = () => setAuthState('anonymous')
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
      })

      setPreviewHtml(response.data)
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
    setFormData(getDefaultFormData())
    setAuthState('anonymous')
  }

  if (authState === 'checking') {
    return (
      <div className="app-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-garnet-500/20 border-t-garnet-500" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Validando sessão segura...</p>
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
    <div className="app-surface flex min-h-[100dvh] flex-col">
      <Header
        onLogout={handleLogout}
        layoutMode={layoutMode}
        onToggleLayout={() =>
          setLayoutMode((current) => current === 'horizontal' ? 'vertical' : 'horizontal')
        }
      />

      {message && (
        <div
          role="status"
          className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-zinc-900"
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

      <main className="app-container flex-1 py-5 sm:py-6">
        <section className="workspace-panel mb-4 sm:mb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="workspace-kicker">{t.workspaceEyebrow}</p>
              <h2 className="workspace-title">{t.workspaceTitle}</h2>
              <p className="workspace-description">{t.workspaceDescription}</p>
            </div>

            <div className="w-full max-w-sm lg:w-[320px]">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">{t.progressLabel}</span>
                <span className="tabular-nums font-bold text-garnet-500">{completion.percentage}%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div className="progress-fill" style={{ width: completion.percentage + '%' }} />
              </div>
              <p className="mt-2 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                {completion.completed}/{completion.total}
              </p>
            </div>
          </div>
        </section>

        <div
          className={
            layoutMode === 'vertical'
              ? 'mx-auto grid w-full max-w-4xl grid-cols-1 gap-4'
              : 'grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3'
          }
        >
          <SectionCard
            step="01"
            title={t.patientDataTitle}
            description={t.patientSectionHint}
            icon={User}
          >
            <PatientForm formData={formData} updateFormData={updateFormData} />
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
            <DoctorForm formData={formData} updateFormData={updateFormData} />
          </SectionCard>
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-zinc-200/90 bg-white/95 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-surface-page/95">
        <div className="app-container">
          <ActionButtons
            onGenerateHTML={handleGenerateHTML}
            onClear={handleClear}
            loading={loading}
          />
        </div>
      </footer>

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        missingFields={missingFields}
      />

      <DocumentPreviewModal
        isOpen={!!previewHtml}
        onClose={() => setPreviewHtml(null)}
        htmlContent={previewHtml || ''}
        fileName={'atestado_' + documentName + '.html'}
      />
    </div>
  )
}

export default App
