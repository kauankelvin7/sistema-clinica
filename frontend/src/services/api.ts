import axios from 'axios'
import type { FormData, Paciente, Medico } from '../types'

// Detecta ambiente automaticamente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface DocumentRequest {
  paciente: {
    nome: string
    tipo_documento: string
    numero_documento: string
    cargo: string
    empresa: string
  }
  atestado: {
    data_atestado: string
    dias_afastamento: number
    cid: string
    cid_nao_informado: boolean
  }
  medico: {
    nome: string
    tipo_registro: string
    numero_registro: string
    uf_registro: string
  }
}

// Gerar documento
export const generateDocument = async (formData: FormData, format: 'word' | 'pdf' | 'html' = 'word'): Promise<Blob> => {
  const request: DocumentRequest = {
    paciente: {
      nome: formData.nomePaciente,
      tipo_documento: formData.tipoDocumento,
      numero_documento: formData.numeroDocumento,
      cargo: formData.cargo,
      empresa: formData.empresa,
    },
    atestado: {
      data_atestado: formData.dataAtestado,
      dias_afastamento: parseInt(formData.diasAfastamento),
      cid: formData.cid,
      cid_nao_informado: formData.cidNaoInformado,
    },
    medico: {
      nome: formData.nomeMedico,
      tipo_registro: formData.tipoRegistro,
      numero_registro: formData.numeroRegistro,
      uf_registro: formData.ufRegistro,
    },
  }

  let endpoint: string
  if (format === 'pdf') {
    endpoint = '/api/generate-pdf'
  } else if (format === 'html') {
    endpoint = '/api/generate-html'
  } else {
    endpoint = '/api/generate-document'
  }
  
  const response = await api.post(endpoint, request, {
    responseType: 'blob',
  })

  return response.data
}

// Buscar pacientes
export const searchPatients = async (search?: string): Promise<Paciente[]> => {
  const response = await api.get('/api/patients', {
    params: { search },
  })
  return response.data
}

// Buscar médicos
export const searchDoctors = async (search?: string): Promise<Medico[]> => {
  const response = await api.get('/api/doctors', {
    params: { search },
  })
  return response.data
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/api/health')
  return response.data
}

export default api
