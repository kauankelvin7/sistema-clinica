import { ExternalLink, Stethoscope, Eye, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { DoctorFormProps } from '../types'
import { searchDoctors, checkDuplicate } from '../services/api'
import DoctorsListModal from './DoctorsListModal'
import AutocompleteInput from './AutocompleteInput'
// Importação do novo Modal
import ConsultaOnlineModal from './ConsultaOnlineModal' 

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function DoctorForm({ formData, updateFormData }: DoctorFormProps) {
  const [totalMedicos, setTotalMedicos] = useState<number>(0)
  const [showListModal, setShowListModal] = useState(false)
  const [medicosOptions, setMedicosOptions] = useState<Array<{label: string, value: string, data: any}>>([])
  
  // Estado para controlar o Modal de Consulta Externa
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  useEffect(() => {
    // Buscar total de médicos salvos e criar options para autocomplete
    searchDoctors()
      .then(data => {
        // searchDoctors retorna PaginatedDoctors { total, doctors, ... }
        // mas aqui parece que o código original esperava um array simples ou algo similar.
        // Vamos verificar o retorno do searchDoctors.
        
        const doctorsList = (data as any).doctors || data;
        setTotalMedicos(doctorsList.length)
        
        // Criar options para autocomplete
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
        setCheckingDuplicate(true)
        const exists = await checkDuplicate('medico', formData.numeroRegistro)
        setIsDuplicate(exists)
        setCheckingDuplicate(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsDuplicate(false)
    }
  }, [formData.numeroRegistro])

  const handleConsultar = () => {
    // Em vez de fazer fetch estático ou alert, abre o modal direto com o tipo atual
    if (formData.tipoRegistro) {
      setIsConsultaModalOpen(true)
    } else {
      alert('Selecione um tipo de registro antes de consultar.')
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Modal de Listagem Interna */}
      <DoctorsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Modal de Consulta Externa (CFM/CRO/RMS) */}
      <ConsultaOnlineModal 
        isOpen={isConsultaModalOpen} 
        onClose={() => setIsConsultaModalOpen(false)} 
        // Força a tipagem esperada pelo modal
        tipoRegistro={formData.tipoRegistro as 'CRM' | 'CRO' | 'RMS'} 
      />

      {/* Contador de Médicos Salvos - Clicável */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] hover:border-orange-500/30 group transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Médicos Cadastrados
            </p>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight group-hover:text-orange-500 transition-colors">
              {totalMedicos}
            </p>
          </div>
          <Eye className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 transition-colors duration-300" />
        </div>
      </button>

      {/* Nome Completo com Autocomplete */}
      <div>
        <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
          Nome Completo do Médico
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
          placeholder="Digite o nome completo do profissional"
          minChars={2}
        />
      </div>

      {/* Registro Profissional */}
      <div>
        <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
          Registro Profissional
        </label>
        <div className="grid grid-cols-1 gap-4">
          {/* Linha 1: Tipo, Número e UF */}
          <div className="flex gap-4">
            {/* Tipo */}
            <select
              className="input-field w-28 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.8rem_center] pr-10 cursor-pointer"
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
              className={`input-field flex-1 ${isDuplicate ? 'border-amber-500 bg-amber-500/5 focus:border-amber-600' : ''}`}
              placeholder="Número do registro"
              value={formData.numeroRegistro}
              onChange={(e) => updateFormData('numeroRegistro', e.target.value)}
            />

            {/* UF */}
            <select
              className="input-field w-24 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.8rem_center] pr-10 cursor-pointer"
              value={formData.ufRegistro}
              onChange={(e) => updateFormData('ufRegistro', e.target.value)}
            >
              {UFS.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>

          {isDuplicate && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
              <AlertCircle className="w-4 h-4" />
              <span>Este {formData.tipoRegistro} já está cadastrado no sistema.</span>
            </div>
          )}

          {/* Linha 2: Botão Consultar */}
          <button
            type="button"
            onClick={handleConsultar}
            className="w-full px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold tracking-tight text-base rounded-2xl shadow-md border border-transparent hover:border-orange-500/50 hover:shadow-orange-500/20 flex items-center justify-center gap-3 transition-all duration-300 group"
          >
            <span>Consultar {formData.tipoRegistro} Online</span>
            <ExternalLink className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
