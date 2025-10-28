<template>
  <div class="default-layout">
    <Sidebar />
    <div class="content-wrapper">
      <header class="top-bar">
      </header>
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
// import Footer from '@/components/Footer.vue' // <-- Removido import incorreto. Se precisar, importe do arquivo certo.

// É comum importar CSS global como Font Awesome em main.js ou App.vue
import '@fortawesome/fontawesome-free/css/all.min.css'
</script>

<style scoped>
/* Adiciona box-sizing para todos os elementos dentro do escopo */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.default-layout {
  display: flex;
  background-color: #f4f7fa;
  /* Fundo geral claro */
  min-height: 100vh;
  /* Garante altura mínima */
}

.content-wrapper {
  flex: 1;
  /* Ocupa o espaço restante */
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* Altura total da viewport */
  overflow-y: auto;
  /* Scroll apenas no conteúdo principal */
  min-width: 0;
  /* Previne overflow horizontal com conteúdo flex */
}

.top-bar {
  height: 60px;
  flex-shrink: 0;
  /* Impede que o header encolha */
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
  /* Fundo branco */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  /* Sombra sutil */
  z-index: 10;
  /* Garante que fique sobre o conteúdo se necessário */
  /* Adicione padding ou display: flex se precisar alinhar itens internos */
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  /* Ocupa o espaço restante verticalmente */
  padding: 24px;
  /* Padding ligeiramente aumentado */
  overflow-y: auto;
  /* Permite scroll se o conteúdo for maior */
}

/* Ajuste para telas menores (opcional) */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .top-bar {
    padding: 0 16px;
  }
}
</style>
