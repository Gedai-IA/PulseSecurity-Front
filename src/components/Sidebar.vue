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
        <RouterLink to="/" class="nav-item" @click="toggleMenu">
          <i class="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/opinioes" class="nav-item" @click="toggleMenu">
          <i class="fas fa-comment-dots"></i>
          <span>Opiniões</span>
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
        <RouterLink to="/object-detector" class="nav-item" @click="toggleMenu">
          <i class="fas fa-eye"></i>
          <span>Object Detector</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile">
          <i class="fas fa-user-circle user-icon"></i>
          <span class="user-name">{{ userDisplayName }}</span>
        </div>
        <button @click="handleLogout" class="footer-action" :title="'Sair'">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)

const userDisplayName = computed(() => {
  if (authStore.user) {
    return authStore.user.full_name || authStore.user.username || 'Usuário'
  }
  return 'Usuário'
})

const toggleMenu = () => {
  if (window.innerWidth < 768) {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'login' })
  toggleMenu()
}
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

  background-color: #ffffff;
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
  z-index: 900;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px 10px;
  font-size: 1.2rem;
  cursor: pointer;
  box-sizing: border-box;
  color: #1f2937;
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
  padding: 10px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  margin: 4px 10px;
  text-decoration: none;
  color: #374151;
  font-size: 1rem;
  font-weight: 500;
  gap: 15px;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-radius: 8px;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #111827;
}

/* CORREÇÃO 1: Link Ativo */
.nav-item.router-link-exact-active {
  /* CORREÇÃO 2: Azul mais forte */
  background-color: #dbeafe;
  color: #2563eb;
  font-weight: 600;
}

.nav-item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
  color: #6b7280;
  transition: color 0.2s ease;
}

.nav-item:hover i {
  color: #111827;
}

/* CORREÇÃO 1: Link Ativo (Ícone) */
.nav-item.router-link-exact-active i {
  /* CORREÇÃO 2: Azul mais forte */
  color: #2563eb;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.user-icon {
  font-size: 1.8rem;
  color: #4b5563;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-action {
  color: #6b7280;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s ease;
  padding: 5px;
  background: none;
  border: none;
  cursor: pointer;
}

.footer-action:hover {
  /* CORREÇÃO 2: Azul mais forte */
  color: #2563eb;
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
    text-align: center;
  }
}
</style>
