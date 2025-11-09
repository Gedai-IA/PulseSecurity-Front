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

import '@fortawesome/fontawesome-free/css/all.min.css'
</script>

<style scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

.default-layout {
  display: flex;
  background-color: #f4f7fa;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  min-width: 0;
}

.top-bar {
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .top-bar {
    padding: 0 16px;
  }
}
</style>
