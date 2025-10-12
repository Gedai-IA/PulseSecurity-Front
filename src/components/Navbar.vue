<template>
  <header class="navbar">
    <img src="../img/pulseSecurity.png" alt="PulseSecurity Logo" class="logo">
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
  padding: 20px 50px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  height: 40px;
}

.login-button {
  padding: 10px 20px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  text-decoration: none;
  color: #333;
  border-radius: 5px;
  font-weight: bold;
}

.login-button:hover {
  background-color: #e0e0e0;
}
</style>
