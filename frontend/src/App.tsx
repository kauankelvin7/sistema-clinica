import { useState, useEffect } from 'react'
import { FileText, User, Stethoscope, CheckCircle, XCircle, Smartphone, Monitor, Github, Linkedin, LogOut } from 'lucide-react'
import Header from './components/Header'
import PatientForm from './components/PatientForm'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import ActionButtons from './components/ActionButtons'
import { ValidationModal } from './components/ValidationModal'
import Login from './components/Login'
import api, { generateDocument } from './services/api'
import { imprimirHTML } from './utils/print'
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
    <main className="min-h-screen py-8 px-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto space-y-8">
        
        <Header />

        {/* Botão de Alternância de Layout e Logout */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setLayoutMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
            className="group flex items-center gap-3 px-6 py-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md hover:shadow-orange-500/20 hover:border-orange-400/50 dark:hover:border-orange-500/50 transition-all duration-300"
            title="Alternar Layout"
          >
            {layoutMode === 'horizontal' ? (
              <Smartphone className="w-5 h-5 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Monitor className="w-5 h-5 text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 px-6 py-3 bg-rose-50 dark:bg-rose-900/20 backdrop-blur-sm border border-rose-200 dark:border-rose-800 rounded-xl shadow-md hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all duration-300"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5 text-rose-500 dark:text-rose-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Mensagem de Status flutuante (Toast) */}
        {message && (
          <div className={`fixed top-6 right-6 z-50 rounded-2xl p-5 flex items-center gap-4 shadow-2xl transition-all animate-in fade-in slide-in-from-top-5 duration-300 backdrop-blur-sm border
            ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 shadow-rose-500/10'}
          `}>
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            )}
            <p className="font-semibold text-base">{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors">✕</button>
          </div>
        )}

        {/* Container Principal com efeito Glow */}
        <section className="bg-white dark:bg-zinc-900 rounded-3xl p-8 lg:p-12 
                            border border-zinc-100 dark:border-zinc-800
                            shadow-[0_0_60px_-15px_rgba(249,115,22,0.08)] 
                            dark:shadow-[0_0_60px_-15px_rgba(249,115,22,0.12)]
                            transition-all duration-300">
          
          <div className={`grid gap-12 items-start relative ${layoutMode === 'horizontal' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            
            {/* Seção: Dados do Paciente */}
            <article className="card-orange group min-w-[300px] flex-1">
              <header className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-zinc-900 dark:text-zinc-50 text-xl font-extrabold tracking-tight">Dados do Paciente</h2>
              </header>
              <PatientForm formData={formData} updateFormData={updateFormData} />
            </article>

            {/* Seção: Dados do Atestado */}
            <article className="card-orange group min-w-[300px] flex-1">
              <header className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-zinc-900 dark:text-zinc-50 text-xl font-extrabold tracking-tight">Dados do Atestado</h2>
              </header>
              <CertificateForm formData={formData} updateFormData={updateFormData} />
            </article>

            {/* Seção: Dados do Médico */}
            <article className="card-orange group min-w-[300px] flex-1">
              <header className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Stethoscope className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-zinc-900 dark:text-zinc-50 text-xl font-extrabold tracking-tight">Dados do Médico</h2>
              </header>
              <DoctorForm formData={formData} updateFormData={updateFormData} />
            </article>

          </div>

          {/* Botões de Ação */}
          <footer className="mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800">
            <ActionButtons 
              onGenerateHTML={handleGenerateHTML}
              onClear={handleClear}
              loading={loading}
            />
          </footer>
        </section>

        {/* Modal de Validação */}
        <ValidationModal 
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          missingFields={missingFields}
        />

        {/* Footer Atualizado com Redes Sociais */}
        <footer className="text-center pb-4">
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-full px-8 py-3 shadow-md transition-all duration-300 hover:shadow-orange-500/10 hover:border-orange-500/20">
            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
              Sistema de Homologação v2.0 • Desenvolvido por <span className="text-orange-600 dark:text-orange-400 font-bold">Kauan Kelvin</span>
            </p>
            
            {/* Divisor Vertical (some no mobile) */}
            <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700"></div>
            
            {/* Links Sociais */}
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/kauankelvin7" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-400 hover:text-orange-500 transition-colors duration-300 group"
                aria-label="GitHub de Kauan Kelvin"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.linkedin.com/in/kauan-kelvin/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-400 hover:text-orange-500 transition-colors duration-300 group"
                aria-label="LinkedIn de Kauan Kelvin"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </footer>

      </div>
    </main>
  )
}

export default App
