import type { PatientFormProps } from '../types'
import { useState, useEffect } from 'react'
import { Users, Eye } from 'lucide-react'
import api from '../config/api'
import PatientsListModal from './PatientsListModal'
import AutocompleteInput from './AutocompleteInput'


// Função para aplicar máscara de CPF
function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

export default function PatientForm({ formData, updateFormData }: PatientFormProps) {
  const [totalPacientes, setTotalPacientes] = useState<number>(0)
  const [showListModal, setShowListModal] = useState(false)
  const [pacientesOptions, setPacientesOptions] = useState<Array<{label: string, value: string}>>([])

  useEffect(() => {
    // Buscar total de pacientes salvos e criar options para autocomplete
    fetch(api.endpoints.pacientes)
      .then(res => res.json())
      .then(data => {
        setTotalPacientes(data.length)
        
        // Criar options para autocomplete
        const options = data.map((p: any) => ({
          label: p.nome_completo,
          value: p.nome_completo,
          data: p
        }))
        setPacientesOptions(options)
      })
      .catch(() => setTotalPacientes(0))
  }, [])

  // Atualiza o campo de documento com máscara se for CPF
  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (formData.tipoDocumento === 'CPF') {
      value = maskCPF(value)
    }
    updateFormData('numeroDocumento', value)
  }

  // Ao trocar o tipo de documento, limpa ou remove máscara se necessário
  const handleTipoDocumentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value
    if (tipo === 'CPF') {
      updateFormData('tipoDocumento', tipo)
      updateFormData('numeroDocumento', maskCPF(formData.numeroDocumento))
    } else {
      updateFormData('tipoDocumento', tipo)
      updateFormData('numeroDocumento', formData.numeroDocumento.replace(/\D/g, ''))
    }
  }

  return (
    <div className="space-y-6">
      {/* Modal de Listagem */}
      <PatientsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Contador de Pacientes Salvos - Clicável */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pacientes Cadastrados</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalPacientes}</p>
          </div>
          <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </button>

      {/* Nome Completo com Autocomplete */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo
        </label>
        <AutocompleteInput
          value={formData.nomePaciente}
          onChange={(value) => updateFormData('nomePaciente', value)}
          onSelect={(option: any) => {
            if (option.data) {
              updateFormData('nomePaciente', option.data.nome_completo)
              updateFormData('tipoDocumento', option.data.tipo_doc)
              updateFormData('numeroDocumento', option.data.numero_doc)
              updateFormData('cargo', option.data.cargo || '')
              updateFormData('empresa', option.data.empresa || '')
            }
          }}
          options={pacientesOptions}
          placeholder="Digite o nome completo do paciente"
          minChars={2}
        />
      </div>

      {/* Documento (CPF/RG) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Documento
        </label>
        <div className="flex gap-4">
          <select
            className="input-field w-32"
            value={formData.tipoDocumento}
            onChange={handleTipoDocumentoChange}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
          <input
            type="text"
            className="input-field flex-1"
            placeholder={formData.tipoDocumento === 'CPF' ? '000.000.000-00' : 'Digite o RG'}
            value={formData.numeroDocumento}
            onChange={handleDocumentoChange}
            maxLength={formData.tipoDocumento === 'CPF' ? 14 : 20}
            inputMode={formData.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
          />
        </div>
      </div>

      {/* Cargo e Empresa em linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Cargo
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ex: Analista de Sistemas"
            value={formData.cargo}
            onChange={(e) => updateFormData('cargo', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Empresa
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Nome da empresa"
            value={formData.empresa}
            onChange={(e) => updateFormData('empresa', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
