<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-brand">
        <p>Um produto da rede GEDAI</p>
        <img src="../img/logo_gedai.png" alt="Logo GEDAI" class="logo-gedai">
      </div>
      <div class="footer-copyright">
        <p>© {{ new Date().getFullYear() }} PulseSecurity. Todos os direitos reservados.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  width: 100%;
  background-color: #1f2937;
  color: #9ca3af;
  padding: 2rem 1.5rem;
  box-sizing: border-box;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-brand p {
  margin: 0;
  font-size: 0.9rem;
  color: #d1d5db;
  font-weight: 500;
}

.logo-gedai {
  height: 40px;
}

.footer-copyright {
  text-align: center;
}

.footer-copyright p {
  margin: 0;
  font-size: 0.85rem;
}

@media (min-width: 768px) {
  .footer-content {
    flex-direction: row;
    justify-content: space-between;
  }

  .footer-brand {
    flex-direction: row;
    gap: 15px;
  }

  .footer-brand p {
    order: 2;
  }

  .logo-gedai {
    order: 1;
  }

  .footer-copyright {
    text-align: right;
  }
}
</style>
