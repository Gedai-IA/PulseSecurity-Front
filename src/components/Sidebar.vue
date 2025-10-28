<template>
  <div>
    <button v-if="!isMobileMenuOpen" @click="toggleMenu" class="mobile-toggle-btn" aria-label="Abrir menu">
      <i class="fas fa-bars"></i>
    </button>

    <div v-if="isMobileMenuOpen" @click="toggleMenu" class="sidebar-overlay">
    </div>

    <aside class="sidebar" :class="{ 'is-open': isMobileMenuOpen }">

      <div class="sidebar-header-mobile">
        <RouterLink to="/" class="sidebar-logo-link" @click="toggleMenu">
          <img src="../img/pulseSecurity.png" alt="PulseSecurity Logo" class="logo" />
        </RouterLink>
        <button @click="toggleMenu" class="mobile-close-btn" aria-label="Fechar menu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <RouterLink to="/" class="sidebar-header-desktop">
        <img src="../img/pulseSecurity.png" alt="PulseSecurity Logo" class="logo" />
      </RouterLink>

      <nav class="sidebar-nav">
        <RouterLink to="/opinioes" class="nav-item" @click="toggleMenu">
          <i class="fas fa-comment-dots"></i>
          <span>Opiniões</span>
        </RouterLink>
        <RouterLink to="/emocoes" class="nav-item" @click="toggleMenu">
          <i class="fas fa-face-smile"></i>
          <span>Emoções</span>
        </RouterLink>
        <RouterLink to="/topicos" class="nav-item" @click="toggleMenu">
          <i class="fas fa-layer-group"></i>
          <span>Tópicos</span>
        </RouterLink>
        <RouterLink to="/tendencias" class="nav-item" @click="toggleMenu">
          <i class="fas fa-chart-line"></i>
          <span>Tendências</span>
        </RouterLink>
        <RouterLink to="/publicacoes" class="nav-item" @click="toggleMenu">
          <i class="fas fa-list-alt"></i>
          <span>Publicações</span>
        </RouterLink>
        <RouterLink to="/resumo" class="nav-item" @click="toggleMenu">
          <i class="fas fa-clipboard-list"></i>
          <span>Resumo</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile">
          <i class="fas fa-user-circle user-icon"></i>
          <span class="user-name">Nome do usuário</span>
        </div>
        <div class="user-actions">
          <RouterLink to="/profile">
            <i class="fas fa-id-badge"></i>
            Perfil
          </RouterLink>
          <RouterLink to="/login">
            <i class="fas fa-sign-out-alt"></i>
            Sair
          </RouterLink>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { ref } from 'vue';

const isMobileMenuOpen = ref(false);

const toggleMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
  overflow-y: auto;
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.sidebar.is-open {
  transform: translateX(0);
}

.mobile-toggle-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1001;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px 10px;
  font-size: 1.2rem;
  cursor: pointer;
  box-sizing: border-box;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar-header-desktop {
  display: none;
}

.sidebar-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.mobile-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #333;
  cursor: pointer;
  padding: 0;
}

.logo {
  height: 40px;
  display: block;
}

.sidebar-nav {
  flex-grow: 1;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  text-decoration: none;
  color: #333;
  font-size: 1.1rem;
  font-weight: 500;
  gap: 15px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.nav-item:hover {
  background-color: #f5f5f5;
}

.nav-item.router-link-active {
  background-color: #f0f0f0;
  color: #2c3e50;
  font-weight: 600;
}

.nav-item i {
  font-size: 1.3rem;
  color: #555;
  transition: color 0.2s ease;
}

.nav-item.router-link-active i {
  color: #2c3e50;
}

.sidebar-footer {
  padding: 20px;
  background-color: #f0f0f0;
  text-align: center;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.user-icon {
  font-size: 2rem;
  color: #555;
}

.user-name {
  font-weight: bold;
  margin-top: 10px;
}

.user-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.user-actions a,
.user-actions a:visited {
  color: #555;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.95rem;
}

.user-actions a i {
  font-size: 1rem;
}

@media (min-width: 768px) {

  .sidebar {
    position: sticky;
    top: 0;
    transform: translateX(0);
    z-index: auto;
    transition: none;
  }

  .mobile-toggle-btn,
  .sidebar-overlay,
  .sidebar-header-mobile {
    display: none;
  }

  .sidebar-header-desktop {
    display: block;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style>
