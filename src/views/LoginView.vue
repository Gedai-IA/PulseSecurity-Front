<template>
  <div class="login-page">
    <Navbar />

    <div class="login-container">
      <div class="login-image">
        <img src="../img/img_Login.png" alt="Tecnologia" />
      </div>

      <div class="login-form-wrapper">
        <form @submit.prevent="handleLogin" class="login-form">
          <h2>Bem-vindo</h2>
          <p class="subtitle">Insira as suas credenciais para aceder ao painel.</p>

          <div class="form-group">
            <label for="username">Usuário</label>
            <input type="text" id="username" placeholder="seu.usuario" />
          </div>
          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" placeholder="••••••••" />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-login">Entrar</button>
          </div>

          <div class="links">
            <a href="#">Cadastrar-se</a>
            <a href="#">Recuperar Senha</a>
          </div>
        </form>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue' // Importa o novo Footer

function handleLogin() {
  // A lógica de login real iria aqui
  console.log('Botão Entrar clicado!');
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

.login-image {
  flex: 1.2;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.login-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.login-form-wrapper {
  flex: 1;
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.login-form h2 {
  text-align: center;
  font-size: 1.75rem;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.login-form .subtitle {
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

.btn-login {
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

.btn-login:hover {
  background-color: #2980b9;
}

.links {
  display: flex;
  justify-content: space-between;
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

@media (min-width: 768px) {
  .login-container {
    flex-direction: row;
    gap: 3rem;
  }

  .login-image {
    max-width: none;
  }

  .login-form-wrapper {
    max-width: 420px;
  }
}

@media (min-width: 992px) {
  .login-container {
    gap: 4rem;
  }
}
</style>
