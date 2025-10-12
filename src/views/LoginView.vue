<template>
  <div class="login-page">
    <Navbar />

    <div class="login-container">
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
            <div class="links">
              <a href="#">Cadastrar</a>
              <a href="#">Recuperar Senha</a>
            </div>
            <button type="submit" class="btn-login">Entrar</button>
          </div>
        </form>
      </div>

      <div class="login-image">
        <img src="../img/img_Login.png" alt="Tecnologia" />
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
}

.login-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 100px;
  padding: 40px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.login-form {
  flex: 1;
  max-width: 350px;
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
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
}

.links a {
  margin-right: 15px;
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
}

.btn-login:hover {
  background-color: #d0d0d0;
}

.login-image {
  flex: 1.5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-image img {
  max-width: 100%;
  border-radius: 8px;
}
</style>
