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

export interface Paciente {
  id: number
  nome_completo: string
  tipo_doc: string
  numero_doc: string
  cargo: string
  empresa: string
}

export interface Medico {
  id: number
  nome_completo: string
  tipo_crm: string
  crm: string
  uf_crm: string
}

export interface PatientFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
  onLoadPatient?: (patient: Paciente) => void
}

export interface CertificateFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
}

export interface DoctorFormProps {
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | boolean) => void
  onLoadDoctor?: (doctor: Medico) => void
}

export interface ActionButtonsProps {
  onGenerateWord: () => void
  onGenerateHTML: () => void
  onClear: () => void
  loading?: 'word' | 'html' | false
}
