import { ExternalLink } from 'lucide-react'
import type { DoctorFormProps } from '../types'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function DoctorForm({ formData, updateFormData }: DoctorFormProps) {
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
    <div className="space-y-5">
      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nome Completo
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="Digite o nome completo do médico"
          value={formData.nomeMedico}
          onChange={(e) => updateFormData('nomeMedico', e.target.value)}
        />
      </div>

      {/* Registro Profissional */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Registro Profissional
        </label>
        <div className="flex gap-3">
          {/* Tipo */}
          <select
            className="input-field w-28"
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
            className="input-field w-24"
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
            className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold 
                     rounded-2xl shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-500
                     transition-all duration-300 transform hover:scale-105 active:scale-95
                     flex items-center gap-2 whitespace-nowrap"
          >
            Consultar
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
