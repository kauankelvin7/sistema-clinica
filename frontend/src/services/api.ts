import axios from 'axios'
import type { AppFormData, Medico, Paciente } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth_logout'))
    }
    return Promise.reject(error)
  }
)

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
    tipo_atestado?: string
  }
  medico: {
    nome: string
    tipo_registro: string
    numero_registro: string
    uf_registro: string
  }
}

export const generateDocument = async (
  formData: AppFormData,
  format: 'word' | 'pdf' | 'html' = 'word'
): Promise<Blob> => {
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
      dias_afastamento:
        formData.tipoAtestado === 'fisico'
          ? 0
          : parseInt(formData.diasAfastamento, 10) || 0,
      cid: formData.tipoAtestado === 'fisico' ? '' : formData.cid,
      cid_nao_informado:
        formData.tipoAtestado === 'fisico' ? true : formData.cidNaoInformado,
      tipo_atestado: formData.tipoAtestado,
    },
    medico: {
      nome: formData.nomeMedico,
      tipo_registro: formData.tipoRegistro,
      numero_registro: formData.numeroRegistro,
      uf_registro: formData.ufRegistro,
    },
  }

  const endpoint =
    format === 'pdf'
      ? '/api/generate-pdf'
      : format === 'html'
        ? '/api/generate-html'
        : '/api/generate-document'

  const response = await api.post(endpoint, request, {
    responseType: 'blob',
  })

  return response.data
}

export interface PaginatedPatients {
  total: number
  page: number
  page_size: number
  patients: Paciente[]
}

export const searchPatients = async (
  search?: string,
  page = 1,
  page_size?: number
): Promise<PaginatedPatients> => {
  const response = await api.get('/api/patients', {
    params: { search, page, page_size },
  })
  return response.data
}

export interface PaginatedDoctors {
  total: number
  page: number
  page_size: number
  doctors: Medico[]
}

export const searchDoctors = async (
  search?: string,
  page = 1,
  page_size?: number
): Promise<PaginatedDoctors> => {
  const response = await api.get('/api/doctors', {
    params: { search, page, page_size },
  })

  if (Array.isArray(response.data)) {
    return {
      total: response.data.length,
      page: 1,
      page_size: response.data.length,
      doctors: response.data,
    }
  }

  return response.data
}

export const checkDuplicate = async (
  tipo: 'paciente' | 'medico',
  valor: string,
  empresa?: string
): Promise<boolean> => {
  try {
    const response = await api.get('/api/check-duplicate', {
      params: { tipo, valor, empresa },
    })
    return response.data.existe
  } catch {
    return false
  }
}

export const loginUser = async (
  username: string,
  password: string,
  rememberMe = false
): Promise<{ authenticated: boolean }> => {
  const response = await api.post('/api/auth/token', {
    username,
    password,
    remember_me: rememberMe,
  })
  return response.data
}

export const checkSession = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/auth/session')
    return response.data?.authenticated === true
  } catch {
    return false
  }
}

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/api/auth/logout')
  } catch {
    // O estado local é encerrado mesmo se a API estiver indisponível.
  }
}

export default api
