<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Análise Tópico-Sentimento</h1>
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
      <div class="filter-group reset-group">
        <button @click="resetAllFilters" class="reset-btn" :disabled="dataStore.loading">
          <i class="fas fa-undo"></i>
          <span>Limpar</span>
        </button>
      </div>
    </div>

    <div v-if="selectedTopic" class="active-filter-bar">
      <span>Filtrando por Tópico:</span>
      <span class="filter-tag" :style="{ backgroundColor: getTopicColor(selectedTopic) }">
        {{ selectedTopic }}
      </span>
      <button @click="resetTopicFilter" class="btn-clear-filter">
        &times; Limpar
      </button>
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

      <div v-else-if="processedData.length > 0" class="topics-grid">

        <div class="chart-card full-width">
          <h2 class="chart-title">Distribuição de Sentimento por Tópico (Clique para filtrar)</h2>
          <Bar :data="sentimentByTopicData" :options="groupedBarOptions" @click="handleBarClick" ref="barChartRef" />
        </div>

        <div class="chart-card">
          <h2 class="chart-title">
            {{ selectedTopic ? `Evolução de "${selectedTopic}"` : 'Evolução do Tópico (Selecione um tópico)' }}
          </h2>
          <Line v-if="selectedTopic" :data="topicEvolutionData" :options="lineOptions" />
          <div v-else class="placeholder-state">
            <i class="fas fa-chart-line"></i>
            <p>Clique num tópico no gráfico acima para ver a sua evolução.</p>
          </div>
        </div>

        <!-- NOVO GRÁFICO: DISTRIBUIÇÃO DE EMOÇÕES -->
        <div class="chart-card">
          <h2 class="chart-title">
            {{ selectedTopic ? `Distribuição de Emoções ("${selectedTopic}")` : 'Emoções no Tópico' }}
          </h2>
          <Bar v-if="selectedTopic" :data="emotionBreakdownData" :options="barOptions" />
          <div v-else class="placeholder-state">
            <i class="fas fa-smile-beam"></i>
            <p>Clique num tópico para ver a divisão de emoções (Raiva, Alegria, etc).</p>
          </div>
        </div>

        <div class="chart-card">
          <h2 class="chart-title">
            {{ selectedTopic ? `Nuvem de Palavras ("${selectedTopic}")` : 'Nuvem de Palavras' }}
          </h2>
          <div v-if="selectedTopic" class="word-cloud-container">
            <span v-if="wordCloudData.length === 0">Nenhuma palavra encontrada.</span>
            <span v-for="word in wordCloudData" :key="word.text" class="word-cloud-item"
              :style="{ fontSize: word.size + 'px', color: word.color, opacity: word.opacity, fontWeight: word.weight }">
              {{ word.text }}
            </span>
          </div>
          <div v-else class="placeholder-state">
            <i class="fas fa-cloud"></i>
            <p>Clique num tópico para ver as palavras-chave.</p>
          </div>
        </div>

        <!-- NOVO COMPONENTE: POSTS RELEVANTES -->
        <div class="chart-card list-card">
          <h2 class="chart-title">
            {{ selectedTopic ? `Posts Relevantes ("${selectedTopic}")` : 'Posts Relevantes' }}
          </h2>
          <div v-if="selectedTopic" class="posts-list-container">
            <ul v-if="topPostsData.length > 0" class="posts-list">
              <li v-for="item in topPostsData" :key="item.post.publicacao_n">
                <a :href="item.post.url" target="_blank" rel="noopener noreferrer" class="post-link">
                  <span class="post-id">#{{ item.post.publicacao_n }}</span>
                  <p class="post-description">{{ item.post.description.substring(0, 80) }}...</p>
                  <span class="post-count" :style="{ backgroundColor: getTopicColor(selectedTopic) }">
                    <i class="fas fa-comments"></i> {{ item.count }} menções
                  </span>
                </a>
              </li>
            </ul>
            <span v-else class="no-data-state">Nenhum post encontrado.</span>
          </div>
          <div v-else class="placeholder-state">
            <i class="fas fa-list-ol"></i>
            <p>Clique num tópico para ver os posts com mais menções.</p>
          </div>
        </div>

      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Nenhum dado encontrado para os filtros selecionados.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { Line, Bar } from 'vue-chartjs'
