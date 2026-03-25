import { useState, useEffect } from 'react'
import {
  FileText, User, Stethoscope, CheckCircle, XCircle,
  BadgeCheck, Shield, HeartPulse, Dumbbell,
  Printer, Eraser, Loader2, Eye, ChevronRight
} from 'lucide-react'
import Header from './components/Header'
import PatientForm from './components/PatientForm'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import { ValidationModal } from './components/ValidationModal'
import api from './config/api'
import type { FormData } from './types'

// ─── Section configuration ───────────────────────────────────────────
const sectionConfig = {
  homologacao: {
    title: 'Homologação de Atestado',
    subtitle: 'Declaração médica para homologação de atestado',
    icon: BadgeCheck,
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'from-blue-50 to-indigo-50',
    endpoint: '/api/generate-html',
  },
  vigilante: {
    title: 'Atestado Vigilante',
    subtitle: 'Atestado de capacidade para atividade de vigilância',
    icon: Shield,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'from-amber-50 to-orange-50',
    endpoint: '/api/generate-vigilante-html',
  },
  saude: {
    title: 'Atestado de Saúde',
    subtitle: 'Atestado de saúde ocupacional (ASO)',
    icon: HeartPulse,
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'from-rose-50 to-pink-50',
    endpoint: '/api/generate-saude-html',
  },
  atividades: {
    title: 'Atividades Físicas',
    subtitle: 'Atestado de aptidão para atividades físicas',
    icon: Dumbbell,
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'from-emerald-50 to-teal-50',
    endpoint: '/api/generate-atividades-html',
  },
} as const

type SectionId = keyof typeof sectionConfig

// ─── Extra fields per section ────────────────────────────────────────
interface ExtraFields {
  // Vigilante
  cnvRegistro?: string
  validadeCnv?: string
  // Saúde (ASO)
  tipoExame?: string
  riscoOcupacional?: string
  aptidao?: string
  // Atividades Físicas
  tipoAtividade?: string
  restricoes?: string
  validadeAtestado?: string
}

