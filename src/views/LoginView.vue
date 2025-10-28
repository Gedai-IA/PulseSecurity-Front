<template>
  <div class="login-page">
    <Navbar />

    <div class="login-container">
      <div class="login-image">
        <img src="../img/img_Login.png" alt="Tecnologia" />
      </div>

      <div class="login-form">
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">Usuário</label>
            <input type="text" id="username" />
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-login">Entrar</button>
            <div class="links">
              <a href="#">Cadastrar</a>
              <a href="#">Recuperar Senha</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'

function handleLogin() {
  alert('Botão Entrar clicado!');
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.login-container {
  flex: 1;
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;

  /* --- Mobile (Padrão) --- */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem;
}

.login-image {
  flex: 1.5;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 450px;
}

.login-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.login-form {
  flex: 1;
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #f0f0f0;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  margin-top: 25px;

  /* --- Mobile (Padrão) --- */
  flex-direction: column-reverse;
  gap: 1.5rem;
}

.links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.links a {
  color: #555;
  text-decoration: none;
  font-size: 0.9rem;
}

.links a:hover {
  text-decoration: underline;
}

.btn-login {
  padding: 12px 30px;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.2s ease;

  /* --- Mobile (Padrão) --- */
  width: 100%;
}

.btn-login:hover {
  background-color: #d0d0d0;
}

/* --- Desktop (min-width: 992px) --- */
@media (min-width: 992px) {
  .login-container {
    flex-direction: row;
    gap: 100px;
    padding: 40px;
  }

  .login-image {
    max-width: none;
  }

  .login-form {
    max-width: 350px;
    padding: 0;
    background: none;
    box-shadow: none;
  }

  .form-actions {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .links {
    justify-content: flex-start;
    gap: 15px;
  }

  .btn-login {
    width: auto;
  }
}
</style>
