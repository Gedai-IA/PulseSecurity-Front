<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="../img/pulseSecurity.png" alt="PulseSecurity Logo" class="logo" />
    </div>

    <nav class="sidebar-nav">
      <a href="#" class="nav-item">
        <i class="fas fa-comment-dots"></i>
        <span>Opiniões</span>
      </a>

      <a href="#" class="nav-item">
        <i class="fas fa-face-smile"></i>
        <span>Emoções</span>
      </a>

      <a href="#" class="nav-item">
        <i class="fas fa-layer-group"></i>
        <span>Tópicos</span>
      </a>

      <a href="#" class="nav-item">
        <i class="fas fa-chart-line"></i>
        <span>Tendências</span>
      </a>

      <a href="#" class="nav-item">
        <i class="fas fa-clipboard-list"></i>
        <span>Resumo</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-profile">
        <i class="fas fa-user-circle user-icon"></i>
        <span class="user-name">Nome do usuário</span>
      </div>
      <div class="user-actions">
        <a href="#">
          <i class="fas fa-id-badge"></i>
          Perfil
        </a>
        <a href="#">
          <i class="fas fa-sign-out-alt"></i>
          Sair
        </a>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.logo {
  height: 40px;
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
}

.nav-item:hover {
  background-color: #f0f0f0;
}

.nav-item i {
  font-size: 1.3rem;
  color: #555;
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

.user-actions a {
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
</style>
