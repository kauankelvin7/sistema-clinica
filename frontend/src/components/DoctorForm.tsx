import { useUiCopy } from '../utils/uiCopy'
import { AlertCircle, ChevronDown, ExternalLink, Eye, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'
import { normalizeText } from '../utils/normalize'
import type { DoctorFormProps } from '../types'
import { useTranslation } from '../utils/i18n'
import AutocompleteInput from './AutocompleteInput'
import ConsultaOnlineModal from './ConsultaOnlineModal'
import DoctorsListModal from './DoctorsListModal'
import Field from './Field'

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function normalizeRegister(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}

export default function DoctorForm({ formData, updateFormData, doctors, onLoadDoctor }: DoctorFormProps) {
  const c = useUiCopy()
  const { t } = useTranslation()
  const [showListModal, setShowListModal] = useState(false)
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false)

  const doctorOptions = useMemo(() => doctors.map((doctor) => ({
    label: doctor.nome_completo,
    value: doctor.nome_completo,
    data: doctor,
  })), [doctors])

  // The same registration number in a different UF is not the same identity.
  const conflictingDoctor = useMemo(() => {
    const register = normalizeRegister(formData.numeroRegistro)
    if (register.length < 4) return false
    const matching = doctors.filter((doctor) =>
      doctor.tipo_crm === formData.tipoRegistro &&
      doctor.uf_crm === formData.ufRegistro &&
      normalizeRegister(doctor.crm) === register
    )
    if (!matching.length) return false
    const name = normalizeText(formData.nomeMedico.trim())
    return Boolean(name) && !matching.some((doctor) =>
      normalizeText(doctor.nome_completo.trim()) === name
    )
  }, [doctors, formData.numeroRegistro, formData.tipoRegistro, formData.ufRegistro, formData.nomeMedico])

  return (
    <div className="relative space-y-4">
      <DoctorsListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        onSelect={onLoadDoctor}
        doctors={doctors}
      />

      <ConsultaOnlineModal
        isOpen={isConsultaModalOpen}
        onClose={() => setIsConsultaModalOpen(false)}
        tipoRegistro={formData.tipoRegistro}
      />

      <button type="button" onClick={() => setShowListModal(true)} className="record-picker group">
        <div className="flex w-full items-center gap-3">
          <div className="record-picker__icon"><Stethoscope className="h-4 w-4" aria-hidden="true" /></div>
          <div className="min-w-0 flex-1 text-left">
            <p className="record-picker__eyebrow">{t.searchDoctorsBtn}</p>
            <p className="record-picker__value">
              {doctors.length > 0 ? `${doctors.length} ${t.modalDoctorsTitle}` : c.waiting}
            </p>
          </div>
          <Eye className="h-4 w-4 shrink-0 text-zinc-400 transition-colors group-hover:text-garnet-500" aria-hidden="true" />
        </div>
      </button>

      <Field id="doctor-name" label={t.doctorNameLabel} hint={doctors.length > 0 ? c.localSearch : undefined}>
        <AutocompleteInput
          id="doctor-name"
          value={formData.nomeMedico}
          onChange={(value) => updateFormData('nomeMedico', value)}
          onSelect={(option) => option.data && onLoadDoctor(option.data)}
          autoSelectUnique
          canAutoSelect={(option) => {
            const doctor = option.data
            if (!doctor) return false
            // Multiple councils/states may share registration numbers.
            if (!formData.numeroRegistro.trim()) return true
            return doctor.tipo_crm === formData.tipoRegistro &&
              doctor.uf_crm === formData.ufRegistro &&
              normalizeRegister(doctor.crm) === normalizeRegister(formData.numeroRegistro)
          }}
          options={doctorOptions}
          placeholder={t.doctorNamePlaceholder}
          minChars={2}
        />
      </Field>

      <Field id="doctor-register-number" label={t.regNumberLabel}>

        <div className="grid grid-cols-[80px_minmax(0,1fr)_70px] gap-2 sm:grid-cols-[92px_minmax(0,1fr)_82px]">
          <div className="select-shell">
            <select
              id="doctor-register-type"
              className="input-field appearance-none pr-8"
              aria-label={`${t.regNumberLabel} - ${c.type}`}
              value={formData.tipoRegistro}
              onChange={(event) => updateFormData('tipoRegistro', event.target.value)}
            >
              <option value="CRM">CRM</option>
              <option value="CRO">CRO</option>
              <option value="RMS">RMS</option>
            </select>
            <ChevronDown className="select-shell__icon" aria-hidden="true" />
          </div>

          <input
            id="doctor-register-number"
            type="text"
            className={`input-field ${conflictingDoctor ? 'border-amber-500/80 bg-amber-500/5 focus:border-amber-500' : ''}`}
            placeholder={t.regNumberPlaceholder}
            value={formData.numeroRegistro}
            onChange={(event) => updateFormData('numeroRegistro', event.target.value)}
            autoComplete="off"
          />

          <div className="select-shell">
            <select
              id="doctor-register-state"
              className="input-field appearance-none pr-8"
              aria-label={`${t.regNumberLabel} - UF`}
              value={formData.ufRegistro}
              onChange={(event) => updateFormData('ufRegistro', event.target.value)}
            >
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
            <ChevronDown className="select-shell__icon" aria-hidden="true" />
          </div>
        </div>

        {conflictingDoctor && (
          <div className="field-warning">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{c.doctorMismatch}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsConsultaModalOpen(true)}
          className="btn-tertiary mt-2.5 w-full"
        >
          <span>{t.consultRegister} {formData.tipoRegistro}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </Field>
    </div>
  )
}
