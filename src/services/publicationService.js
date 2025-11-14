import { api } from './api'

/**
 * Serviço para interagir com a API de publicações
 */
export const publicationService = {
  /**
   * Lista publicações com filtros
   */
  async list(filters = {}) {
    const params = {}
    
    if (filters.startDate) {
      params.start_date = filters.startDate instanceof Date 
        ? filters.startDate.toISOString() 
        : filters.startDate
    }
    
    if (filters.endDate) {
      params.end_date = filters.endDate instanceof Date 
        ? filters.endDate.toISOString() 
        : filters.endDate
    }
    
    if (filters.tags && filters.tags.length > 0) {
      // FastAPI espera múltiplos parâmetros com o mesmo nome
      // Vamos passar como array e o cliente vai converter
      params.tags = filters.tags
    }
    
    if (filters.limit) {
      params.limit = filters.limit
    }
    
    if (filters.offset) {
      params.offset = filters.offset
    }

    // Converte array de tags em múltiplos parâmetros
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, v))
      } else {
        queryParams.append(key, value)
      }
    })

    const response = await api.get(`/publications?${queryParams.toString()}`)
    return response
  },

  /**
   * Busca publicações por texto
   */
  async search(query, limit = 100) {
    return api.get('/publications/search', { q: query, limit })
  },

  /**
   * Obtém uma publicação por ID
   */
  async getById(id) {
    return api.get(`/publications/${id}`)
  },

  /**
   * Cria uma nova publicação
   */
  async create(publication) {
    return api.post('/publications', publication)
  },
}

