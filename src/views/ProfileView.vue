<template>
  <div class="profile-page">
    <div class="profile-container">

      <header class="profile-header">
        <h2 class="profile-title">Perfil de Usuário</h2>
        <div class="actions">
          <button v-if="!isEditing" @click="toggleEdit" class="btn btn-primary">
            <i class="fas fa-pencil-alt"></i> Editar
          </button>
          <template v-else>
            <button @click="saveChanges" class="btn btn-success">
              <i class="fas fa-save"></i> Salvar
            </button>
            <button @click="cancelChanges" class="btn btn-secondary">
              <i class="fas fa-times"></i> Cancelar
            </button>
          </template>
        </div>
      </header>

      <div class="profile-photo-section">
        <img v-if="photoPreview" :src="photoPreview" alt="User Avatar" class="user-avatar-img" />
        <i v-else class="fas fa-user-circle user-avatar-icon"></i>
        <button @click="triggerFileUpload" class="change-photo-btn">Mudar Foto</button>
        <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept="image/*" />
      </div>

      <form class="profile-details" @submit.prevent="saveChanges">
        <div class="detail-item">
          <label for="name"><i class="fas fa-user"></i> Nome Completo</label>
          <span v-if="!isEditing">{{ user.name }}</span>
          <input v-else type="text" id="name" v-model="user.name" />
        </div>

        <div class="detail-item">
          <label for="company"><i class="fas fa-building"></i> Empresa</label>
          <span v-if="!isEditing">{{ user.company }}</span>
          <input v-else type="text" id="company" v-model="user.company" />
        </div>

        <div class="detail-item">
          <label for="email"><i class="fas fa-envelope"></i> Email</label>
          <span v-if="!isEditing">{{ user.email }}</span>
          <input v-else type="email" id="email" v-model="user.email" />
        </div>

        <div class="detail-item">
          <label><i class="fas fa-star"></i> Tipo de Assinatura</label>
          <span>{{ user.subscription }}</span>
          <a v-if="!isEditing" href="#" class="upgrade-link">Fazer Upgrade</a>
        </div>

        <div class="detail-item">
          <label><i class="fas fa-credit-card"></i> Meio de Pagamento</label>
          <span>{{ user.paymentMethod }}</span>
        </div>
      </form>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Footer from '@/components/Footer.vue';

const isEditing = ref(false);
const fileInput = ref(null);
const photoPreview = ref(null);

const user = ref({
  name: '',
  company: '',
  email: '',
  subscription: 'Básico',
  paymentMethod: 'Cartão de Crédito **** **** **** 1234',
});

let originalUser = {};

onMounted(() => {
  user.value = {
    name: 'John Doe',
    company: 'PulseSecurity Inc.',
    email: 'john.doe@example.com',
    subscription: 'Básico',
    paymentMethod: 'Cartão de Crédito **** **** **** 1234',
  };
});

function toggleEdit() {
  originalUser = { ...user.value };
  isEditing.value = true;
}

function saveChanges() {
  console.log('Salvando alterações:', user.value);
  isEditing.value = false;
  alert('Perfil atualizado com sucesso!');
}

function cancelChanges() {
  user.value = originalUser;
  isEditing.value = false;
}

function triggerFileUpload() {
  fileInput.value.click();
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
    console.log('Arquivo selecionado:', file.name);
  }
}
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100%;
}

.profile-container {
  max-width: 1100px;
  margin: 40px auto;
  padding: 30px 40px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eef2f7;
}

.profile-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.actions .btn {
  margin-left: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.profile-photo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.user-avatar-icon {
  font-size: 90px;
  color: #ccc;
}

.user-avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #eef2f7;
}

.change-photo-btn {
  margin-top: 15px;
  background: none;
  border: none;
  color: #007bff;
  font-weight: 600;
  cursor: pointer;
}

.profile-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px 40px;
  text-align: left;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-item span,
.detail-item input,
.upgrade-link {
  font-size: 1rem;
  color: #333;
}

.detail-item span {
  padding: 10px 0;
}

.detail-item input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9fafb;
  transition: border-color 0.2s;
}

.detail-item input:focus {
  outline: none;
  border-color: #007bff;
}

.upgrade-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}
</style>
