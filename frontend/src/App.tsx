import { useState } from 'react'
import { FileText, User, Stethoscope, CheckCircle, XCircle } from 'lucide-react'
import Header from './components/Header'
import PatientForm from './components/PatientForm'
import CertificateForm from './components/CertificateForm'
import DoctorForm from './components/DoctorForm'
import ActionButtons from './components/ActionButtons'
import { generateDocument } from './services/api'
import type { FormData } from './types'

function App() {
  const [formData, setFormData] = useState<FormData>({
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

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage(null) // Limpar mensagem ao editar
  }

  const handleGenerate = async () => {
    // Validação básica
    if (!formData.nomePaciente.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha o nome do paciente.' })
      return
    }
    if (!formData.nomeMedico.trim()) {
      setMessage({ type: 'error', text: 'Por favor, preencha o nome do médico.' })
      return
    }
    if (!formData.diasAfastamento) {
      setMessage({ type: 'error', text: 'Por favor, informe os dias de afastamento.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const blob = await generateDocument(formData)
      
      // Criar download do arquivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Atestado_${formData.nomePaciente.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ type: 'success', text: 'Documento gerado com sucesso! Download iniciado.' })
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      setMessage({ type: 'error', text: 'Erro ao gerar documento. Verifique se o backend está rodando.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFormData({
      nomePaciente: '',
      tipoDocumento: 'CPF',
      numeroDocumento: '',
      cargo: '',
      empresa: '',
      dataAtestado: new Date().toISOString().split('T')[0],
      diasAfastamento: '',
      cid: '',
      cidNaoInformado: false,
      nomeMedico: '',
      tipoRegistro: 'CRM',
      numeroRegistro: '',
      ufRegistro: 'DF',
    })
    setMessage({ type: 'success', text: 'Formulário limpo com sucesso!' })
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Header />

        {/* Mensagem de Status */}
        {message && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <p className={`font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Container Principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-2xl border border-white/30 p-2">
          <div className="space-y-6 p-6">
            
            {/* Seção: Dados do Paciente */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-primary-500 text-2xl font-extrabold">Dados do Paciente</h2>
              </div>
              <PatientForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Seção: Dados do Atestado */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-primary-500 text-2xl font-extrabold">Dados do Atestado</h2>
              </div>
              <CertificateForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Seção: Dados do Médico */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-primary-500 text-2xl font-extrabold">Dados do Médico</h2>
              </div>
              <DoctorForm formData={formData} updateFormData={updateFormData} />
            </div>

            {/* Botões de Ação */}
            <ActionButtons 
              onGenerate={handleGenerate} 
              onClear={handleClear}
              loading={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/90 text-sm font-medium">
          <p>Sistema de Homologação v2.0 - Desenvolvido por Kauan Kelvin</p>
        </div>
      </div>
    </div>
  )
}

export default App
