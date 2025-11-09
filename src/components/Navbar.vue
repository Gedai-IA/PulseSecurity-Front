<template>
  <header class="navbar">
    <RouterLink to="/" class="logo-link">
      <img src="../img/pulseSecurity.png" alt="PulseSecurity Logo" class="logo">
    </RouterLink>

    <nav>
      <RouterLink to="/login" class="login-button">Login</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.navbar {
  width: 100%;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.logo-link {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  display: block;
}

.login-button {
  padding: 10px 20px;
  background-color: #3498db;
  text-decoration: none;
  color: #ffffff;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  transition: background-color 0.2s ease;
}

.login-button:hover {
  background-color: #2980b9;
}

@media (min-width: 768px) {
  .navbar {
    padding: 20px 50px;
  }
}
</style>
