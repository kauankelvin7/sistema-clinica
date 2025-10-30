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
  const [loading, setLoading] = useState<'word' | 'pdf' | false>(false)
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

  const handleGenerate = async (format: 'word' | 'pdf') => {
    // Validar campos obrigatórios
    const missing = validateFormData()
    
    if (missing.length > 0) {
      setMissingFields(missing)
      setShowValidationModal(true)
      return
    }

    setLoading(format)
    setMessage(null)

    try {
      const blob = await generateDocument(formData, format)
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const extension = format === 'pdf' ? 'pdf' : 'docx'
      link.download = `Atestado_${formData.nomePaciente.replace(/\s+/g, '_')}_${new Date().getTime()}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: `Documento ${format.toUpperCase()} gerado com sucesso! Download iniciado.` })
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
    <div className="min-h-screen py-4 px-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Header */}
        <Header />

        {/* Mensagem de Status */}
        {message && (
          <div className={`rounded-lg p-2.5 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <p className={`font-medium text-xs ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Indicador de Auto-Save */}
        <div className="bg-gradient-to-r from-purple-900/90 to-gray-900/90 border-2 border-purple-500/50 rounded-lg p-2 flex items-center gap-2 shadow-lg shadow-purple-500/20">
          <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
          <p className="text-xs font-medium text-purple-100">
            💾 Seus dados são salvos automaticamente e carregados na próxima visita
          </p>
        </div>

        {/* Container Principal */}
        <div className="bg-white/95 rounded-xl border-2 border-purple-500/20 shadow-2xl">
          <div className="space-y-3 p-3">
            
            {/* Seção: Dados do Paciente */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-gray-900 text-base font-bold">Dados do Paciente</h2>
              </div>
              <PatientForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Seção: Dados do Atestado */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-gray-900 text-base font-bold">Dados do Atestado</h2>
              </div>
              <CertificateForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Seção: Dados do Médico */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-gray-900 text-base font-bold">Dados do Médico</h2>
              </div>
              <DoctorForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Botões de Ação */}
            <ActionButtons 
              onGenerateWord={() => handleGenerate('word')} 
              onGeneratePDF={() => handleGenerate('pdf')}
              onClear={handleClear}
              loading={loading}
            />
          </div>
        </div>

        {/* Modal de Validação */}
        <ValidationModal 
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          missingFields={missingFields}
        />

        {/* Footer */}
        <div className="text-center text-white/90 text-xs font-medium">
          <p>Sistema de Homologação v2.0 - Desenvolvido por Kauan Kelvin</p>
        </div>
      </div>
    </div>
  )
}

export default App
