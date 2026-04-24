import axios from 'axios'
import type { FormData, Paciente, Medico } from '../types'

// Detecta ambiente automaticamente
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para deslogar em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token')
      // Pode adicionar window.location.reload() ou disparar evento se preferir
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
export interface PaginatedDoctors {
  total: number;
  page: number;
  page_size: number;
  doctors: Medico[];
}

export const searchDoctors = async (
  search?: string,
  page: number = 1,
  page_size?: number
): Promise<PaginatedDoctors> => {
  const response = await api.get('/api/doctors', {
    params: { search, page, page_size },
  });
  return response.data;
}

// Verificar duplicatas
export const checkDuplicate = async (tipo: 'paciente' | 'medico', valor: string): Promise<boolean> => {
  try {
    const response = await api.get('/api/check-duplicate', {
      params: { tipo, valor }
    })
    return response.data.existe
  } catch (error) {
    console.error('Erro ao verificar duplicata:', error)
    return false
  }
}

// Login
export const loginUser = async (username: string, password: string, rememberMe: boolean = false): Promise<{ access_token: string }> => {
  const response = await api.post('/api/auth/token', { username, password, remember_me: rememberMe })
  return response.data
}

export default api
