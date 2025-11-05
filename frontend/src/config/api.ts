// Configuração da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  baseURL: API_URL,
  
  // Endpoints
  endpoints: {
    pacientes: `${API_URL}/api/patients`,
    medicos: `${API_URL}/api/doctors`,
    gerarDocumento: `${API_URL}/api/generate-document`,
  }
}

export default api
