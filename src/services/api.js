import { API_CONFIG, buildApiUrl } from '@/config/api'

/**
 * Cliente HTTP para comunicação com a API
 */
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.baseURL
    this.timeout = API_CONFIG.timeout
    this.headers = { ...API_CONFIG.headers }
  }

  /**
   * Adiciona token de autenticação (futuro)
   */
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`
    } else {
      delete this.headers['Authorization']
    }
  }

  /**
   * Faz uma requisição HTTP
   */
  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint)
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    }

    // Adiciona timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    config.signal = controller.signal

    try {
      const response = await fetch(url, config)
      clearTimeout(timeoutId)

      // Parse JSON se possível
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          data.detail || data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408)
      }
      
      throw new ApiError(
        error.message || 'Network error',
        0,
        error
      )
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

/**
 * Classe de erro customizada para a API
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Instância singleton do cliente
export const apiClient = new ApiClient()

// Exporta métodos convenientes
export const api = {
  get: (endpoint, params) => apiClient.get(endpoint, params),
  post: (endpoint, data) => apiClient.post(endpoint, data),
  put: (endpoint, data) => apiClient.put(endpoint, data),
  delete: (endpoint) => apiClient.delete(endpoint),
  setAuthToken: (token) => apiClient.setAuthToken(token),
}

