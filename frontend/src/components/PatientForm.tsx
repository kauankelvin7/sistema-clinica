import type { PatientFormProps } from '../types'
import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import api from '../config/api'


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

  useEffect(() => {
    // Buscar total de pacientes salvos
    fetch(api.endpoints.pacientes)
      .then(res => res.json())
      .then(data => setTotalPacientes(data.length))
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
      {/* Contador de Pacientes Salvos */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Pacientes Cadastrados</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalPacientes}</p>
          </div>
        </div>
      </div>

      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome completo do paciente"
          value={formData.nomePaciente}
          onChange={(e) => updateFormData('nomePaciente', e.target.value)}
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
