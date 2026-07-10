export interface AppFormData {
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
  tipoAtestado: 'saude' | 'fisico'
  
  // Médico
  nomeMedico: string
  tipoRegistro: 'CRM' | 'CRO' | 'RMS'
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
  formData: AppFormData
  updateFormData: (field: keyof AppFormData, value: string | boolean) => void
  onLoadPatient?: (patient: Paciente) => void
}

export interface CertificateFormProps {
  formData: AppFormData
  updateFormData: (field: keyof AppFormData, value: string | boolean) => void
}

export interface DoctorFormProps {
  formData: AppFormData
  updateFormData: (field: keyof AppFormData, value: string | boolean) => void
  onLoadDoctor?: (doctor: Medico) => void
}

export interface ActionButtonsProps {
  onGenerateWord: () => void
  onGenerateHTML: () => void
  onClear: () => void
  loading?: 'word' | 'html' | false
}