function App() {
  const [activeTab, setActiveTab] = useState<SectionId>(() => {
    const saved = localStorage.getItem('active_tab') as SectionId
    return saved && saved in sectionConfig ? saved : 'homologacao'
  })

  useEffect(() => {
    localStorage.setItem('active_tab', activeTab)
  }, [activeTab])

  // Main form data (shared across sections)
  const loadSavedData = (): FormData => {
    const saved = localStorage.getItem('sistema_clinica_data')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return getDefaultFormData()
  }

  const getDefaultFormData = (): FormData => ({
    nomePaciente: '', tipoDocumento: 'CPF', numeroDocumento: '',
    cargo: '', empresa: '',
    dataAtestado: new Date().toISOString().split('T')[0],
    diasAfastamento: '', cid: '', cidNaoInformado: false,
    nomeMedico: '', tipoRegistro: 'CRM', numeroRegistro: '', ufRegistro: 'DF',
  })

  const [formData, setFormData] = useState<FormData>(loadSavedData())
  const [extraFields, setExtraFields] = useState<ExtraFields>(() => {
    const saved = localStorage.getItem('sistema_clinica_extra')
    if (saved) { try { return JSON.parse(saved) } catch { /* ignore */ } }
    return {
      cnvRegistro: '', validadeCnv: '',
      tipoExame: 'Admissional', riscoOcupacional: '', aptidao: 'Apto',
      tipoAtividade: '', restricoes: '', validadeAtestado: '',
    }
  })

  const [loading, setLoading] = useState<'word' | 'html' | false>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  // Auto-save
  useEffect(() => {
    localStorage.setItem('sistema_clinica_data', JSON.stringify(formData))
  }, [formData])

  useEffect(() => {
    localStorage.setItem('sistema_clinica_extra', JSON.stringify(extraFields))
  }, [extraFields])

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage(null)
  }

  const updateExtra = (field: keyof ExtraFields, value: string) => {
    setExtraFields(prev => ({ ...prev, [field]: value }))
    setMessage(null)
  }

  // ─── Validation ─────────────────────────────────────────────────────
  const validateFormData = (): string[] => {
    const missing: string[] = []
    if (!formData.nomePaciente.trim()) missing.push('Nome do Paciente')
    if (!formData.numeroDocumento.trim()) missing.push('Número do Documento')
    if (!formData.cargo.trim()) missing.push('Cargo')
    if (!formData.empresa.trim()) missing.push('Empresa')
    if (!formData.dataAtestado) missing.push('Data do Atestado')

    if (activeTab === 'homologacao') {
      if (!formData.diasAfastamento || parseInt(formData.diasAfastamento) <= 0) missing.push('Dias de Afastamento')
      if (!formData.cidNaoInformado && !formData.cid.trim()) missing.push('Código CID')
    }

    if (!formData.nomeMedico.trim()) missing.push('Nome do Médico')
    if (!formData.numeroRegistro.trim()) missing.push('Número de Registro')
    if (!formData.ufRegistro.trim()) missing.push('UF do Registro')

    return missing
  }

  // ─── Generate HTML ──────────────────────────────────────────────────
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
      const config = sectionConfig[activeTab]
      const body: Record<string, unknown> = {
        paciente: {
          nome: formData.nomePaciente,
          tipo_documento: formData.tipoDocumento,
          numero_documento: formData.numeroDocumento,
          cargo: formData.cargo,
          empresa: formData.empresa,
        },
        atestado: {
          data_atestado: formData.dataAtestado,
          dias_afastamento: parseInt(formData.diasAfastamento) || 0,
          cid: formData.cid,
          cid_nao_informado: formData.cidNaoInformado,
        },
        medico: {
          nome: formData.nomeMedico,
          tipo_registro: formData.tipoRegistro,
          numero_registro: formData.numeroRegistro,
          uf_registro: formData.ufRegistro,
        },
      }

      // Add extra fields per section
      if (activeTab === 'vigilante') {
        body.vigilante = { cnv_registro: extraFields.cnvRegistro, validade_cnv: extraFields.validadeCnv }
      } else if (activeTab === 'saude') {
        body.saude = { tipo_exame: extraFields.tipoExame, risco_ocupacional: extraFields.riscoOcupacional, aptidao: extraFields.aptidao }
      } else if (activeTab === 'atividades') {
        body.atividades = { tipo_atividade: extraFields.tipoAtividade, restricoes: extraFields.restricoes, validade: extraFields.validadeAtestado }
      }

      const response = await fetch(`${api.baseURL}${config.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Falha na geração do documento')

      const htmlContent = await response.text()
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        newWindow.onload = () => { newWindow.focus(); newWindow.print() }
      }

      setMessage({ type: 'success', text: 'Documento gerado com sucesso! Aberto em nova aba.' })
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      setMessage({ type: 'error', text: 'Não foi possível gerar o documento. Verifique se o backend está rodando.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFormData(getDefaultFormData())
    setExtraFields({
      cnvRegistro: '', validadeCnv: '',
      tipoExame: 'Admissional', riscoOcupacional: '', aptidao: 'Apto',
      tipoAtividade: '', restricoes: '', validadeAtestado: '',
    })
    localStorage.removeItem('sistema_clinica_data')
    localStorage.removeItem('sistema_clinica_extra')
    setMessage({ type: 'success', text: 'Campos limpos com sucesso!' })
  }

  const config = sectionConfig[activeTab]
  const SectionIcon = config.icon

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-6 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with tabs */}
        <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as SectionId)} />

        {/* Status Message */}
        {message && (
          <div className={`rounded-xl p-4 flex items-center gap-3 shadow-lg border animate-slide-up ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-200'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <XCircle className="w-5 h-5 flex-shrink-0" />
            }
            <p className="font-medium text-sm">{message.text}</p>
          </div>
        )}

        {/* Section Title Card */}
        <div className={`bg-gradient-to-r ${config.lightBg} dark:from-surface-800 dark:to-surface-900 rounded-2xl p-6 border border-white/50 dark:border-surface-700/50 shadow-card animate-fade-in`}>
          <div className="flex items-center gap-4">
            <div className={`icon-box bg-gradient-to-br ${config.gradient} shadow-glow`}>
              <SectionIcon className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">{config.title}</h2>
              <p className="text-sm text-surface-700 dark:text-surface-300 mt-0.5">{config.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Patient Section */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-700">
              <div className="icon-box bg-gradient-to-br from-primary-500 to-primary-700">
                <User className="w-5 h-5 text-white drop-shadow" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-white">Dados do Paciente</h3>
            </div>
            <PatientForm formData={formData} updateFormData={updateFormData} />
          </div>

          {/* Certificate/Specific Section */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-700">
              <div className={`icon-box bg-gradient-to-br ${config.gradient}`}>
                <FileText className="w-5 h-5 text-white drop-shadow" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-white">
                {activeTab === 'homologacao' ? 'Dados do Atestado' : `Dados - ${config.title}`}
              </h3>
            </div>

            {/* Shared fields for Homologação */}
            {activeTab === 'homologacao' && (
              <CertificateForm formData={formData} updateFormData={updateFormData} />
            )}

            {/* Vigilante-specific fields */}
            {activeTab === 'vigilante' && (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Data do Atestado</label>
                  <input type="date" className="input-field" value={formData.dataAtestado}
                    onChange={e => updateFormData('dataAtestado', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Registro CNV</label>
                  <input type="text" className="input-field" placeholder="Nº do CNV"
                    value={extraFields.cnvRegistro || ''}
                    onChange={e => updateExtra('cnvRegistro', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Validade do CNV</label>
                  <input type="date" className="input-field"
                    value={extraFields.validadeCnv || ''}
                    onChange={e => updateExtra('validadeCnv', e.target.value)} />
                </div>
              </div>
            )}

            {/* Saúde-specific fields */}
            {activeTab === 'saude' && (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Data do Exame</label>
                  <input type="date" className="input-field" value={formData.dataAtestado}
                    onChange={e => updateFormData('dataAtestado', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Tipo de Exame</label>
                  <select className="input-field" value={extraFields.tipoExame || 'Admissional'}
                    onChange={e => updateExtra('tipoExame', e.target.value)}>
                    <option value="Admissional">Admissional</option>
                    <option value="Demissional">Demissional</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                    <option value="Mudança de Função">Mudança de Função</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Risco Ocupacional</label>
                  <input type="text" className="input-field" placeholder="Ex: Ruído, Poeira, etc."
                    value={extraFields.riscoOcupacional || ''}
                    onChange={e => updateExtra('riscoOcupacional', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Aptidão</label>
                  <select className="input-field" value={extraFields.aptidao || 'Apto'}
                    onChange={e => updateExtra('aptidao', e.target.value)}>
                    <option value="Apto">Apto</option>
                    <option value="Inapto">Inapto</option>
                    <option value="Apto com Restrições">Apto com Restrições</option>
                  </select>
                </div>
              </div>
            )}

            {/* Atividades Físicas-specific fields */}
            {activeTab === 'atividades' && (
              <div className="space-y-4">
                <div>
                  <label className="input-label">Data do Atestado</label>
                  <input type="date" className="input-field" value={formData.dataAtestado}
                    onChange={e => updateFormData('dataAtestado', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Tipo de Atividade</label>
                  <input type="text" className="input-field" placeholder="Ex: Musculação, Natação, Corrida..."
                    value={extraFields.tipoAtividade || ''}
                    onChange={e => updateExtra('tipoAtividade', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Restrições</label>
                  <textarea className="input-field min-h-[80px] resize-y" placeholder="Restrições ou observações médicas..."
                    value={extraFields.restricoes || ''}
                    onChange={e => updateExtra('restricoes', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Validade do Atestado</label>
                  <input type="date" className="input-field"
                    value={extraFields.validadeAtestado || ''}
                    onChange={e => updateExtra('validadeAtestado', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Doctor Section */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-700">
              <div className="icon-box bg-gradient-to-br from-accent-500 to-accent-700">
                <Stethoscope className="w-5 h-5 text-white drop-shadow" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-white">Dados do Médico</h3>
            </div>
            <DoctorForm formData={formData} updateFormData={updateFormData} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="section-card animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
              <Eye className="w-4 h-4" />
              <span>O documento será aberto em nova aba para impressão</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleClear} className="btn-secondary text-sm">
                <Eraser className="w-4 h-4" />
                Limpar
              </button>
              <button
                onClick={handleGenerateHTML}
                disabled={loading === 'html'}
                className="btn-primary text-sm"
              >
                {loading === 'html' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {loading === 'html' ? 'Gerando...' : 'Gerar Documento HTML'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-sm text-surface-700 dark:text-surface-300 font-medium">
            NOVA Atestados v3.0 • Desenvolvido por{' '}
            <span className="text-primary-600 dark:text-primary-400 font-bold">Kauan Kelvin</span>
          </p>
        </div>

        {/* Validation Modal */}
        <ValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          missingFields={missingFields}
        />
      </div>
    </div>
  )
}

export default App
