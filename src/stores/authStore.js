import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

  // Verifica se o token é válido (não é um token temporário de desenvolvimento)
  function isValidToken(tokenValue) {
    if (!tokenValue) return false
    // Tokens de desenvolvimento começam com "dev-token-"
    // Tokens JWT reais são strings longas com pontos
    return !tokenValue.startsWith('dev-token-') && tokenValue.includes('.')
  }

  // Limpa dados de autenticação inválidos
  function clearInvalidAuth() {
    if (token.value && !isValidToken(token.value)) {
      token.value = null
      user.value = null
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  // Limpa tokens inválidos ao inicializar
  clearInvalidAuth()

  const isAuthenticated = computed(() => {
    return !!token.value && isValidToken(token.value)
  })

  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  function setUser(userData) {
    user.value = userData
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('auth_user')
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    // Remove o token do cliente API
    import('@/services/api').then(({ api }) => {
      api.setAuthToken(null)
    })
  }

  // Inicializa o token no cliente API ao carregar (apenas se válido)
  if (token.value && isValidToken(token.value)) {
    import('@/services/api').then(({ api }) => {
      api.setAuthToken(token.value)
    })
  }

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    setUser,
    logout,
    clearInvalidAuth,
  }
})

