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
    <div className="space-y-4">
      {/* Busca de Médico */}
      <DoctorSearch onSelect={handleLoadDoctor} />

      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nome Completo do Médico
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome completo do profissional"
          value={formData.nomeMedico}
          onChange={(e) => updateFormData('nomeMedico', e.target.value)}
        />
      </div>

      {/* Registro Profissional */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Registro Profissional
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tipo */}
          <select
            className="input-field sm:w-28"
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
            placeholder="Número do registro"
            value={formData.numeroRegistro}
            onChange={(e) => updateFormData('numeroRegistro', e.target.value)}
          />

          {/* UF */}
          <select
            className="input-field sm:w-20"
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
            className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Consultar</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
