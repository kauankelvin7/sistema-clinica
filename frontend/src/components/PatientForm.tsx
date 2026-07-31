import type { PatientFormProps } from '../types'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [isSearching, setIsSearching] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Buscar apenas o total de pacientes no mount (requisição leve: page_size=1)
  useEffect(() => {
    searchPatients(undefined, 1, 1)
      .then(data => setTotalPacientes(data.total))
      .catch(() => setTotalPacientes(0))
  }, [])

  // Busca assíncrona com debounce de 400ms acionada pelo AutocompleteInput
  const handlePatientSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setPacientesOptions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchPatients(query, 1, 20)
        const options = data.patients.map((p: any) => ({
          label: p.nome_completo,
          value: p.nome_completo,
          data: p,
        }))
        setPacientesOptions(options)
      } catch {
        setPacientesOptions([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [])

  // Verificar duplicatas quando o número do documento ou empresa muda
  useEffect(() => {
    if (formData.numeroDocumento.length >= 11) {
      const timer = setTimeout(async () => {
        const exists = await checkDuplicate('paciente', formData.numeroDocumento, formData.empresa)
        setIsDuplicate(exists)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsDuplicate(false)
    }
  }, [formData.numeroDocumento, formData.empresa])

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
      {/* Modal de Listagem */}
      <PatientsListModal isOpen={showListModal} onClose={() => setShowListModal(false)} />

      {/* Contador de Pacientes Salvos */}
      <button
        type="button"
        onClick={() => setShowListModal(true)}
        className="w-full bg-zinc-50 dark:bg-surface-input border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 hover:border-orange-500/30 group transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
              Pacientes Cadastrados
            </p>
            {totalPacientes > 0 ? (
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight group-hover:text-orange-500 transition-colors">
                {totalPacientes} paciente{totalPacientes > 1 ? 's' : ''} registrado{totalPacientes > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Nenhum paciente salvo na base • Clique para consultar
              </p>
            )}
          </div>
          <Eye className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Nome Completo com Autocomplete Assíncrono */}
      <div>
        <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
          Nome Completo
        </label>
        <AutocompleteInput
          value={formData.nomePaciente}
          onChange={(value) => updateFormData('nomePaciente', value)}
          onSearch={handlePatientSearch}
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
          isLoading={isSearching}
          placeholder="Digite o nome completo do paciente"
          minChars={2}
        />
      </div>

      {/* Documento (CPF/RG) */}
      <div>
        <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
          Documento
        </label>
        <div className="flex gap-2">
          <select
            className="input-field w-28 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.2em_1.2em] bg-no-repeat bg-[right_0.6rem_center] pr-8 cursor-pointer"
            value={formData.tipoDocumento}
            onChange={handleTipoDocumentoChange}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
          <input
            type="text"
            className={`input-field flex-1 ${isDuplicate ? 'border-amber-500/80 bg-amber-500/5 focus:border-amber-500' : ''}`}
            placeholder={formData.tipoDocumento === 'CPF' ? '000.000.000-00' : 'Digite o RG'}
            value={formData.numeroDocumento}
            onChange={handleDocumentoChange}
            maxLength={formData.tipoDocumento === 'CPF' ? 14 : 20}
            inputMode={formData.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
          />
        </div>
        {isDuplicate && (
          <div className="flex items-center gap-1.5 mt-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Este paciente já está cadastrado nesta empresa.</span>
          </div>
        )}
      </div>

      {/* Cargo e Empresa em linha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
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
          <label className="block text-[12px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
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
