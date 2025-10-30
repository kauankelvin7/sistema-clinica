import type { PatientFormProps } from '../types'

export default function PatientForm({ formData, updateFormData }: PatientFormProps) {
  return (
    <div className="space-y-5">
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
            className="input-field w-28"
            value={formData.tipoDocumento}
            onChange={(e) => updateFormData('tipoDocumento', e.target.value)}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
          <input
            type="text"
            className="input-field flex-1"
            placeholder="000.000.000-00"
            value={formData.numeroDocumento}
            onChange={(e) => updateFormData('numeroDocumento', e.target.value)}
          />
        </div>
      </div>

      {/* Cargo */}
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

      {/* Empresa */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Empresa
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Nome da empresa ou instituição"
          value={formData.empresa}
          onChange={(e) => updateFormData('empresa', e.target.value)}
        />
      </div>
    </div>
  )
}
