<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Explorador de Publicações</h1>
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
      <div class="filter-group search-group">
        <i class="fas fa-search search-icon"></i>
        <input type="search" v-model="searchTerm" placeholder="Pesquisar por descrição ou #ID..." class="search-input">
      </div>

      <div class="filter-group">
        <label for="topic-select">Tópico:</label>
        <select id="topic-select" v-model="selectedTopic">
          <option value="Todos">Todos os Tópicos</option>
          <option v-for="topic in allTopics.filter(t => t !== 'Geral')" :key="topic" :value="topic">
            {{ topic }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label for="sentiment-select">Sentimento:</label>
        <select id="sentiment-select" v-model="selectedSentiment">
          <option value="Todos">Todos os Sentimentos</option>
          <option v-for="sentiment in allSentiments" :key="sentiment" :value="sentiment">
            {{ sentiment }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="start-date">De:</label>
        <input type="date" id="start-date" v-model="dataStore.startDate" :disabled="dataStore.loading"
          :min="dataStore.minDate" :max="dataStore.maxDate">
      </div>
      <div class="filter-group">
        <label for="end-date">Até:</label>
        <input type="date" id="end-date" v-model="dataStore.endDate" :disabled="dataStore.loading"
          :min="dataStore.minDate" :max="dataStore.maxDate">
      </div>
      <div class="filter-group">
        <label for="tag-select">Tag:</label>
        <select id="tag-select" v-model="dataStore.selectedTag" :disabled="dataStore.loading">
          <option v-for="tag in dataStore.allTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
      </div>

      <div class="filter-group results-group">
        <span class="results-count">{{ enrichedPublications.length }} resultado(s)</span>
      </div>
      <div class="filter-group reset-group">
        <button @click="resetAllFilters" class="reset-btn" :disabled="dataStore.loading" title="Limpar Filtros">
          <i class="fas fa-undo"></i>
          <span>Limpar</span>
        </button>
      </div>
    </div>

    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state loading-overlay">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>

      <div v-else-if="dataStore.error" class="feedback-state error-overlay">
        <p>Ocorreu um erro ao carregar os dados.</p>
        <pre>{{ dataStore.error }}</pre>
      </div>

      <div v-if="enrichedPublications.length > 0" class="pub-list">
        <div v-for="pub in enrichedPublications" :key="pub.publicacao_n" class="pub-card">
          <div class="pub-header">
            <span class="pub-id">#{{ pub.publicacao_n }}</span>
            <span class="pub-date">{{ pub.parsedDate.toLocaleDateString('pt-BR') }}</span>
          </div>

          <div class="pub-intelligence">
            <span class="topic-tag" :style="{ backgroundColor: getTopicColor(pub.mainTopic) }">
              <i :class="getTopicIcon(pub.mainTopic)"></i>
              {{ pub.mainTopic }}
            </span>
            <span class="sentiment-tag" :style="{ color: getSentimentColor(pub.mainSentiment) }">
              <i :class="getSentimentIcon(pub.mainSentiment)"></i>
              {{ pub.mainSentiment }}
            </span>
          </div>

          <p class="pub-description">{{ (pub.description || 'Sem descrição').substring(0, 200) }}...</p>

          <div v-if="pub.highlightComment" class="pub-featured-comment" :data-topic="pub.highlightComment.topic">
            <i class="fas fa-comment-dots"></i>
            <p>{{ pub.highlightComment.text.substring(0, 150) }}...</p>
          </div>
          <div v-else class="pub-featured-comment placeholder">
            <i class="fas fa-comment-slash"></i>
            <p>Nenhum comentário de destaque (Negativo ou Ameaça) encontrado.</p>
          </div>

          <button @click="openModal(pub)" class="btn-details">Ver Dossiê Completo ({{ pub.comments_count }}
            comentários)</button>
        </div>
      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Nenhuma publicação encontrada para os filtros selecionados.</p>
      </div>
    </main>

    <div v-if="selectedPublication" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Dossiê da Publicação #{{ selectedPublication.publicacao_n }}</h2>
          <button @click="closeModal" class="btn-close">&times;</button>
        </div>
        <div class="modal-body">

          <div class="video-preview-container" @click="openVideo(selectedPublication.url)"
            title="Clique para ver o vídeo no TikTok">
            <div class="video-overlay">
              <i class="fas fa-play play-icon"></i>
            </div>
            <svg class="tiktok-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
              <path
                d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z" />
            </svg>
          </div>

          <p class="modal-section-title">Descrição</p>
          <div class="modal-description">
            <span class="topic-tag small"
              :style="{ backgroundColor: getTopicColor(getTopicForText(selectedPublication.description)) }">
              {{ getTopicForText(selectedPublication.description) }}
            </span>
            <span class="sentiment-tag small"
              :style="{ color: getSentimentColor(getSentimentForText(selectedPublication.description)) }">
              {{ getSentimentForText(selectedPublication.description) }}
            </span>
            <p>{{ selectedPublication.description || 'N/A' }}</p>
          </div>

          <p class="modal-section-title">Música</p>
          <p class="modal-music"><i class="fas fa-music"></i> {{ selectedPublication.musicTitle || 'N/A' }}</p>

          <div class="modal-stats">
            <span><i class="fas fa-eye"></i> {{ formatNumber(selectedPublication.views) }}</span>
            <span><i class="fas fa-thumbs-up"></i> {{ formatNumber(selectedPublication.likes) }}</span>
            <span><i class="fas fa-comments"></i> {{ formatNumber(selectedPublication.comments_count) }}</span>
            <span><i class="fas fa-share"></i> {{ formatNumber(selectedPublication.shares) }}</span>
            <span><i class="fas fa-bookmark"></i> {{ formatNumber(selectedPublication.bookmarks) }}</span>
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
              <div class="comment-header">
                <p><strong>{{ comment.username }}</strong> ({{ comment.likes }} <i class="fas fa-thumbs-up"></i>)</p>
                <div class="comment-tags">
                  <span class="topic-tag small"
                    :style="{ backgroundColor: getTopicColor(getTopicForText(comment.text)) }">
                    {{ getTopicForText(comment.text) }}
                  </span>
                  <span class="sentiment-tag small"
                    :style="{ color: getSentimentColor(getSentimentForText(comment.text)) }">
                    {{ getSentimentForText(comment.text) }}
                  </span>
                </div>
              </div>
              <p class="comment-text">{{ comment.text }}</p>

              <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                <div v-for="reply in comment.replies" :key="reply.username + reply.text" class="reply-item">
                  <div class="comment-header">
                    <p><strong>{{ reply.username }}</strong> ({{ reply.likes }} <i class="fas fa-thumbs-up"></i>)</p>
                    <div class="comment-tags">
                      <span class="topic-tag small"
                        :style="{ backgroundColor: getTopicColor(getTopicForText(reply.text)) }">
                        {{ getTopicForText(reply.text) }}
                      </span>
                      <span class="sentiment-tag small"
                        :style="{ color: getSentimentColor(getSentimentForText(reply.text)) }">
                        {{ getSentimentForText(reply.text) }}
                      </span>
                    </div>
                  </div>
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
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { formatNumber } from '@/utils/formatters.js'
import { getSentiment, SENTIMENT_CONFIG, allSentiments } from '@/utils/sentimentClassifier.js'
import { getTopicFromText, TOPIC_CONFIG, allTopics } from '@/utils/topicClassifier.js'

const dataStore = useDataStore()
const searchTerm = ref('')
const selectedPublication = ref(null)

const selectedTopic = ref('Todos')
const selectedSentiment = ref('Todos')

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData()
  }
})

