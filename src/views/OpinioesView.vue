<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Análise de Opinião e Tendências</h1>
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

    <div v-if="selectedSentiment" class="active-filter-bar">
      <span>Filtrando por Sentimento:</span>
      <span class="filter-tag" :style="{ backgroundColor: getSentimentColor(selectedSentiment) }">
        {{ selectedSentiment }}
      </span>
      <button @click="resetSentimentFilter" class="btn-clear-filter">
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

      <div v-else-if="processedData.length > 0" class="opinion-grid">

        <!-- LINHA 1: O Quê e Quando -->
        <div class="chart-card chart-card-pie">
          <h2 class="chart-title">Análise de Sentimento (Clique para filtrar)</h2>
          <Doughnut :data="sentimentDoughnutData" :options="doughnutOptions" @click="handleDoughnutClick"
            ref="doughnutChartRef" />
        </div>

        <div class="chart-card chart-card-line">
          <h2 class="chart-title">
            {{ selectedSentiment ? `Evolução de Sentimento ${selectedSentiment}` : 'Evolução de Sentimentos' }}
          </h2>
          <Line :data="sentimentOverTimeData" :options="lineOptions" />
        </div>

        <!-- LINHA 2: Porquê, Como e Sinais -->
        <div class="chart-card chart-card-emotions">
          <h2 class="chart-title">
            {{ selectedSentiment ? `Distribuição de Emoções (${selectedSentiment})` : 'Emoções (Geral)' }}
          </h2>
          <Bar :data="emotionDistributionData" :options="barOptions" />
        </div>

        <div class="chart-card chart-card-cloud">
          <h2 class="chart-title">
            {{ selectedSentiment ? `Nuvem de Palavras (${selectedSentiment})` : 'Nuvem de Palavras (Geral)' }}
          </h2>
          <div class="word-cloud-container">
            <span v-if="wordCloudData.length === 0" class="placeholder-state">Nenhuma palavra.</span>
            <span v-for="word in wordCloudData" :key="word.text" class="word-cloud-item"
              :style="{ fontSize: word.size + 'px', opacity: word.opacity, fontWeight: word.weight, color: word.color }">
              {{ word.text }}
            </span>
          </div>
        </div>

        <div class="chart-card chart-card-music">
          <h2 class="chart-title">
            {{ selectedSentiment ? `Top Músicas (${selectedSentiment})` : 'Top 5 Músicas Utilizadas' }}
          </h2>
          <Bar :data="topMusicData" :options="horizontalBarOptions" />
        </div>

      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Nenhum dado encontrado para os filtros selecionados.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
// (O SCRIPT É O MESMO DA VERSÃO ANTERIOR - SEM ALTERAÇÕES)
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { getElementAtEvent } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip as ChartJSTooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler } from 'chart.js'

import { getSentiment, SENTIMENT_CONFIG, allSentiments } from '@/utils/sentimentClassifier.js'
import { getEmotion, EMOTION_CONFIG, allEmotions } from '@/utils/emotionClassifier.js'
import { STOPWORDS_PT } from '@/utils/stopwords.js'
import { formatNumber } from '@/utils/formatters.js'

ChartJS.register(Title, ChartJSTooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler)

const dataStore = useDataStore()
const doughnutChartRef = ref(null)
const selectedSentiment = ref(null)

const getSentimentColor = (sentiment) => {
  return SENTIMENT_CONFIG[sentiment]?.color || '#95a5a6'
}

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData()
  }
})

const resetAllFilters = () => {
  dataStore.resetFilters()
  resetSentimentFilter()
}

const resetSentimentFilter = () => {
  selectedSentiment.value = null
}

const handleDoughnutClick = (event) => {
  const chart = doughnutChartRef.value?.chart
  if (!chart) return
  const elements = getElementAtEvent(chart, event)
  if (elements.length > 0) {
    const { index } = elements[0]
    const newSentiment = chart.data.labels[index]
    selectedSentiment.value = selectedSentiment.value === newSentiment ? null : newSentiment
  }
}

const processedData = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allComments = (post.comments || []).flatMap(c => [
      { text: c.text, type: 'comment' },
      ...(c.replies || []).map(r => ({ text: r.text, type: 'reply' }))
    ])
    allComments.push({ text: post.description, type: 'description' })

    return allComments.map(comment => {
      const text = comment.text || ''
      const sentiment = getSentiment(text)
      const emotion = getEmotion(text)
      return {
        postRef: post,
        text: text,
        date: post.parsedDate,
        tags: post.tags || [],
        musicTitle: post.musicTitle || 'N/A',
        sentiment: sentiment,
        emotion: emotion,
      }
    })
  }).filter(d => d.date && d.sentiment !== 'Neutro')
})

const filteredData = computed(() => {
  if (!selectedSentiment.value) {
    return processedData.value
  }
  return processedData.value.filter(d => d.sentiment === selectedSentiment.value)
})

const sentimentDoughnutData = computed(() => {
  const counts = { Positivo: 0, Negativo: 0 }
  processedData.value.forEach(item => {
    counts[item.sentiment]++
  })
  return {
    labels: allSentiments,
    datasets: [{
      data: allSentiments.map(s => counts[s]),
      backgroundColor: allSentiments.map(s => SENTIMENT_CONFIG[s].color)
    }]
  }
})

