import { api } from './api'

/**
 * Serviço para interagir com a API de dashboard
 */
export const dashboardService = {
  /**
   * Obtém estatísticas do dashboard
   */
  async getStats(filters = {}) {
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
      params.tags = filters.tags
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

    const url = queryParams.toString() 
      ? `/dashboard/stats?${queryParams.toString()}`
      : '/dashboard/stats'
    
    return api.get(url)
  },
}