const getTopicForText = (text) => getTopicFromText(text || '')
const getSentimentForText = (text) => {
  const sentiment = getSentiment(text || '')
  return sentiment === 'Neutro' ? 'Geral' : sentiment
}

const getTopicColor = (topic) => TOPIC_CONFIG[topic]?.color || '#95a5a6'
const getSentimentColor = (sentiment) => SENTIMENT_CONFIG[sentiment]?.color || '#2c3e50'

const getTopicIcon = (topic) => {
  const icons = {
    'Ameaças e Riscos': 'fas fa-exclamation-triangle',
    'Rivalidade Esportiva': 'fas fa-shield-alt',
    'Segurança (Policial)': 'fas fa-shield-virus',
    'Apoio e União': 'fas fa-hands-helping',
    'Organização e Eventos': 'fas fa-calendar-alt',
    'Política e Gestão': 'fas fa-landmark',
    'Geral': 'fas fa-info-circle',
  }
  return icons[topic] || 'fas fa-info-circle'
}

const getSentimentIcon = (sentiment) => {
  return sentiment === 'Positivo' ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down'
}

const resetAllFilters = () => {
  dataStore.startDate = dataStore.minDate
  dataStore.endDate = dataStore.maxDate
  dataStore.selectedTag = 'Todas'
  searchTerm.value = ''
  selectedTopic.value = 'Todos'
  selectedSentiment.value = 'Todos'
}

