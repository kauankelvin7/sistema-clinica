import { useState, useEffect } from 'react'
import { FileText, User, Stethoscope, CheckCircle, XCircle } from 'lucide-react'
import Header from './components/Header'
import PatientForm from './components/PatientForm'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import ActionButtons from './components/ActionButtons'
import { ValidationModal } from './components/ValidationModal'
import { generateDocument } from './services/api'
import type { FormData } from './types'

function App() {
  // Carregar dados salvos do localStorage
  const loadSavedData = (): FormData => {
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

  const getDefaultFormData = (): FormData => ({
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
    
    // Médico
    nomeMedico: '',
    tipoRegistro: 'CRM',
    numeroRegistro: '',
    ufRegistro: 'DF',
  })

  const [formData, setFormData] = useState<FormData>(loadSavedData())
  const [loading, setLoading] = useState<'word' | false>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  // Salvar dados automaticamente quando mudar
  useEffect(() => {
    localStorage.setItem('sistema_clinica_data', JSON.stringify(formData))
  }, [formData])

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
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
    if (!formData.diasAfastamento || parseInt(formData.diasAfastamento) <= 0) missing.push('Dias de Afastamento')
    if (!formData.cidNaoInformado && !formData.cid.trim()) missing.push('Código CID')

    // Validar Médico
    if (!formData.nomeMedico.trim()) missing.push('Nome do Médico')
    if (!formData.numeroRegistro.trim()) missing.push('Número de Registro do Médico')
    if (!formData.ufRegistro.trim()) missing.push('UF do Registro do Médico')

    return missing
  }

  const handleGenerateWord = async () => {
    // Validar campos obrigatórios
    const missing = validateFormData()
    
    if (missing.length > 0) {
      setMissingFields(missing)
      setShowValidationModal(true)
      return
    }

    setLoading('word')
    setMessage(null)

    try {
      const blob = await generateDocument(formData, 'word')
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Atestado_${formData.nomePaciente.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Documento Word gerado com sucesso! Download iniciado.' })
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      setMessage({ type: 'error', text: 'Erro ao gerar documento. Verifique se o backend está rodando.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    const defaultData = getDefaultFormData()
    setFormData(defaultData)
    localStorage.removeItem('sistema_clinica_data')
    setMessage({ type: 'success', text: 'Formulário limpo com sucesso!' })
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:py-8 sm:px-6 md:py-12 md:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-950 transition-colors duration-500">
  <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <Header />

        {/* Mensagem de Status */}
        {message && (
          <div className={`rounded-xl p-4 flex items-center gap-3 shadow-lg backdrop-blur-sm border-2 transition-colors duration-300
            ${message.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700 dark:text-emerald-100'
              : 'bg-rose-50/90 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-100'}
          `}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-300 flex-shrink-0" />
            )}
            <p className="font-semibold text-sm">
              {message.text}
            </p>
          </div>
        )}

        {/* Container Principal */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-xl dark:shadow-none transition-colors duration-500">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
              {/* Seção: Dados do Paciente */}
              <div className="card dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-800 rounded-2xl flex items-center justify-center shadow-md dark:shadow-blue-900/30">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-gray-800 dark:text-slate-100 text-lg md:text-xl font-bold">Dados do Paciente</h2>
                </div>
                <PatientForm formData={formData} updateFormData={updateFormData} />
              </div>
              {/* Seção: Dados do Atestado */}
              <div className="card dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-800 rounded-2xl flex items-center justify-center shadow-md dark:shadow-blue-900/30">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-gray-800 dark:text-slate-100 text-lg md:text-xl font-bold">Dados do Atestado</h2>
                </div>
                <CertificateForm formData={formData} updateFormData={updateFormData} />
              </div>
              {/* Seção: Dados do Médico */}
              <div className="card dark:bg-slate-800 dark:border-slate-700 dark:shadow-none">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-600 dark:bg-blue-800 rounded-2xl flex items-center justify-center shadow-md dark:shadow-blue-900/30">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-gray-800 dark:text-slate-100 text-lg md:text-xl font-bold">Dados do Médico</h2>
                </div>
                <DoctorForm formData={formData} updateFormData={updateFormData} />
              </div>
            </div>
            {/* Botões de Ação */}
            <div className="mt-8">
              <ActionButtons 
                onGenerateWord={handleGenerateWord} 
                onClear={handleClear}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Modal de Validação */}
        <ValidationModal 
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          missingFields={missingFields}
        />

        {/* Footer */}
        <div className="text-center pb-4">
          <div className="inline-block bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl px-8 py-3 shadow-md dark:shadow-none transition-colors duration-500">
            <p className="text-gray-700 dark:text-slate-200 text-xs md:text-sm font-semibold">
              Sistema de Homologação v2.0 • Desenvolvido por <span className="text-blue-600 dark:text-blue-400 font-bold">Kauan Kelvin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
