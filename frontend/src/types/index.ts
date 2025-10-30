export interface FormData {
  // Paciente
  nomePaciente: string
  tipoDocumento: 'CPF' | 'RG'
  numeroDocumento: string
  cargo: string
  empresa: string
  
  // Atestado
  dataAtestado: string
  diasAfastamento: string
  cid: string
  cidNaoInformado: boolean
  
  // Médico
  nomeMedico: string
  tipoRegistro: 'CRM' | 'CRO' | 'RMs'
  numeroRegistro: string
  ufRegistro: string
}

export interface PatientFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
}

export interface CertificateFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
}

export interface DoctorFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
}

export interface ActionButtonsProps {
  onGenerate: () => void
  onClear: () => void
  loading?: boolean
}
