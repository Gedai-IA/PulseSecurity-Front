<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Visualizador de Publicações</h1>
      <div class="file-selector">
        <label for="json-select">Fonte de Dados:</label>
        <select id="json-select" v-model="dataStore.selectedFile" @change="dataStore.loadData()"
          :disabled="dataStore.loading">
          <option v-for="file in dataStore.availableFiles" :key="file" :value="file">
            {{ file.replace('.json', '').replace('_', ' ') }}
          </option>
        </select>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-group">
        <label for="start-date">Data Início:</label>
        <input type="date" id="start-date" v-model="dataStore.startDate" :disabled="dataStore.loading"
          :min="dataStore.minDate" :max="dataStore.maxDate">
      </div>
      <div class="filter-group">
        <label for="end-date">Data Fim:</label>
        <input type="date" id="end-date" v-model="dataStore.endDate" :disabled="dataStore.loading"
          :min="dataStore.minDate" :max="dataStore.maxDate">
      </div>
      <div class="filter-group">
        <label for="tag-select">Filtrar por Tag:</label>
        <select id="tag-select" v-model="dataStore.selectedTag" :disabled="dataStore.loading">
          <option v-for="tag in dataStore.allTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
      </div>
    </div>

    <div class="local-search-bar">
      <i class="fas fa-search search-icon"></i>
      <input type="search" v-model="searchTerm" placeholder="Pesquisar por descrição..." class="search-input">
      <span class="results-count">{{ searchedPublications.length }} resultado(s)</span>
    </div>

    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>

      <div v-else-if="dataStore.error" class="feedback-state error">
        <p>Ocorreu um erro ao carregar os dados.</p>
        <pre>{{ dataStore.error }}</pre>
      </div>

      <div v-else-if="searchedPublications.length > 0" class="pub-list">
        <div v-for="pub in searchedPublications" :key="pub.publicacao_n" class="pub-card">
          <div class="pub-header">
            <span class="pub-id">#{{ pub.publicacao_n }}</span>
            <span class="pub-date">{{ pub.parsedDate.toLocaleDateString('pt-BR') }}</span>
          </div>
          <p class="pub-description">{{ (pub.description || 'Sem descrição').substring(0, 150) }}...</p>
          <div class="pub-stats">
            <span><i class="fas fa-eye"></i> {{ formatNumber(pub.views) }}</span>
            <span><i class="fas fa-thumbs-up"></i> {{ formatNumber(pub.likes) }}</span>
            <span><i class="fas fa-comments"></i> {{ formatNumber(pub.comments_count) }}</span>
            <span><i class="fas fa-share"></i> {{ formatNumber(pub.shares) }}</span>
          </div>
          <button @click="openModal(pub)" class="btn-details">Ver Detalhes</button>
        </div>
      </div>

      <div v-else class="feedback-state">
        <p>Nenhuma publicação encontrada para os filtros selecionados.</p>
      </div>
    </main>

    <div v-if="selectedPublication" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Detalhes da Publicação #{{ selectedPublication.publicacao_n }}</h2>
          <button @click="closeModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Link:</strong> <a :href="selectedPublication.url" target="_blank" rel="noopener noreferrer">{{
            selectedPublication.url }}</a></p>
          <p><strong>Descrição:</strong> {{ selectedPublication.description || 'N/A' }}</p>
          <p><strong>Música:</strong> {{ selectedPublication.musicTitle || 'N/A' }}</p>

          <div class="modal-stats">
            <span><i class="fas fa-eye"></i> {{ formatNumber(selectedPublication.views) }} Views</span>
            <span><i class="fas fa-thumbs-up"></i> {{ formatNumber(selectedPublication.likes) }} Likes</span>
            <span><i class="fas fa-comments"></i> {{ formatNumber(selectedPublication.comments_count) }}
              Comentários</span>
            <span><i class="fas fa-share"></i> {{ formatNumber(selectedPublication.shares) }} Compart.</span>
            <span><i class="fas fa-bookmark"></i> {{ formatNumber(selectedPublication.bookmarks) }} Salvos</span>
          </div>

          <div class="modal-tags">
            <strong>Tags:</strong>
            <span v-for="tag in selectedPublication.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <hr>
          <h3>Comentários ({{ selectedPublication.comments_count }})</h3>
          <div class="comment-list">
            <div v-for="comment in selectedPublication.comments" :key="comment.username + comment.text"
              class="comment-item">
              <p><strong>{{ comment.username }}</strong> ({{ comment.likes }} <i class="fas fa-thumbs-up"></i>)</p>
              <p class="comment-text">{{ comment.text }}</p>
              <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                <div v-for="reply in comment.replies" :key="reply.username + reply.text" class="reply-item">
                  <p><strong>{{ reply.username }}</strong> ({{ reply.likes }} <i class="fas fa-thumbs-up"></i>)</p>
                  <p class="comment-text">{{ reply.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();
const searchTerm = ref('');
const selectedPublication = ref(null);

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

// Filtra as publicações (já filtradas pela store) com base na pesquisa local
const searchedPublications = computed(() => {
  if (!searchTerm.value) {
    return dataStore.filteredPublications;
  }
  const lowerSearch = searchTerm.value.toLowerCase();
  return dataStore.filteredPublications.filter(pub =>
    (pub.description || '').toLowerCase().includes(lowerSearch) ||
    `#${pub.publicacao_n}` === lowerSearch
  );
});

// Funções do Modal
const openModal = (pub) => {
  selectedPublication.value = pub;
};
const closeModal = () => {
  selectedPublication.value = null;
};

// Formata números grandes (1000 -> 1k, 1500 -> 1.5k)
const formatNumber = (numStr) => {
  const num = Number(numStr) || 0;
  if (num < 1000) return num.toFixed(0);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
  return (num / 1000000).toFixed(1) + 'M';
};
</script>

<style scoped>
/* Estilos Padrão (copiados) */
:root {
  --primary-bg: #f8f9fa;
  --card-bg: #ffffff;
  --text-primary: #2c3e50;
  --text-secondary: #555;
  --border-color: #e0e0e0;
  --shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  --border-radius: 12px;
}

.dashboard-page {
  padding: 2rem;
  background-color: var(--primary-bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.header-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.main-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.file-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--card-bg);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.file-selector label {
  font-weight: 500;
  color: var(--text-secondary);
}

.file-selector select {
  padding: .6rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: #fff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: capitalize;
}

.filter-bar {
  display: flex;
  gap: 1.5rem;
  background-color: #fff;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.filter-group input[type="date"],
.filter-group select {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #fff;
  color: var(--text-primary);
}

.filter-group input:disabled,
.filter-group select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.feedback-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  color: var(--text-secondary);
  font-size: 1.2rem;
}

.feedback-state.error p {
  color: #c0392b;
}

.feedback-state pre {
  background-color: #fdd;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.8rem;
  max-width: 80%;
  overflow-x: auto;
  text-align: left;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Estilos da Barra de Pesquisa Local */
.local-search-bar {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 0.75rem 1.5rem;
  margin-bottom: 1.5rem;
}

.search-icon {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-right: 1rem;
}

.search-input {
  flex-grow: 1;
  border: none;
  outline: none;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: #aaa;
}

.results-count {
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Estilos da Lista de Publicações */
.pub-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.pub-card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pub-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.pub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pub-id {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.pub-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
  background-color: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.pub-description {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
  flex-grow: 1;
  margin-bottom: 1rem;
}

.pub-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.pub-stats span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-details {
  background-color: #3498db;
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease;
}

.btn-details:hover {
  background-color: #2980b9;
}

/* Estilos do Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background-color: #fff;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: 300;
  color: var(--text-secondary);
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  line-height: 1.6;
}

.modal-body p {
  margin-bottom: 1rem;
}

.modal-body a {
  color: #3498db;
  text-decoration: none;
  word-break: break-all;
}

.modal-body a:hover {
  text-decoration: underline;
}

.modal-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.modal-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background-color: #e0e0e0;
  color: #555;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  border-top: 1px solid var(--border-color);
  margin-top: 1rem;
  padding-top: 1rem;
}

.comment-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.comment-item p {
  margin: 0.25rem 0;
}

.comment-item strong {
  color: var(--text-primary);
}

.comment-text {
  color: var(--text-secondary);
}

.comment-replies {
  margin-left: 2rem;
  border-left: 3px solid #f0f0f0;
  padding-left: 1rem;
  margin-top: 0.5rem;
}

.reply-item {
  margin-top: 0.5rem;
}
</style>
