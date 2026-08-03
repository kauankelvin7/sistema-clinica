import { useState, useEffect } from 'react'
import { FileText, User, Stethoscope, CheckCircle, XCircle, Smartphone, Monitor } from 'lucide-react'
import Header from './components/Header'
import PatientForm from './components/PatientForm'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import ActionButtons from './components/ActionButtons'
import { ValidationModal } from './components/ValidationModal'
import Login from './components/Login'
import api from './services/api'
import type { AppFormData } from './types'

function App() {
  // Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('auth_token'))

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('auth_token', token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    setIsAuthenticated(false)
  }

  // Ouvir evento global de deslogue (disparado pelo interceptor em caso de 401)
  useEffect(() => {
    const handleAuthLogout = () => {
      setIsAuthenticated(false)
    }
    window.addEventListener('auth_logout', handleAuthLogout)
    return () => {
      window.removeEventListener('auth_logout', handleAuthLogout)
    }
  }, [])

  // --- 1. LÓGICA DE NEGÓCIO INTACTA ---

  // Estado do layout (vertical = horizontal)
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>(() => {
    const saved = localStorage.getItem('layout_mode')
    return (saved as 'vertical' | 'horizontal') || 'horizontal'
  })

  // Salvar preferência de layout
  useEffect(() => {
    localStorage.setItem('layout_mode', layoutMode)
  }, [layoutMode])

  const getDefaultFormData = (): AppFormData => ({
    // Paciente
    nomePaciente: '',
    tipoDocumento: 'CPF',
    numeroDocumento: '',
    cargo: '',
    empresa: '',

    // Atestado
    dataAtestado: new Date().toISOString().split('T')[0],
    diasAfastamento: '',
    cid: '',
    cidNaoInformado: false,
    tipoAtestado: 'saude',

    // Médico
    nomeMedico: '',
    tipoRegistro: 'CRM',
    numeroRegistro: '',
    ufRegistro: 'DF',
  })

  // Carregar dados salvos do localStorage
  const loadSavedData = (): AppFormData => {
    const saved = localStorage.getItem('sistema_clinica_data')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return getDefaultFormData()
      }
    }
    return getDefaultFormData()
  }

  const [formData, setFormData] = useState<AppFormData>(loadSavedData())
  const [loading, setLoading] = useState<'word' | 'html' | false>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  // Salvar dados automaticamente quando mudar
  useEffect(() => {
    localStorage.setItem('sistema_clinica_data', JSON.stringify(formData))
  }, [formData])

  const updateFormData = (field: keyof AppFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage(null) // Limpar mensagem ao editar
  }

  // Função de validação completa
  const validateFormData = (): string[] => {
    const missing: string[] = []

    // Validar Paciente
    if (!formData.nomePaciente.trim()) missing.push('Nome do Paciente')
    if (!formData.numeroDocumento.trim()) missing.push('Número do Documento do Paciente')
    if (!formData.cargo.trim()) missing.push('Cargo do Paciente')
    if (!formData.empresa.trim()) missing.push('Empresa do Paciente')

    // Validar Atestado
    if (!formData.dataAtestado) missing.push('Data do Atestado')
    if (formData.tipoAtestado !== 'fisico') {
      if (!formData.diasAfastamento || parseInt(formData.diasAfastamento) <= 0) missing.push('Dias de Afastamento')
      if (!formData.cidNaoInformado && !formData.cid.trim()) missing.push('Código CID')
    }

    // Validar Médico
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
          dias_afastamento: formData.tipoAtestado === 'fisico' ? 0 : (parseInt(formData.diasAfastamento) || 0),
          cid: formData.tipoAtestado === 'fisico' ? "" : formData.cid,
          cid_nao_informado: formData.tipoAtestado === 'fisico' ? true : formData.cidNaoInformado,
          tipo_atestado: formData.tipoAtestado,
        },
        medico: {
          nome: formData.nomeMedico,
          tipo_registro: formData.tipoRegistro,
          numero_registro: formData.numeroRegistro,
          uf_registro: formData.ufRegistro,
        },
      })

      const htmlContent = response.data
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Documento gerado com sucesso!' })
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      setMessage({ type: 'error', text: 'Não foi possível gerar o documento. Por favor, tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    const defaultData = getDefaultFormData()
    setFormData(defaultData)
    localStorage.removeItem('sistema_clinica_data')
    setMessage({ type: 'success', text: 'Todos os campos foram limpos com sucesso!' })
  }

  // --- 2. NOVO DESIGN SYSTEM E SEMÂNTICA ---
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="relative h-[100dvh] flex flex-col bg-zinc-50 dark:bg-surface-page overflow-hidden font-sans transition-colors duration-300">

      {/* Marca d'água de Plano de Fundo (NOVA Logo PNG sem fundo) */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden p-6">
        <img
          src="/logo_light.png"
          alt="NOVA Logo"
          className="w-[85vw] max-w-[720px] object-contain opacity-[0.08] dark:hidden transition-opacity duration-300"
        />
        <img
          src="/logo_dark.png"
          alt="NOVA Logo"
          className="w-[85vw] max-w-[720px] object-contain opacity-[0.10] hidden dark:block transition-opacity duration-300"
        />
      </div>

      {/* Header Fixo no Topo */}
      <Header onLogout={handleLogout} />

      {/* Mensagem de Status flutuante (Toast) */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-md border text-xs sm:text-sm font-medium
          ${message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}
        `}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Conteúdo Principal com Scroll Próprio */}
      <main className="relative z-10 flex-1 overflow-y-auto px-[clamp(12px,2vw,32px)] py-[clamp(8px,1.5vh,20px)] space-y-4 max-w-[1800px] mx-auto w-full">

        {/* Sub-header com preferência de layout opcional */}
        <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <span>Sistema de Homologação • Atestados Digitais</span>
          <button
            onClick={() => setLayoutMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-card border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-orange-500/30 transition-all text-xs"
            title="Alternar preferência de exibição"
          >
            {layoutMode === 'horizontal' ? (
              <Smartphone className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-orange-500" />
            )}
            <span className="hidden sm:inline">Modo {layoutMode === 'horizontal' ? 'Fluido' : 'Coluna'}</span>
          </button>
        </div>

        {/* Grid dos Três Formulários com Auto-fit Fluido */}
        <div
          className="grid gap-[clamp(12px,1.5vw,24px)] items-start"
          style={{ gridTemplateColumns: layoutMode === 'horizontal' ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr' }}
        >
          {/* Seção: Dados do Paciente */}
          <article className="card-orange group">
            <header className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="w-9 h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform duration-200">
                <User className="w-4 h-4" />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Dados do Paciente
              </h2>
            </header>
            <PatientForm formData={formData} updateFormData={updateFormData} />
          </article>

          {/* Seção: Dados do Atestado */}
          <article className="card-orange group">
            <header className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="w-9 h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform duration-200">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Dados do Atestado
              </h2>
            </header>
            <CertificateForm formData={formData} updateFormData={updateFormData} />
          </article>

          {/* Seção: Dados do Médico */}
          <article className="card-orange group">
            <header className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <div className="w-9 h-9 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-105 transition-transform duration-200">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Dados do Médico
              </h2>
            </header>
            <DoctorForm formData={formData} updateFormData={updateFormData} />
          </article>

        </div>

      </main>

      {/* Barra de Ações Sticky Fixada na Parte Inferior */}
      <footer className="sticky bottom-0 z-30 bg-white/95 dark:bg-surface-page/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-[clamp(12px,2vw,32px)] py-3">
        <div className="max-w-[1800px] mx-auto">
          <ActionButtons
            onGenerateHTML={handleGenerateHTML}
            onClear={handleClear}
            loading={loading}
          />
        </div>
      </footer>

      {/* Modal de Validação */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        missingFields={missingFields}
      />

    </div>
  )
}

export default App
