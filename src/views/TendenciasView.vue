<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Análise de Tendências (Período-sobre-Período)</h1>
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
      <div class="filter-group">
        <label for="time-margin">Comparar Períodos:</label>
        <select id="time-margin" v-model="timeMarginInDays">
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
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
      <span>Analisando Tendência de:</span>
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

      <div v-else-if="calculateTrends.topics.length > 0" class="trends-grid">

        <div class="chart-card kpi-card-list">
          <h2 class="chart-title">Tendência de Sentimento</h2>
          <div class="kpi-list">
            <div v-for="item in calculateTrends.sentiments" :key="item.name" class="kpi-trend-item"
              :class="item.changeClass">
              <span class="kpi-name">{{ item.name }}</span>
              <div class="kpi-change">
                <span>{{ item.changeFormatted }}</span>
                <i v-if="item.changeIcon" :class="item.changeIcon"></i>
              </div>
              <div class="kpi-volumes">
                <span class="current-vol">{{ item.current }} atual</span>
                <span class="prev-vol">{{ item.previous }} anterior</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h2 class="chart-title">Tópicos com Maior Crescimento (Clique para filtrar)</h2>
          <Bar :data="topicTrendData" :options="horizontalBarOptions" @click="handleBarClick" ref="barChartRef" />
        </div>

        <template v-if="selectedTopic">
          <div class="chart-card">
            <h2 class="chart-title">Evolução Diária (Período Atual)</h2>
            <Line :data="topicEvolutionData" :options="lineOptions" />
          </div>

          <div class="chart-card list-card">
            <h2 class="chart-title">Posts que Impulsionam a Tendência</h2>
            <div class="posts-list-container">
              <ul v-if="topTrendingPosts.length > 0" class="posts-list">
                <li v-for="item in topTrendingPosts" :key="item.post.publicacao_n">
                  <a :href="item.post.url" target="_blank" rel="noopener noreferrer" class="post-link">
                    <span class="post-id">#{{ item.post.publicacao_n }}</span>
                    <p class="post-description">{{ item.post.description.substring(0, 80) }}...</p>
                    <span class="post-count" :style="{ backgroundColor: getTopicColor(selectedTopic) }">
                      <i class="fas fa-comments"></i> {{ item.count }} menções
                    </span>
                  </a>
                </li>
              </ul>
              <span v-else class="placeholder-state">Nenhum post encontrado.</span>
            </div>
          </div>
        </template>

      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Não há dados suficientes nos períodos de tempo selecionados para análise.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { Bar, Line } from 'vue-chartjs'
import { getElementAtEvent } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip as ChartJSTooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import { getTopicFromText, TOPIC_CONFIG, allTopics } from '@/utils/topicClassifier.js'
import { getSentiment, SENTIMENT_CONFIG, allSentiments } from '@/utils/sentimentClassifier.js'
import { formatChange, formatNumber } from '@/utils/formatters.js'

ChartJS.register(Title, ChartJSTooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler)

const dataStore = useDataStore()
const timeMarginInDays = ref(7)
const selectedTopic = ref(null)
const barChartRef = ref(null)

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
        postRef: post,
        date: date,
        topic: getTopicFromText(fullText),
        sentiment: getSentiment(text),
      }
    })
  })
})

const calculateTrends = computed(() => {
  const allMentions = processedData.value
  if (allMentions.length === 0) return { topics: [], sentiments: [] }

  const latestDateInData = new Date(
    Math.max(...allMentions.map(mention => mention.date.getTime()))
  )

  const margin = Number(timeMarginInDays.value)
  const today = new Date(latestDateInData.setHours(0, 0, 0, 0))

  // --- CORREÇÃO DO BUG ESTÁ AQUI ---
  // O cálculo do período usa o 'today' (baseado nos dados) em vez de 'new Date()' (baseado no mundo real)

  const currentPeriodEnd = today
  const currentPeriodStart = new Date(new Date(today).setDate(today.getDate() - (margin - 1)))
  const previousPeriodEnd = new Date(new Date(currentPeriodStart).setDate(currentPeriodStart.getDate() - 1))
  const previousPeriodStart = new Date(new Date(previousPeriodEnd).setDate(previousPeriodEnd.getDate() - (margin - 1)))
  // --- FIM DA CORREÇÃO ---

  const topicCounts = {}
  allTopics.forEach(topic => { topicCounts[topic] = { current: 0, previous: 0 } })

  const sentimentCounts = {}
  allSentiments.forEach(sentiment => { sentimentCounts[sentiment] = { current: 0, previous: 0 } })

  allMentions.forEach(({ date, topic, sentiment }) => {
    const mentionDate = new Date(date.setHours(0, 0, 0, 0))

    if (mentionDate >= currentPeriodStart && mentionDate <= currentPeriodEnd) {
      if (topicCounts[topic]) topicCounts[topic].current++
      if (sentimentCounts[sentiment]) sentimentCounts[sentiment].current++
    } else if (mentionDate >= previousPeriodStart && mentionDate <= previousPeriodEnd) {
      if (topicCounts[topic]) topicCounts[topic].previous++
      if (sentimentCounts[sentiment]) sentimentCounts[sentiment].previous++
    }
  })

  const processItems = (items, config) => {
    return Object.entries(items).map(([name, counts]) => {
      const { current, previous } = counts
      let change = 0
      if (previous > 0) {
        change = ((current - previous) / previous) * 100
      } else if (current > 0) {
        change = Infinity
      }

      let changeClass = 'neutral'
      let changeIcon = null
      if (change === Infinity) {
        changeClass = 'positive'
        changeIcon = 'fas fa-infinity'
      } else if (change > 0) {
        changeClass = 'positive'
        changeIcon = 'fas fa-arrow-up'
      } else if (change < 0) {
        changeClass = 'negative'
        changeIcon = 'fas fa-arrow-down'
      }

      return {
        name,
        current,
        previous,
        change,
        changeFormatted: formatChange(change),
        changeClass,
        changeIcon,
        color: config[name]?.color || '#95a5a6'
      }
    })
  }

  const topics = processItems(topicCounts, TOPIC_CONFIG)
    .filter(item => (item.current > 0 || item.previous > 0) && item.name !== 'Geral')
    .sort((a, b) => b.change - a.change)

  const sentiments = processItems(sentimentCounts, SENTIMENT_CONFIG)
    .filter(item => item.name !== 'Neutro')

  return { topics, sentiments }
})

