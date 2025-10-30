import { ExternalLink } from 'lucide-react'
import type { DoctorFormProps, Medico } from '../types'
import DoctorSearch from './DoctorSearch'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function DoctorForm({ formData, updateFormData }: DoctorFormProps) {
  const handleLoadDoctor = (doctor: Medico) => {
    updateFormData('nomeMedico', doctor.nome_completo)
    updateFormData('tipoRegistro', doctor.tipo_crm)
    updateFormData('numeroRegistro', doctor.crm)
    updateFormData('ufRegistro', doctor.uf_crm)
  }

  const handleConsultar = () => {
    const urls: Record<string, string> = {
      CRM: 'https://portal.cfm.org.br/busca-medicos/',
      CRO: 'https://website.cfo.org.br/profissionais/busca-de-profissionais/',
    }
    
    const url = urls[formData.tipoRegistro]
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-2.5">
      {/* Busca de Médico */}
      <DoctorSearch onSelect={handleLoadDoctor} />

      {/* Nome Completo */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nome Completo
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome completo"
          value={formData.nomeMedico}
          onChange={(e) => updateFormData('nomeMedico', e.target.value)}
        />
      </div>

      {/* Registro Profissional */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Registro Profissional
        </label>
        <div className="flex gap-2">
          {/* Tipo */}
          <select
            className="input-field w-20"
            value={formData.tipoRegistro}
            onChange={(e) => updateFormData('tipoRegistro', e.target.value)}
          >
            <option value="CRM">CRM</option>
            <option value="CRO">CRO</option>
            <option value="RMs">RMs</option>
          </select>

          {/* Número */}
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Número"
            value={formData.numeroRegistro}
            onChange={(e) => updateFormData('numeroRegistro', e.target.value)}
          />

          {/* UF */}
          <select
            className="input-field w-16"
            value={formData.ufRegistro}
            onChange={(e) => updateFormData('ufRegistro', e.target.value)}
          >
            {UFS.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>

          {/* Botão Consultar */}
          <button
            type="button"
            onClick={handleConsultar}
            className="px-3 py-2 bg-orange-500 text-white font-semibold text-xs
                     rounded-lg hover:bg-orange-600 active:bg-orange-700
                     flex items-center gap-1 whitespace-nowrap"
          >
            Consultar
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
