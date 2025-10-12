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
.default-layout {
  display: flex;
  background-color: #f4f7fa;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

.top-bar {
  height: 60px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fff;
}

.main-content {
  flex: 1;
  padding: 20px;
}
</style>