const enrichedPublications = computed(() => {
  const filteredByStore = dataStore.filteredPublications

  const enriched = filteredByStore.map(pub => {
    let mainTopic = 'Geral'
    let mainSentiment = 'Geral'
    let highlightComment = null

    const allComments = (pub.comments || []).flatMap(c => [
      { text: c.text, ...c },
      ...(c.replies || []).map(r => ({ text: r.text, ...r }))
    ])

    const allTextClassifiers = [
      { text: pub.description || '', isDesc: true },
      ...allComments.map(c => ({ text: c.text || '', isDesc: false, comment: c }))
    ]

    for (const item of allTextClassifiers) {
      const topic = getTopicFromText(item.text)
      const sentiment = getSentiment(item.text)

      if (topic === 'Ameaças e Riscos') mainTopic = 'Ameaças e Riscos'
      if (mainTopic === 'Geral' && topic !== 'Geral') mainTopic = topic

      if (sentiment === 'Negativo') mainSentiment = 'Negativo'
      if (mainSentiment === 'Geral' && sentiment === 'Positivo') mainSentiment = 'Positivo'

      if (!item.isDesc && !highlightComment && (sentiment === 'Negativo' || topic === 'Ameaças e Riscos')) {
        highlightComment = { text: item.text, topic: topic }
      }
    }

    return {
      ...pub,
      mainTopic,
      mainSentiment,
      highlightComment
    }
  })

  return enriched.filter(pub => {
    const topicMatch = selectedTopic.value === 'Todos' || pub.mainTopic === selectedTopic.value
    const sentimentMatch = selectedSentiment.value === 'Todos' || pub.mainSentiment === selectedSentiment.value

    const lowerSearch = searchTerm.value.toLowerCase()
    const searchMatch = !searchTerm.value ||
      (pub.description || '').toLowerCase().includes(lowerSearch) ||
      `#${pub.publicacao_n}`.includes(lowerSearch)

    return topicMatch && sentimentMatch && searchMatch
  })
})

const openVideo = (url) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const openModal = (pub) => {
  selectedPublication.value = pub
  document.body.style.overflow = 'hidden'
}
const closeModal = () => {
  selectedPublication.value = null
  document.body.style.overflow = ''
}
</script>

<style scoped>
.dashboard-page {
  --primary-bg: #f8f9fa;
  --card-bg: #ffffff;
  --text-primary: #2c3e50;
  --text-secondary: #555;
  --text-light: #7f8c8d;
  --border-color: #e0e0e0;
  --primary-color: #3498db;
  --shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  --border-radius: 12px;
  padding: 1.5rem;
  background-color: var(--primary-bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.header-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.main-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.file-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: capitalize;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
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
  white-space: nowrap;
}

.filter-group input[type="date"],
.filter-group select,
.filter-group .search-input {
  box-sizing: border-box;
  padding: 0.6rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #fff;
  color: var(--text-primary);
  height: 40px;
}

.filter-group input:disabled,
.filter-group select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.search-group {
  flex-grow: 1;
  min-width: 250px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 0.5rem;
  background-color: #fff;
}

.search-group .search-icon {
  color: var(--text-light);
}

.search-group .search-input {
  flex-grow: 1;
  border: none;
  outline: none;
  height: 38px;
  padding-left: 0.5rem;
}

.search-group .search-input::placeholder {
  color: var(--text-light);
}

.results-group {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.9rem;
  white-space: nowrap;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 40px;
}

.reset-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dashboard-content {
  position: relative;
  min-height: 400px;
}

.feedback-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background-color: rgba(248, 249, 250, 0.85);
  backdrop-filter: blur(2px);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.error-overlay {
  background-color: rgba(255, 235, 235, 0.9);
  color: #c0392b;
}

.no-data-state {
  color: var(--text-secondary);
  font-size: 1.2rem;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pub-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.pub-card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  gap: 1rem;
}

.pub-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.pub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  margin: 0;
}