import { getElementAtEvent } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip as ChartJSTooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import { formatNumber } from '@/utils/formatters.js' // Importar formatNumber
import { getTopicFromText, TOPIC_CONFIG, allTopics } from '@/utils/topicClassifier.js'
import { getSentiment, SENTIMENT_CONFIG, allSentiments } from '@/utils/sentimentClassifier.js'
import { getEmotion, EMOTION_CONFIG, allEmotions } from '@/utils/emotionClassifier.js' // NOVO: Importar emoções
import { STOPWORDS_PT } from '@/utils/stopwords.js'

ChartJS.register(Title, ChartJSTooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler)

const dataStore = useDataStore()
const barChartRef = ref(null)
const selectedTopic = ref(null)

const getTopicColor = (topicName) => {
  return TOPIC_CONFIG[topicName]?.color || '#95a5a6'
}

const processedData = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])])
    allPostComments.push({ text: post.description })
    const date = post.parsedDate
    if (!date) return []

    return allPostComments.map(comment => {
      const text = `${comment.text || ''}`
      const fullText = `${post.description || ''} ${text}`
      return {
        postRef: post, // NOVO: Guardar referência ao post original
        date: date.toISOString().split('T')[0],
        text: text,
        fullText: fullText,
        topic: getTopicFromText(fullText),
        sentiment: getSentiment(text),
        emotion: getEmotion(text) // NOVO: Classificar emoção
      }
    })
  })
})

const filteredData = computed(() => {
  if (!selectedTopic.value) {
    return processedData.value
  }
  return processedData.value.filter(p => p.topic === selectedTopic.value)
})

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData()
  }
})

const resetAllFilters = () => {
  dataStore.resetFilters()
  resetTopicFilter()
}

const resetTopicFilter = () => {
  selectedTopic.value = null
}

const handleBarClick = (event) => {
  const chart = barChartRef.value?.chart
  if (!chart) return
  const elements = getElementAtEvent(chart, event)
  if (elements.length > 0) {
    const { index } = elements[0]
    const topicLabel = chart.data.labels[index]
    selectedTopic.value = selectedTopic.value === topicLabel ? null : topicLabel
  }
}

const sentimentByTopicData = computed(() => {
  const data = {}
  allTopics.forEach(t => {
    data[t] = {}
    allSentiments.forEach(e => data[t][e] = 0)
  })

  processedData.value.forEach(p => {
    if (p.sentiment !== 'Neutro' && data[p.topic] && data[p.topic][p.sentiment] !== undefined) {
      data[p.topic][p.sentiment]++
    }
  })
  const labels = allTopics.filter(t => t !== 'Geral')
  return {
    labels: labels,
    datasets: allSentiments.map(sentiment => ({
      label: sentiment,
      data: labels.map(topic => data[topic][sentiment]),
      backgroundColor: SENTIMENT_CONFIG[sentiment].color
    }))
  }
})

const topicEvolutionData = computed(() => {
  const dataByDate = {}
  filteredData.value.forEach(p => {
    if (!dataByDate[p.date]) dataByDate[p.date] = 0
    dataByDate[p.date]++
  })
  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b))
  const color = TOPIC_CONFIG[selectedTopic.value]?.color || '#333'
  return {
    labels: sortedDates.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: `Menções de "${selectedTopic.value}"`,
      data: sortedDates.map(date => (dataByDate[date] || 0)),
      borderColor: color,
      backgroundColor: `${color}33`,
      fill: true,
      tension: 0.4
    }]
  }
})

const wordCloudData = computed(() => {
  const wordCounts = {}
  const filteredText = filteredData.value
    .map(p => p.text)
    .join(' ')

  filteredText.toLowerCase().replace(/[^a-zà-ú\s]/g, '').split(/\s+/).filter(word => word.length > 3 && !STOPWORDS_PT.has(word)).forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  const sortedWords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 50)
  if (sortedWords.length === 0) return []

  const max = sortedWords[0][1]
  const min = sortedWords[sortedWords.length - 1][1] || 0
  const topicColor = TOPIC_CONFIG[selectedTopic.value]?.color || '#333'

  return sortedWords.map(([text, value]) => {
    const weight = (max - min) > 0 ? (value - min) / (max - min) : 0.5
    return {
      text,
      value,
      size: 14 + (weight * 30),
      opacity: 0.6 + (weight * 0.4),
      weight: 400 + Math.round(weight * 3) * 100,
      color: topicColor
    }
  }).sort(() => Math.random() - 0.5)
})