const sentimentOverTimeData = computed(() => {
  const dataByDate = {}
  filteredData.value.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0]
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = { Positivo: 0, Negativo: 0 }
    }
    dataByDate[dateKey][item.sentiment]++
  })

  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b))
  const labels = sortedDates.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))

  const datasets = allSentiments.map(sentiment => ({
    label: sentiment,
    data: sortedDates.map(date => (dataByDate[date]?.[sentiment] || 0)),
    borderColor: SENTIMENT_CONFIG[sentiment].color,
    backgroundColor: `${SENTIMENT_CONFIG[sentiment].color}33`,
    fill: true,
    tension: 0.4
  }))

  return {
    labels: labels,
    datasets: selectedSentiment.value ? datasets.filter(d => d.label === selectedSentiment.value) : datasets
  }
})

const wordCloudData = computed(() => {
  const wordCounts = {}
  const allText = filteredData.value.map(p => p.text).join(' ')

  allText.toLowerCase().replace(/[^a-zà-ú\s]/g, '').split(/\s+/).filter(word => {
    return word.length > 3 && !STOPWORDS_PT.has(word)
  }).forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  const sortedWords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 40)
  if (sortedWords.length === 0) return []

  const max = sortedWords[0][1]
  const min = sortedWords[sortedWords.length - 1][1] || 0

  const color = selectedSentiment.value ? getSentimentColor(selectedSentiment.value) : '#2c3e50'

  return sortedWords.map(([text, value]) => {
    const weight = (max - min) > 0 ? (value - min) / (max - min) : 0.5
    return {
      text,
      value,
      size: 14 + (weight * 28),
      opacity: 0.6 + (weight * 0.4),
      weight: 400 + Math.round(weight * 3) * 100,
      color: color
    }
  }).sort(() => Math.random() - 0.5)
})

const topMusicData = computed(() => {
  const musicCounts = {}
  const postMusicMap = new Map()
  filteredData.value.forEach(p => {
    if (p.musicTitle && p.musicTitle !== 'N/A') {
      postMusicMap.set(p.postRef.publicacao_n, p.musicTitle)
    }
  })

  postMusicMap.forEach(musicTitle => {
    musicCounts[musicTitle] = (musicCounts[musicTitle] || 0) + 1
  })

  const sortedMusic = Object.entries(musicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .reverse()

  return {
    labels: sortedMusic.map(([title]) => title.substring(0, 30) + (title.length > 30 ? '...' : '')),
    datasets: [{
      label: 'Nº de Posts',
      data: sortedMusic.map(([, count]) => count),
      backgroundColor: selectedSentiment.value ? getSentimentColor(selectedSentiment.value) : '#8e44ad',
      borderRadius: 4,
    }]
  }
})

const emotionDistributionData = computed(() => {
  const counts = {}
  allEmotions.forEach(e => { counts[e] = 0 })

  filteredData.value.forEach(item => {
    if (item.emotion !== 'Geral' && counts[item.emotion] !== undefined) {
      counts[item.emotion]++
    }
  })

  const labels = allEmotions.filter(e => e !== 'Geral')

  return {
    labels: labels,
    datasets: [{
      label: 'Contagem',
      data: labels.map(e => counts[e]),
      backgroundColor: labels.map(e => EMOTION_CONFIG[e].color)
    }]
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#555' } },
    y: { beginAtZero: true, grid: { color: '#ecf0f1' }, ticks: { color: '#555' } }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || ''
          const value = context.parsed
          const sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
          const percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%'
          return ` ${label}: ${formatNumber(value)} (${percentage})`
        }
      }
    }
  },
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

const horizontalBarOptions = {
  ...barOptions,
  indexAxis: 'y',
  scales: {
    ...barOptions.scales,
    x: {
      ...barOptions.scales.x,
      ticks: {
        color: '#555',
        callback: function (value) {
          if (Math.floor(value) === value) {
            return value;
          }
        }
      }
    }
  }
}
</script>

<style scoped>
/* Estilos Base (copiados do seu original) */
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

/* Estados de Feedback */
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
}

.error-overlay {
  background-color: rgba(255, 235, 235, 0.9);
  color: #c0392b;
}

.no-data-state {
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

/* NOVO: Layout da Página de Opiniões (Grid 3 Colunas) */
.opinion-grid {
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
  /* Altura reduzida para mais densidade */
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

/* Estilos da Nuvem de Palavras */
.word-cloud-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 0.75rem;
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.5rem;
  /* Menor padding para caber mais */
  min-height: 250px;
}

.word-cloud-item {
  display: inline-block;
  cursor: default;
  transition: all 0.2s ease;
  line-height: 1.1;
}

.word-cloud-item:hover {
  transform: scale(1.1);
}

@media (min-width: 992px) {
  .opinion-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-card-line {
    grid-column: 1 / -1;
    /* Linha de evolução ocupa 100% */
  }
}

@media (min-width: 1200px) {
  .opinion-grid {
    /* Layout profissional de 3 colunas */
    grid-template-columns: repeat(3, 1fr);
  }

  .chart-card-pie {
    grid-column: span 1;
  }

  .chart-card-line {
    grid-column: span 2;
  }

  .chart-card-emotions {
    grid-column: span 1;
  }

  .chart-card-cloud {
    grid-column: span 1;
  }

  .chart-card-music {
    grid-column: span 1;
  }
}
</style>