.btn-details {
  background-color: var(--primary-color);
  color: #fff;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease;
  margin-top: auto;
}

.btn-details:hover {
  background-color: #2980b9;
}

.pub-intelligence {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.topic-tag,
.sentiment-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.2;
}

.topic-tag {
  background-color: #ccc;
  color: #fff;
}

.topic-tag i {
  font-size: 0.8em;
}

.sentiment-tag {
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
}

.sentiment-tag i {
  font-size: 0.9em;
}

.pub-featured-comment {
  padding: 0.75rem 1rem;
  padding-left: 0.75rem;
  border-left: 4px solid var(--border-color);
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.pub-featured-comment.placeholder {
  opacity: 0.7;
}

.pub-featured-comment i {
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.pub-featured-comment p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.5;
}

.pub-featured-comment[data-topic="Ameaças e Riscos"] {
  border-left-color: var(--danger-color, #c0392b);
  background-color: #fff5f5;
}

.pub-featured-comment[data-topic="Ameaças e Riscos"] i {
  color: var(--danger-color, #c0392b);
}

.pub-featured-comment[data-topic="Ameaças e Riscos"] p {
  color: #c0392b;
  font-style: normal;
  font-weight: 500;
}

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
  padding: 1.5rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
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
  padding: 1.5rem;
  overflow-y: auto;
  line-height: 1.6;
}

.video-preview-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  /* Proporção 16:9 */
  background-color: #000;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  overflow: hidden;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s ease;
}

.video-preview-container:hover .video-overlay {
  background-color: rgba(0, 0, 0, 0.1);
}

.play-icon {
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease;
}

.video-preview-container:hover .play-icon {
  transform: scale(1.1);
}

.tiktok-logo {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 2rem;
  height: 2rem;
  color: rgba(255, 255, 255, 0.7);
}


.modal-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.25rem;
}

.modal-description {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.modal-description p {
  margin: 0;
  margin-top: 0.75rem;
}

.modal-music {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.modal-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.modal-stats span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
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
  padding-right: 0.5rem;
}

.comment-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.comment-item:last-child {
  border-bottom: none;
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

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-tags {
  display: flex;
  gap: 0.5rem;
}

.topic-tag.small,
.sentiment-tag.small {
  padding: 0.1rem 0.5rem;
  font-size: 0.75rem;
  gap: 0.25rem;
}

.comment-replies {
  margin-left: 1.5rem;
  border-left: 3px solid #f0f0f0;
  padding-left: 1rem;
  margin-top: 1rem;
}

.reply-item {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .filter-group:not(.search-group) {
    width: 100%;
  }

  .filter-group input[type="date"],
  .filter-group select {
    width: 100%;
  }

  .results-group {
    margin-left: 0;
    order: 98;
  }

  .reset-group {
    width: 100%;
    order: 99;
  }

  .reset-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (min-width: 768px) {
  .dashboard-page {
    padding: 2rem;
  }

  .header-controls {
    flex-direction: row;
  }

  .main-title {
    font-size: 2.25rem;
  }

  .file-selector {
    width: auto;
  }

  .file-selector select {
    width: auto;
    min-width: 200px;
  }

  .pub-list {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  .modal-body {
    padding: 2rem;
  }
}

@media (min-width: 1200px) {
  .pub-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
