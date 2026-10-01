import axios from 'axios'
import type { Medico, Paciente } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
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

export interface DirectoryPayload {
  patients: Paciente[]
  doctors: Medico[]
  synced_at: string
}

export const fetchDirectory = async (): Promise<DirectoryPayload> => {
  const response = await api.get('/api/directory', { timeout: 6000 })
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
