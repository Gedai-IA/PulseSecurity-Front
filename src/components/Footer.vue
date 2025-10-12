<template>
  <footer class="footer">
    <p>Um produto da rede GEDAI</p>
    <img src="../img/logo_gedai.png" alt="Logo GEDAI" class="logo-gedai">
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background-color: #fff;
  box-sizing: border-box;
}

.footer p {
  margin: 0;
  font-size: 0.9rem;
  color: #888;
}

.logo-gedai {
  height: 25px;
}
</style>
