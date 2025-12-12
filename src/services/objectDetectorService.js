import { api } from './api'

/**
 * Service para comunicação com a API de Object Detector
 */
export const objectDetectorService = {
  /**
   * Envia uma imagem para detecção de objetos
   * @param {FormData} formData - FormData contendo a imagem e parâmetros
   * @returns {Promise<Object>} Resultado da detecção
   */
  async predict(formData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/object-detector/predict`, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type, o browser vai definir automaticamente com boundary
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Erro ao processar imagem' }))
        throw new Error(error.detail || error.message || 'Erro ao processar imagem')
      }

      return await response.json()
    } catch (error) {
      console.error('Error in objectDetectorService.predict:', error)
      throw error
    }
  },

  /**
   * Obtém o status de uma detecção assíncrona
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Object>} Status da tarefa
   */
  async getStatus(taskId) {
    return api.get(`/object-detector/status/${taskId}`)
  },

  /**
   * Obtém os resultados de uma detecção assíncrona
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Object>} Resultados da detecção
   */
  async getResults(taskId) {
    return api.get(`/object-detector/results/${taskId}`)
  },

  /**
   * Obtém a imagem anotada
   * @param {string} imagePath - Caminho da imagem anotada
   * @returns {Promise<string>} URL da imagem (data URL ou blob URL)
   */
  async getAnnotatedImage(imagePath) {
    try {
      // Se o path já é uma URL completa, retorna diretamente
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
        return imagePath
      }

      // Extrai apenas o nome do arquivo do path
      const fileName = imagePath.split('/').pop().split('\\').pop()
      
      // Caso contrário, tenta buscar do backend
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/object-detector/image/${encodeURIComponent(fileName)}`,
        {
          method: 'GET',
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar imagem anotada')
      }

      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Error loading annotated image:', error)
      // Retorna o path original como fallback
      return imagePath
    }
  },
}

