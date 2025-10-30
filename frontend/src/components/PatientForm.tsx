import type { PatientFormProps, Paciente } from '../types'
import PatientSearch from './PatientSearch'


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
  const handleLoadPatient = (patient: Paciente) => {
    updateFormData('nomePaciente', patient.nome_completo)
    updateFormData('tipoDocumento', patient.tipo_doc)
    updateFormData('numeroDocumento', patient.numero_doc)
    updateFormData('cargo', patient.cargo || '')
    updateFormData('empresa', patient.empresa || '')
  }

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
    <div className="space-y-4">
      {/* Busca de Paciente */}
      <PatientSearch onSelect={handleLoadPatient} />

      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Documento
        </label>
        <div className="flex gap-3">
          <select
            className="input-field w-24"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
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
