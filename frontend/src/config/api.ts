// Configuração da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  baseURL: API_URL,
  
  // Endpoints
  endpoints: {
    pacientes: `${API_URL}/pacientes/`,
    medicos: `${API_URL}/medicos/`,
    gerarDocumento: `${API_URL}/gerar-documento/`,
  }
}

export default api
