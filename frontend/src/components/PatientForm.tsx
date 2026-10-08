import { useUiCopy } from '../utils/uiCopy'
import { maskCPF } from '../utils/maskCPF'
import { AlertCircle, ChevronDown, Eye, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalizeText } from '../utils/normalize'
import type { PatientFormProps } from '../types'
import { useTranslation } from '../utils/i18n'
import AutocompleteInput from './AutocompleteInput'
import Field from './Field'
import PatientsListModal from './PatientsListModal'

function documentKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '')
}

export default function PatientForm({ formData, updateFormData, patients, onLoadPatient }: PatientFormProps) {
  const c = useUiCopy()
  const { t } = useTranslation()
  const [showListModal, setShowListModal] = useState(false)

  const patientOptions = useMemo(() => patients.map((patient) => ({
    label: patient.nome_completo,
    value: patient.nome_completo,
    data: patient,
  })), [patients])

  // Selecting an existing record is normal. Warn only on conflicting entered details.
  const conflictingPatient = useMemo(() => {
    const key = documentKey(formData.numeroDocumento)
    if (key.length < (formData.tipoDocumento === 'CPF' ? 11 : 3)) return false
    const matching = patients.filter((patient) =>
      patient.tipo_doc === formData.tipoDocumento && documentKey(patient.numero_doc) === key
    )
    if (matching.length === 0) return false
    const name = normalizeText(formData.nomePaciente.trim())
    const company = normalizeText(formData.empresa.trim())
    return !matching.some((patient) =>
      (!name || name === normalizeText(patient.nome_completo.trim())) &&
      (!company || company === normalizeText((patient.empresa || '').trim()))
    )
  }, [formData.tipoDocumento, formData.numeroDocumento, formData.nomePaciente, formData.empresa, patients])

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
        onSelect={onLoadPatient}
        patients={patients}
      />

      <button type="button" onClick={() => setShowListModal(true)} className="record-picker group">
        <div className="flex w-full items-center gap-3">
          <div className="record-picker__icon"><Users className="h-4 w-4" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1 text-left">
            <p className="record-picker__eyebrow">{t.searchPatientsBtn}</p>
            <p className="record-picker__value">
              {patients.length > 0 ? `${patients.length} ${t.modalPatientsTitle}` : c.waiting}
            </p>
          </div>
          <Eye className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-garnet-500" aria-hidden="true" />
        </div>
      </button>

      <Field id="patient-name" label={t.patientNameLabel} hint={patients.length > 0 ? c.localSearch : undefined}>
        <AutocompleteInput
            id="patient-name"
            value={formData.nomePaciente}
            onChange={(value) => updateFormData('nomePaciente', value)}
            onSelect={(option) => option.data && onLoadPatient(option.data)}
            options={patientOptions}
            placeholder={t.patientNamePlaceholder}
            minChars={2}
        />
      </Field>

      <Field id="patient-document" label={t.docNumberLabel}>
        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-2">
          <div className="select-shell">
            <select
              id="patient-document-type"
              className="input-field appearance-none pr-9"
              aria-label={`${t.docNumberLabel} - ${c.type}`}
              value={formData.tipoDocumento}
              onChange={handleTipoDocumentoChange}
            >
              <option value="CPF">CPF</option>
              <option value="RG">RG</option>
            </select>
            <ChevronDown className="select-shell__icon" aria-hidden="true" />
          </div>
          <input
            id="patient-document"
            type="text"
            className={`input-field ${conflictingPatient ? 'border-amber-500/80 bg-amber-500/5 focus:border-amber-500' : ''}`}
            placeholder={formData.tipoDocumento === 'CPF' ? t.docNumberPlaceholder : c.rg}
            value={formData.numeroDocumento}
            onChange={handleDocumentoChange}
            maxLength={formData.tipoDocumento === 'CPF' ? 14 : 20}
            inputMode={formData.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
            autoComplete="off"
          />
        </div>
        {conflictingPatient && (
          <div className="field-warning">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{c.patientMismatch}</span>
          </div>
        )}
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="patient-position" label={t.positionLabel}>
          <input
            id="patient-position"
            className="input-field"
            placeholder={t.positionPlaceholder}
            value={formData.cargo}
            onChange={(event) => updateFormData('cargo', event.target.value)}
          />
        </Field>
        <Field id="patient-company" label={t.companyLabel}>
          <input
            id="patient-company"
            className="input-field"
            placeholder={t.companyPlaceholder}
            value={formData.empresa}
            onChange={(event) => updateFormData('empresa', event.target.value)}
          />
        </Field>
      </div>
    </div>
  )
}
