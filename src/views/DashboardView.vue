<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>Bem-vindo ao Dashboard</h1>
      <p>Este é o painel principal do sistema PulseSecurity.</p>
    </div>

    <div class="card-grid">
      <div class="card">
        <h3>Status do Sistema</h3>
        <p class="status-ok">● Online</p>
      </div>
      <div class="card">
        <h3>Usuários Ativos</h3>
        <p>1</p>
      </div>
      <div class="card">
        <h3>Alertas Recentes</h3>
        <p>0</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 40px;
  box-sizing: border-box;
}

.header {
  margin-bottom: 40px;
}

h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.card p {
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
}

.status-ok {
  color: #28a745;
}
</style>
