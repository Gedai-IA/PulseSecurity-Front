// Configuração da API
export const API_CONFIG = {
  // URL base da API - pode ser sobrescrita por variável de ambiente
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  
  // Timeout para requisições (em ms)
  timeout: 30000,
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json',
  },
}

// Função helper para construir URLs
export function buildApiUrl(endpoint) {
  const base = API_CONFIG.baseURL.replace(/\/$/, '') // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

