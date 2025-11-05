import { ExternalLink, Stethoscope, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { DoctorFormProps } from '../types'
import api from '../config/api'
import DoctorsListModal from './DoctorsListModal'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function DoctorForm({ formData, updateFormData }: DoctorFormProps) {
  const [totalMedicos, setTotalMedicos] = useState<number>(0)
  const [showListModal, setShowListModal] = useState(false)

  useEffect(() => {
    // Buscar total de médicos salvos
    fetch(api.endpoints.medicos)
      .then(res => res.json())
      .then(data => setTotalMedicos(data.length))
      .catch(() => setTotalMedicos(0))
  }, [])

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
    <div className="space-y-6">
      {/* Modal de Listagem */}
      <DoctorsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Contador de Médicos Salvos - Clicável */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Médicos Cadastrados</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{totalMedicos}</p>
          </div>
          <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </button>

      {/* Nome Completo */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Registro Profissional
        </label>
        <div className="grid grid-cols-1 gap-4">
          {/* Linha 1: Tipo, Número e UF */}
          <div className="flex gap-4">
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
              placeholder="Número do registro"
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
          </div>

          {/* Linha 2: Botão Consultar */}
          <button
            type="button"
            onClick={handleConsultar}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <span>Consultar Registro Online</span>
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