// NOVO GRÁFICO: EMOÇÕES (O "PORQUÊ")
const emotionBreakdownData = computed(() => {
  const data = {}
  allEmotions.forEach(e => { data[e] = 0 })

  filteredData.value.forEach(p => {
    if (p.emotion !== 'Geral' && data[p.emotion] !== undefined) {
      data[p.emotion]++
    }
  })
  const labels = allEmotions.filter(e => e !== 'Geral')
  return {
    labels: labels,
    datasets: [{
      label: 'Contagem de Emoções',
      data: labels.map(emotion => data[emotion]),
      backgroundColor: labels.map(emotion => EMOTION_CONFIG[emotion].color)
    }]
  }
})

// NOVO COMPONENTE: TOP POSTS (O "ONDE")
const topPostsData = computed(() => {
  const postCounts = new Map()
  filteredData.value.forEach(p => {
    const postId = p.postRef.publicacao_n
    const currentCount = postCounts.get(postId)?.count || 0
    postCounts.set(postId, { post: p.postRef, count: currentCount + 1 })
  })

  return Array.from(postCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#555' } },
    y: { beginAtZero: true, grid: { color: '#ecf0f1' }, ticks: { color: '#555' } }
  }
}

const groupedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: { x: { stacked: false, grid: { display: false }, ticks: { color: '#555' } }, y: { stacked: false, beginAtZero: true, grid: { color: '#ecf0f1' }, ticks: { color: '#555' } } },
  onHover: (event, chartElement) => {
    const canvas = event.native?.target
    if (canvas) canvas.style.cursor = chartElement[0] ? 'pointer' : 'default'
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#555' } },
    y: { beginAtZero: true, grid: { color: '#ecf0f1' }, ticks: { color: '#555' } }
  }
}

</script>

<style scoped>
.dashboard-page {
  --primary-bg: #f8f9fa;
  --card-bg: #ffffff;
  --text-primary: #2c3e50;
  --text-secondary: #555;
  --border-color: #e0e0e0;
  --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --border-radius: 10px;
  --primary-color: #3498db;
  padding: 1.5rem;
  background-color: var(--primary-bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.header-controls,
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  margin-left: auto;
}

.filter-bar {
  background-color: #fff;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
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
.file-selector select,
.filter-group select {
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #fff;
  color: var(--text-primary);
  height: 38px;
  cursor: pointer;
}

.reset-group {
  margin-left: auto;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f0f0f0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 38px;
}

.reset-btn:hover {
  background-color: #e0e0e0;
}

.active-filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--card-bg);
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow);
  font-size: 0.9rem;
  font-weight: 500;
}

.filter-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
}

.btn-clear-filter {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 0.9rem;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 600;
}

.btn-clear-filter:hover {
  text-decoration: underline;
}

.dashboard-content {
  position: relative;
  min-height: 300px;
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
  font-size: 1.1rem;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
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

/* Layout dos Gráficos (ATUALIZADO) */
.topics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.chart-card {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  height: 450px;
  overflow: hidden;
  /* Garante que o conteúdo não vaze */
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
  margin-top: 0;
  flex-shrink: 0;
}

.full-width {
  grid-column: 1 / -1;
  height: 450px;
}

.word-cloud-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 0.75rem;
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 300px;
}

.word-cloud-item {
  display: inline-block;
  cursor: default;
  transition: all 0.2s ease;
  line-height: 1;
}

.word-cloud-item:hover {
  transform: scale(1.1);
}

.placeholder-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: var(--text-secondary);
  opacity: 0.7;
  text-align: center;
  padding: 1rem;
  height: 100%;
}

.placeholder-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* NOVO: Estilos da Lista de Posts Relevantes */
.list-card {
  height: 450px;
  /* Garante altura consistente */
}

.posts-list-container {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  /* Espaço para a barra de scroll */
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-link {
  display: block;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.post-link:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-color: var(--primary-color);
}

.post-id {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary-color);
}

.post-description {
  font-size: 0.9rem;
  margin: 0.25rem 0 0.5rem 0;
  color: var(--text-secondary);
}

.post-count {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  color: #fff;
  background-color: #ccc;
  /* Cor fallback */
}

.post-count i {
  margin-right: 0.25rem;
}


@media (min-width: 992px) {
  .topics-grid {
    /* Layout 2x2 para os 4 gráficos dinâmicos */
    grid-template-columns: repeat(2, 1fr);
  }

  .full-width {
    grid-column: 1 / -1;
  }
}
</style>
