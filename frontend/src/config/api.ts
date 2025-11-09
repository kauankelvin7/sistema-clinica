// Configuração da API
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app')

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
