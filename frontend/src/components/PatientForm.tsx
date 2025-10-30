import type { PatientFormProps } from '../types'

export default function PatientForm({ formData, updateFormData }: PatientFormProps) {
  return (
    <div className="space-y-3.5">
      {/* Nome Completo */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Nome Completo
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome completo"
          value={formData.nomePaciente}
          onChange={(e) => updateFormData('nomePaciente', e.target.value)}
        />
      </div>

      {/* Documento (CPF/RG) */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
          Documento
        </label>
        <div className="flex gap-2">
          <select
            className="input-field w-24"
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

      {/* Cargo e Empresa em linha */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Cargo
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ex: Analista"
            value={formData.cargo}
            onChange={(e) => updateFormData('cargo', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
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
