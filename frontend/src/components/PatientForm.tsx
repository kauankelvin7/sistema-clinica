import { AlertCircle, ChevronDown, Eye, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { checkDuplicate } from '../services/api'
import type { PatientFormProps } from '../types'
import { useTranslation } from '../utils/i18n'
import AutocompleteInput from './AutocompleteInput'
import PatientsListModal from './PatientsListModal'

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export default function PatientForm({ formData, updateFormData, patients }: PatientFormProps) {
  const { t } = useTranslation()
  const [showListModal, setShowListModal] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)

  const patientOptions = useMemo(() => patients.map((patient) => ({
    label: patient.nome_completo,
    value: patient.nome_completo,
    data: patient,
  })), [patients])

  useEffect(() => {
    const normalizedDocument = onlyDigits(formData.numeroDocumento)
    if (normalizedDocument.length < 11) {
      setIsDuplicate(false)
      return
    }

    const company = formData.empresa.trim().toLocaleLowerCase('pt-BR')
    const localMatch = patients.some((patient) =>
      onlyDigits(patient.numero_doc) === normalizedDocument &&
      (!company || patient.empresa.trim().toLocaleLowerCase('pt-BR') === company)
    )

    if (localMatch || patients.length > 0) {
      setIsDuplicate(localMatch)
      return
    }

    const timer = setTimeout(() => {
      void checkDuplicate('paciente', formData.numeroDocumento, formData.empresa)
        .then(setIsDuplicate)
        .catch(() => setIsDuplicate(false))
    }, 350)
    return () => clearTimeout(timer)
  }, [formData.numeroDocumento, formData.empresa, patients])

  const selectPatient = (patient: PatientFormProps['patients'][number]) => {
    updateFormData('nomePaciente', patient.nome_completo)
    updateFormData('tipoDocumento', patient.tipo_doc)
    updateFormData('numeroDocumento', patient.numero_doc)
    updateFormData('cargo', patient.cargo || '')
    updateFormData('empresa', patient.empresa || '')
  }

  const handleDocumentoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = formData.tipoDocumento === 'CPF'
      ? maskCPF(event.target.value)
      : event.target.value.slice(0, 20)
    updateFormData('numeroDocumento', nextValue)
  }

  const handleTipoDocumentoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as 'CPF' | 'RG'
    updateFormData('tipoDocumento', type)
    updateFormData(
      'numeroDocumento',
      type === 'CPF' ? maskCPF(formData.numeroDocumento) : formData.numeroDocumento.replace(/\D/g, '')
    )
  }

  return (
    <div className="space-y-4">
      <PatientsListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        onSelect={selectPatient}
        patients={patients}
      />

      <button type="button" onClick={() => setShowListModal(true)} className="record-picker group">
        <div className="flex w-full items-center gap-3">
          <div className="record-picker__icon"><Users className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1 text-left">
            <p className="record-picker__eyebrow">{t.searchPatientsBtn}</p>
            <p className="record-picker__value">
              {patients.length > 0 ? `${patients.length} ${t.modalPatientsTitle}` : 'Cache aguardando sincronização'}
            </p>
          </div>
          <Eye className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-garnet-500" />
        </div>
      </button>

      <div>
        <label className="field-label">{t.patientNameLabel}</label>
        <AutocompleteInput
          value={formData.nomePaciente}
          onChange={(value) => updateFormData('nomePaciente', value)}
          onSelect={(option) => option.data && selectPatient(option.data)}
          options={patientOptions}
          placeholder={t.patientNamePlaceholder}
          minChars={2}
        />
        {patients.length > 0 && (
          <p className="field-hint">Busca local instantânea · não aguarda o banco a cada tecla</p>
        )}
      </div>

      <div>
        <label className="field-label">{t.docNumberLabel}</label>
        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-2">
          <div className="select-shell">
            <select
              className="input-field appearance-none pr-9"
              value={formData.tipoDocumento}
              onChange={handleTipoDocumentoChange}
            >
              <option value="CPF">CPF</option>
              <option value="RG">RG</option>
            </select>
            <ChevronDown className="select-shell__icon" />
          </div>
          <input
            type="text"
            className={`input-field ${isDuplicate ? 'border-amber-500/80 bg-amber-500/5 focus:border-amber-500' : ''}`}
            placeholder={formData.tipoDocumento === 'CPF' ? t.docNumberPlaceholder : 'Número do RG'}
            value={formData.numeroDocumento}
            onChange={handleDocumentoChange}
            maxLength={formData.tipoDocumento === 'CPF' ? 14 : 20}
            inputMode={formData.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
            autoComplete="off"
          />
        </div>
        {isDuplicate && (
          <div className="field-warning">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Este paciente já está cadastrado nesta empresa.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label">{t.positionLabel}</label>
          <input
            className="input-field"
            placeholder={t.positionPlaceholder}
            value={formData.cargo}
            onChange={(event) => updateFormData('cargo', event.target.value)}
          />
        </div>
        <div>
          <label className="field-label">{t.companyLabel}</label>
          <input
            className="input-field"
            placeholder={t.companyPlaceholder}
            value={formData.empresa}
            onChange={(event) => updateFormData('empresa', event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