const topicTrendData = computed(() => {
  const topics = calculateTrends.value.topics.slice(0, 10).reverse()
  return {
    labels: topics.map(t => t.name),
    datasets: [{
      label: '% de Crescimento',
      data: topics.map(t => isFinite(t.change) ? t.change : 1000),
      backgroundColor: topics.map(t => t.color),
      borderRadius: 4
    }]
  }
})

const topicEvolutionData = computed(() => {
  if (!selectedTopic.value) return { labels: [], datasets: [] }

  // --- CORREÇÃO DE BUG DA DATA AQUI TAMBÉM ---
  const margin = Number(timeMarginInDays.value)
  const latestDateInData = new Date(Math.max(...processedData.value.map(mention => mention.date.getTime())))
  const today = new Date(latestDateInData.setHours(0, 0, 0, 0))
  const currentPeriodStart = new Date(new Date(today).setDate(today.getDate() - (margin - 1)))
  // --- FIM DA CORREÇÃO ---

  const dataByDate = {}

  filteredData.value
    .filter(p => new Date(p.date.setHours(0, 0, 0, 0)) >= currentPeriodStart)
    .forEach(p => {
      const dateKey = p.date.toISOString().split('T')[0]
      dataByDate[dateKey] = (dataByDate[dateKey] || 0) + 1
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

const topTrendingPosts = computed(() => {
  if (!selectedTopic.value) return []

  // --- CORREÇÃO DE BUG DA DATA AQUI TAMBÉM ---
  const margin = Number(timeMarginInDays.value)
  const latestDateInData = new Date(Math.max(...processedData.value.map(mention => mention.date.getTime())))
  const today = new Date(latestDateInData.setHours(0, 0, 0, 0))
  const currentPeriodStart = new Date(new Date(today).setDate(today.getDate() - (margin - 1)))
  // --- FIM DA CORREÇÃO ---

  const postCounts = new Map()
  filteredData.value
    .filter(p => new Date(p.date.setHours(0, 0, 0, 0)) >= currentPeriodStart)
    .forEach(p => {
      const postId = p.postRef.publicacao_n
      const currentCount = postCounts.get(postId)?.count || 0
      postCounts.set(postId, { post: p.postRef, count: currentCount + 1 })
    })

  return Array.from(postCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const filteredData = computed(() => {
  if (!selectedTopic.value) {
    return processedData.value
  }
  return processedData.value.filter(p => p.topic === selectedTopic.value)
})

const resetAllFilters = () => {
  dataStore.resetFilters()
  timeMarginInDays.value = 7
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

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData()
  }
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

const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          const value = context.parsed.x
          return ` ${formatChange(value)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#eee' },
      ticks: {
        color: '#555',
        callback: function (value) { return (isFinite(value) ? value : '∞') + '%' }
      }
    },
    y: { grid: { display: false }, ticks: { color: '#555' } }
  },
  onHover: (event, chartElement) => {
    const canvas = event.native?.target
    if (canvas) canvas.style.cursor = chartElement[0] ? 'pointer' : 'default'
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
  --danger-color: #c0392b;
  --success-color: #27ae60;
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

.feedback-state,
.placeholder-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  height: 100%;
  color: var(--text-secondary);
  opacity: 0.8;
}

.placeholder-state {
  min-height: 250px;
  font-size: 0.9rem;
}

.placeholder-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
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

.trends-grid {
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
  height: 400px;
  overflow: hidden;
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

.kpi-card-list {
  height: auto;
  min-height: 400px;
}

.kpi-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-grow: 1;
  justify-content: center;
}

.kpi-trend-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.kpi-trend-item:last-child {
  border-bottom: none;
}

.kpi-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.kpi-change {
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.kpi-volumes {
  grid-column: 1 / -1;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.current-vol {
  font-weight: 500;
}

.prev-vol {
  margin-left: 0.5rem;
}

.kpi-trend-item.positive .kpi-change {
  color: var(--success-color);
}

.kpi-trend-item.negative .kpi-change {
  color: var(--danger-color);
}

.kpi-trend-item.neutral .kpi-change {
  color: var(--text-secondary);
}

.list-card {
  height: 400px;
}

.posts-list-container {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
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
}

.post-count i {
  margin-right: 0.25rem;
}


@media (min-width: 992px) {
  .trends-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
