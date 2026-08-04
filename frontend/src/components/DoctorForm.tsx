import { ExternalLink, Stethoscope, Eye, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { DoctorFormProps } from '../types'
import { searchDoctors, checkDuplicate } from '../services/api'
import DoctorsListModal from './DoctorsListModal'
import AutocompleteInput from './AutocompleteInput'
import ConsultaOnlineModal from './ConsultaOnlineModal' 
import { useTranslation } from '../utils/i18n'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function DoctorForm({ formData, updateFormData }: DoctorFormProps) {
  const { t } = useTranslation()
  const [totalMedicos, setTotalMedicos] = useState<number>(0)
  const [showListModal, setShowListModal] = useState(false)
  const [medicosOptions, setMedicosOptions] = useState<Array<{label: string, value: string, data: any}>>([])
  
  // Estado para controlar o Modal de Consulta Externa
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    // Buscar total de médicos salvos e criar options para autocomplete
    searchDoctors()
      .then(data => {
        const doctorsList = (data as any).doctors || data;
        setTotalMedicos(doctorsList.length)
        
        const options = doctorsList.map((m: any) => ({
          label: `${m.nome_completo} - ${m.tipo_crm} ${m.crm}/${m.uf_crm}`,
          value: m.nome_completo,
          data: m
        }))
        setMedicosOptions(options)
      })
      .catch(() => setTotalMedicos(0))
  }, [])

  // Verificar duplicatas quando o número do registro muda
  useEffect(() => {
    if (formData.numeroRegistro.length >= 4) {
      const timer = setTimeout(async () => {
        const exists = await checkDuplicate('medico', formData.numeroRegistro)
        setIsDuplicate(exists)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsDuplicate(false)
    }
  }, [formData.numeroRegistro])

  const handleConsultar = () => {
    if (formData.tipoRegistro) {
      setIsConsultaModalOpen(true)
    } else {
      alert('Selecione um tipo de registro antes de consultar.')
    }
  }

  return (
    <div className="space-y-4 relative">
      {/* Modal de Listagem Interna */}
      <DoctorsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Modal de Consulta Externa (CFM/CRO/RMS) */}
      <ConsultaOnlineModal 
        isOpen={isConsultaModalOpen} 
        onClose={() => setIsConsultaModalOpen(false)} 
        tipoRegistro={formData.tipoRegistro as 'CRM' | 'CRO' | 'RMS'} 
      />

      {/* Contador de Médicos Salvos - Clicável */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-zinc-50 dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 hover:border-orange-500/30 group transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-500/10 dark:bg-zinc-400/15 border border-zinc-500/20 dark:border-zinc-400/25 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              {t.searchDoctorsBtn}
            </p>
            {totalMedicos > 0 ? (
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-orange-500 transition-colors">
                {totalMedicos} {t.modalDoctorsTitle}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.modalDoctorsSubtitle}
              </p>
            )}
          </div>
          <Eye className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Nome Completo com Autocomplete */}
      <div>
        <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
          {t.doctorNameLabel}
        </label>
        <AutocompleteInput
          value={formData.nomeMedico}
          onChange={(value) => updateFormData('nomeMedico', value)}
          onSelect={(option: any) => {
            if (option.data) {
              updateFormData('nomeMedico', option.data.nome_completo)
              updateFormData('tipoRegistro', option.data.tipo_crm)
              updateFormData('numeroRegistro', option.data.crm)
              updateFormData('ufRegistro', option.data.uf_crm)
            }
          }}
          options={medicosOptions}
          placeholder={t.doctorNamePlaceholder}
          minChars={2}
        />
      </div>

      {/* Registro Profissional */}
      <div>
        <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
          {t.regNumberLabel}
        </label>
        <div className="grid grid-cols-1 gap-2.5">
          {/* Linha 1: Tipo, Número e UF */}
          <div className="flex gap-2">
            {/* Tipo */}
            <select
              className="input-field w-24 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.5rem_center] pr-7 cursor-pointer"
              value={formData.tipoRegistro}
              onChange={(e) => updateFormData('tipoRegistro', e.target.value)}
            >
              <option value="CRM">CRM</option>
              <option value="CRO">CRO</option>
              <option value="RMS">RMS</option>
            </select>

            {/* Número */}
            <input
              type="text"
              className={`input-field flex-1 ${isDuplicate ? 'border-amber-500/80 bg-amber-500/5 focus:border-amber-500' : ''}`}
              placeholder={t.regNumberPlaceholder}
              value={formData.numeroRegistro}
              onChange={(e) => updateFormData('numeroRegistro', e.target.value)}
            />

            {/* UF */}
            <select
              className="input-field w-20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.5rem_center] pr-7 cursor-pointer"
              value={formData.ufRegistro}
              onChange={(e) => updateFormData('ufRegistro', e.target.value)}
            >
              {UFS.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>

          {isDuplicate && (
            <div className="flex items-center gap-1.5 mt-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Este {formData.tipoRegistro} já está cadastrado no sistema.</span>
            </div>
          )}

          {/* Linha 2: Botão Consultar CRM */}
          <button
            type="button"
            onClick={handleConsultar}
            className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700/80 bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:border-orange-500/40 hover:text-orange-500 dark:hover:text-orange-400 flex items-center justify-center gap-2 transition-all duration-200 group"
          >
            <span>{t.consultRegister} {formData.tipoRegistro}</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
