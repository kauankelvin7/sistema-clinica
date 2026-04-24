import type { PatientFormProps } from '../types'
import { useState, useEffect } from 'react'
import { Users, Eye, AlertCircle } from 'lucide-react'
import { searchPatients, checkDuplicate } from '../services/api'
import PatientsListModal from './PatientsListModal'
import AutocompleteInput from './AutocompleteInput'

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
  const [showListModal, setShowListModal] = useState(false)
  const [pacientesOptions, setPacientesOptions] = useState<Array<{label: string, value: string, data: any}>>([])
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  useEffect(() => {
    // Buscar total de pacientes salvos e criar options para autocomplete
    searchPatients()
      .then(data => {
        setTotalPacientes(data.length)
        
        // Criar options para autocomplete
        const options = data.map((p: any) => ({
          label: p.nome_completo,
          value: p.nome_completo,
          data: p
        }))
        setPacientesOptions(options)
      })
      .catch(() => setTotalPacientes(0))
  }, [])

  // Verificar duplicatas quando o número do documento muda
  useEffect(() => {
    if (formData.numeroDocumento.length >= 11) {
      const timer = setTimeout(async () => {
        setCheckingDuplicate(true)
        const exists = await checkDuplicate('paciente', formData.numeroDocumento)
        setIsDuplicate(exists)
        setCheckingDuplicate(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsDuplicate(false)
    }
  }, [formData.numeroDocumento])

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
      {/* Modal de Listagem */}
      <PatientsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Contador de Pacientes Salvos - Clicável (Atualizado Tema Zinc/Laranja) */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] hover:border-orange-500/30 group transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Pacientes Cadastrados
            </p>
            <p className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight group-hover:text-orange-500 transition-colors">
              {totalPacientes}
            </p>
          </div>
          <Eye className="w-6 h-6 text-zinc-400 group-hover:text-orange-500 transition-colors duration-300" />
        </div>
      </button>

      {/* Nome Completo com Autocomplete */}
      <div>
        <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
          Nome Completo
        </label>
        <AutocompleteInput
          value={formData.nomePaciente}
          onChange={(value) => updateFormData('nomePaciente', value)}
          onSelect={(option: any) => {
            if (option.data) {
              updateFormData('nomePaciente', option.data.nome_completo)
              updateFormData('tipoDocumento', option.data.tipo_doc)
              updateFormData('numeroDocumento', option.data.numero_doc)
              updateFormData('cargo', option.data.cargo || '')
              updateFormData('empresa', option.data.empresa || '')
            }
          }}
          options={pacientesOptions}
          placeholder="Digite o nome completo do paciente"
          minChars={2}
        />
      </div>

      {/* Documento (CPF/RG) */}
      <div>
        <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
          Documento
        </label>
        <div className="flex gap-4">
          <select
            className="input-field w-32 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.8rem_center] pr-10 cursor-pointer"
            value={formData.tipoDocumento}
            onChange={handleTipoDocumentoChange}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
          <input
            type="text"
            className={`input-field flex-1 ${isDuplicate ? 'border-amber-500 bg-amber-500/5 focus:border-amber-600' : ''}`}
            placeholder={formData.tipoDocumento === 'CPF' ? '000.000.000-00' : 'Digite o RG'}
            value={formData.numeroDocumento}
            onChange={handleDocumentoChange}
            maxLength={formData.tipoDocumento === 'CPF' ? 14 : 20}
            inputMode={formData.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
          />
        </div>
        {isDuplicate && (
          <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span>Este {formData.tipoDocumento} já está cadastrado no sistema.</span>
          </div>
        )}
      </div>

      {/* Cargo e Empresa em linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
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
          <label className="block text-sm font-extrabold tracking-tight text-zinc-800 dark:text-zinc-200 mb-2">
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
