<template>
  <div class="register-page">
    <Navbar />

    <div class="register-container">
      <div class="register-image">
        <img src="../img/img_Login.png" alt="Tecnologia" />
      </div>

      <div class="register-form-wrapper">
        <form @submit.prevent="handleRegister" class="register-form">
          <h2>Criar Conta</h2>
          <p class="subtitle">Preencha os dados para criar sua conta.</p>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div v-if="success" class="success-message">
            {{ success }}
          </div>

          <div class="form-group">
            <label for="username">Usuário *</label>
            <input 
              type="text" 
              id="username" 
              v-model="formData.username"
              placeholder="seu.usuario" 
              :disabled="loading"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              type="email" 
              id="email" 
              v-model="formData.email"
              placeholder="seu@email.com" 
              :disabled="loading"
              required
            />
          </div>

          <div class="form-group">
            <label for="full_name">Nome Completo</label>
            <input 
              type="text" 
              id="full_name" 
              v-model="formData.full_name"
              placeholder="Seu Nome Completo" 
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha *</label>
            <input 
              type="password" 
              id="password" 
              v-model="formData.password"
              placeholder="••••••••" 
              :disabled="loading"
              required
              minlength="6"
            />
          </div>

          <div class="form-group">
            <label for="confirm_password">Confirmar Senha *</label>
            <input 
              type="password" 
              id="confirm_password" 
              v-model="formData.confirm_password"
              placeholder="••••••••" 
              :disabled="loading"
              required
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-register" :disabled="loading">
              {{ loading ? 'Criando conta...' : 'Criar Conta' }}
            </button>
          </div>

          <div class="links">
            <router-link to="/login">Já tem uma conta? Faça login</router-link>
          </div>
        </form>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'

const router = useRouter()

const formData = ref({
  username: '',
  email: '',
  full_name: '',
  password: '',
  confirm_password: ''
})

const error = ref('')
const success = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Validações
    if (!formData.value.username || !formData.value.email || !formData.value.password) {
      error.value = 'Por favor, preencha todos os campos obrigatórios'
      loading.value = false
      return
    }

    if (formData.value.password !== formData.value.confirm_password) {
      error.value = 'As senhas não coincidem'
      loading.value = false
      return
    }

    if (formData.value.password.length < 6) {
      error.value = 'A senha deve ter pelo menos 6 caracteres'
      loading.value = false
      return
    }

    // Chama a API de registro
    const { api } = await import('@/services/api')
    const response = await api.post('/api/v1/auth/register', {
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      full_name: formData.value.full_name || null
    })
    
    success.value = 'Conta criada com sucesso! Redirecionando para login...'
    
    // Aguarda um pouco e redireciona para login
    setTimeout(() => {
      router.push({ name: 'login' })
    }, 2000)
  } catch (err) {
    // Trata erros da API
    if (err.status === 400) {
      error.value = err.data?.detail || 'Dados inválidos. Verifique as informações.'
    } else if (err.status === 0) {
      error.value = 'Erro de conexão. Verifique se o backend está rodando.'
    } else {
      error.value = err.message || 'Erro ao criar conta. Tente novamente.'
    }
    console.error('Erro no registro:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.register-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1100px;
  margin: 2rem auto;
  gap: 2rem;
  padding: 1.5rem;
  box-sizing: border-box;
}

.register-image {
  flex: 1.2;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.register-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.register-form-wrapper {
  flex: 1;
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.register-form h2 {
  text-align: center;
  font-size: 1.75rem;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.register-form .subtitle {
  text-align: center;
  color: #555;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.form-actions {
  margin-top: 1.5rem;
}

.btn-register {
  width: 100%;
  padding: 12px 30px;
  background-color: #3498db;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.btn-register:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-register:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.links {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.links a {
  color: #3498db;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.links a:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #fcc;
}

.success-message {
  background-color: #efe;
  color: #3c3;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #cfc;
}

@media (min-width: 768px) {
  .register-container {
    flex-direction: row;
    gap: 3rem;
  }

  .register-image {
    max-width: none;
  }

  .register-form-wrapper {
    max-width: 420px;
  }
}

@media (min-width: 992px) {
  .register-container {
    gap: 4rem;
  }
}
</style>

