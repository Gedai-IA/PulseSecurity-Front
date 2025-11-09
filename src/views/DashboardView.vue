<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Dashboard Pulse Security</h1>
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

    <div v-if="selectedTopicFilter" class="active-filter-bar">
      <span>Filtrando por Tópico:</span>
      <span class="filter-tag" :style="{ backgroundColor: getTopicColor(selectedTopicFilter) }">
        {{ selectedTopicFilter }}
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

      <div v-if="!dataStore.error && processedData.length > 0" class="dashboard-summary">

        <div class="kpi-grid">
          <div class="kpi-card">
            <i class="fas fa-file-alt kpi-icon"></i>
            <div>
              <h3 class="kpi-title">
                Total de Publicações
                <span class="tooltip-trigger"
                  data-tooltip="Número total de publicações (vídeos) únicos no período selecionado.">
                  <i class="fas fa-info-circle"></i>
                </span>
              </h3>
              <p class="kpi-value">{{ summaryStats.totalPublications }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-comments kpi-icon"></i>
            <div>
              <h3 class="kpi-title">
                Total de Comentários
                <span class="tooltip-trigger" data-tooltip="Soma de todos os comentários e respostas analisados.">
                  <i class="fas fa-info-circle"></i>
                </span>
              </h3>
              <p class="kpi-value">{{ summaryStats.totalComments }}</p>
            </div>
          </div>
          <div class="kpi-card" :class="{ 'highlight-red': summaryStats.threatCount > 0 }">
            <i class="fas fa-exclamation-triangle kpi-icon"></i>
            <div>
              <h3 class="kpi-title">
                Menções de Ameaça
                <span class="tooltip-trigger"
                  data-tooltip="Número de comentários ou descrições classificados no tópico 'Ameaças e Riscos'.">
                  <i class="fas fa-info-circle"></i>
                </span>
              </h3>
              <p class="kpi-value">{{ summaryStats.threatCount }}</p>
            </div>
          </div>
          <div class="kpi-card" :class="{ 'highlight-red': summaryStats.negativeSentimentPercent > 20 }">
            <i class="fas fa-shield-alt kpi-icon"></i>
            <div>
              <h3 class="kpi-title">
                % Sentimento Negativo
                <span class="tooltip-trigger"
                  data-tooltip="Proporção de todos os comentários classificados como 'Negativo'.">
                  <i class="fas fa-info-circle"></i>
                </span>
              </h3>
              <p class="kpi-value">{{ summaryStats.negativeSentimentPercent.toFixed(0) }}%</p>
            </div>
          </div>
        </div>

        <div class="charts-row-dashboard">
          <div class="chart-card chart-card-pie">
            <h2 class="chart-title">Foco das Discussões (Clique para filtrar)</h2>
            <Doughnut :data="topicDistributionData" :options="topicDoughnutOptions" @click="handleTopicClick"
              ref="topicDoughnutRef" />
          </div>
          <div class="chart-card chart-card-line">
            <h2 class="chart-title">
              {{ selectedTopicFilter ? `Evolução de "${selectedTopicFilter}"` : 'Evolução de Ameaças' }}
            </h2>
            <Line :data="threatsOverTimeData" :options="lineOptions" />
          </div>
          <div class="chart-card chart-card-bar">
            <h2 class="chart-title">Top 5 Posts (Mais Comentados)</h2>
            <Bar :data="topCommentsData" :options="topCommentsOptions" ref="topCommentsChartRef"
              class="clickable-chart" />
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
import { computed, onMounted, ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import { getElementAtEvent } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip as ChartJSTooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler } from 'chart.js'
import { formatNumber } from '@/utils/formatters.js'
import { getSentiment, SENTIMENT_CONFIG } from '@/utils/sentimentClassifier.js'
import { getTopicFromText, TOPIC_CONFIG, allTopics } from '@/utils/topicClassifier.js'

ChartJS.register(Title, ChartJSTooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler)

const dataStore = useDataStore()

const topCommentsChartRef = ref(null)
const topicDoughnutRef = ref(null)

const selectedTopicFilter = ref(null)

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData()
  }
})

const getTopicColor = (topicName) => {
  return TOPIC_CONFIG[topicName]?.color || '#95a5a6'
}

const resetAllFilters = () => {
  dataStore.resetFilters()
  resetTopicFilter()
}

const resetTopicFilter = () => {
  selectedTopicFilter.value = null
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
      const topic = getTopicFromText(text)
      return {
        postId: post.publicacao_n,
        postRef: post,
        text: text,
        date: post.parsedDate,
        sentiment: sentiment,
        topic: topic
      }
    })
  }).filter(d => d.date && d.topic !== 'Geral' && d.sentiment !== 'Neutro')
})

const filteredData = computed(() => {
  if (!selectedTopicFilter.value) {
    return processedData.value
  }
  return processedData.value.filter(d => d.topic === selectedTopicFilter.value)
})

const summaryStats = computed(() => {
  const data = filteredData.value
  const totalComments = data.length
  if (totalComments === 0) {
    return { totalPublications: 0, totalComments: 0, threatCount: 0, negativeSentimentPercent: 0 }
  }

  const uniquePostIds = new Set(data.map(d => d.postId))

  let threatCount = 0
  let negativeCount = 0

  data.forEach(item => {
    if (item.topic === 'Ameaças e Riscos') {
      threatCount++
    }
    if (item.sentiment === 'Negativo') {
      negativeCount++
    }
  })

  // Calcula % negativa usando os dados completos (processedData) para o KPI não mudar
  const totalNegative = processedData.value.filter(d => d.sentiment === 'Negativo').length
  const totalValidComments = processedData.value.length
  const negativePercent = totalValidComments > 0 ? (totalNegative / totalValidComments) * 100 : 0

  // O total de ameaças também deve vir dos dados completos
  const totalThreats = processedData.value.filter(d => d.topic === 'Ameaças e Riscos').length

  return {
    totalPublications: formatNumber(uniquePostIds.size),
    totalComments: formatNumber(totalComments), // Comentários no filtro
    threatCount: formatNumber(totalThreats), // Ameaças totais
    negativeSentimentPercent: negativePercent // % Negativo total
  }
})

const topicDistributionData = computed(() => {
  const topicCounts = {}
  allTopics.forEach(topic => { topicCounts[topic] = 0 })

  processedData.value.forEach(item => {
    if (topicCounts[item.topic] !== undefined) {
      topicCounts[item.topic]++
    }
  })

  const labels = allTopics.filter(t => t !== 'Geral')
  const data = labels.map(topic => topicCounts[topic])
  const colors = labels.map(topic => TOPIC_CONFIG[topic].color)

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: colors,
    }]
  }
})

const threatsOverTimeData = computed(() => {
  const data = filteredData.value
  const countsByDate = {}

  data.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0]
    countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1
  })

  const sortedDates = Object.keys(countsByDate).sort((a, b) => new Date(a) - new Date(b))
  const labels = sortedDates.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }))
  const chartData = sortedDates.map(date => countsByDate[date])

  const filterLabel = selectedTopicFilter.value || 'Ameaças e Riscos'
  const filterColor = getTopicColor(filterLabel)

  if (!selectedTopicFilter.value) {
    const threatData = processedData.value.filter(d => d.topic === 'Ameaças e Riscos')
    const threatCountsByDate = {}
    threatData.forEach(item => {
      const dateKey = item.date.toISOString().split('T')[0]
      threatCountsByDate[dateKey] = (threatCountsByDate[dateKey] || 0) + 1
    })
    const sortedThreatDates = Object.keys(threatCountsByDate).sort((a, b) => new Date(a) - new Date(b))
    return {
      labels: sortedThreatDates.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
      datasets: [{
        label: 'Menções de Ameaça',
        data: sortedThreatDates.map(date => threatCountsByDate[date]),
        borderColor: TOPIC_CONFIG['Ameaças e Riscos'].color,
        backgroundColor: `${TOPIC_CONFIG['Ameaças e Riscos'].color}33`,
        fill: true,
        tension: 0.4
      }]
    }
  }

  return {
    labels: labels,
    datasets: [{
      label: `Menções de "${filterLabel}"`,
      data: chartData,
      borderColor: filterColor,
      backgroundColor: `${filterColor}33`,
      fill: true,
      tension: 0.4
    }]
  }
})

const topCommentsData = computed(() => {
  const postsMap = new Map()
  filteredData.value.forEach(item => {
    postsMap.set(item.postId, item.postRef)
  })

  const posts = Array.from(postsMap.values())

  const sortedPosts = [...posts]
    .sort((a, b) => (Number(b['comments_count']) || 0) - (Number(a['comments_count']) || 0))
    .slice(0, 5)
    .reverse()

  return {
    labels: sortedPosts.map(p => `#${p.publicacao_n}`),
    datasets: [{
      label: `Total de Comentários`,
      data: sortedPosts.map(p => Number(p.comments_count) || 0),
      backgroundColor: '#3498db',
      borderRadius: 4,
      postDescriptions: sortedPosts.map(p => p.description || 'Sem descrição')
    }]
  }
})

const handleTopicClick = (event) => {
  const chart = topicDoughnutRef.value?.chart
  if (!chart) return

  const elements = getElementAtEvent(chart, event)
  if (elements.length > 0) {
    const { index } = elements[0]
    const topicLabel = chart.data.labels[index]

    selectedTopicFilter.value = selectedTopicFilter.value === topicLabel ? null : topicLabel
  }
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: '#ecf0f1' } }
  }
}

const topicDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    // CORREÇÃO VISUAL 1: Legenda na parte de baixo
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

const topCommentsOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: function (tooltipItems) {
          const index = tooltipItems[0].dataIndex
          const label = tooltipItems[0].chart.data.labels[index]
          const description = tooltipItems[0].dataset.postDescriptions[index]
          return `${label}: ${description.substring(0, 50)}...`
        },
        label: function (context) {
          return ` ${context.dataset.label}: ${formatNumber(context.parsed.x)}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#eee' },
      ticks: { callback: function (value) { return formatNumber(value) } }
    },
    y: { grid: { display: false } }
  },
  onHover: (event, chartElement) => {
    const canvas = event.native?.target
    if (canvas) canvas.style.cursor = chartElement[0] ? 'pointer' : 'default'
  },
  onClick: (event) => {
    const chart = topCommentsChartRef.value?.chart
    if (!chart) return
    const elements = getElementAtEvent(chart, event)
    if (elements.length === 0) return
    const { index } = elements[0]
    const label = chart.data.labels[index]
    const postId = label.replace('#', '')
    const post = dataStore.filteredPublications.find(p => p.publicacao_n == postId)

    if (post && post.url) {
      window.open(post.url, '_blank', 'noopener,noreferrer')
    } else {
      console.warn('URL não encontrado para a publicação:', postId)
    }
  }
}))
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

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: var(--card-bg);
  padding: 1.25rem 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid transparent;
}

.kpi-card:hover {
  transform: translateY(-4px);
}

.kpi-icon {
  font-size: 2rem;
  color: var(--primary-color);
  opacity: 0.7;
}

.kpi-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.kpi-card.highlight-red {
  border-left-color: var(--danger-color);
}

.kpi-card.highlight-red .kpi-icon {
  color: var(--danger-color);
}

.kpi-card.highlight-red .kpi-value {
  color: var(--danger-color);
}

.charts-row-dashboard {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  gap: 1.5rem;
}

.chart-card {
  background-color: var(--card-bg);
  padding: 2.2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
  margin-top: 0;
}

.chart-card-pie {
  height: 450px;
}

.chart-card-line {
  height: 400px;
}

.chart-card-bar {
  height: 400px;
}

.clickable-chart {
  cursor: pointer;
}

.tooltip-trigger {
  position: relative;
  display: inline-block;
  cursor: help;
  color: #aaa;
}

.tooltip-trigger .fa-info-circle {
  font-size: 0.9em;
}

.tooltip-trigger::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  min-width: 200px;
  max-width: 300px;
  background-color: #333;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 400;
  text-align: left;

  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 20;
}

.tooltip-trigger:hover::after {
  opacity: 1;
  visibility: visible;
}

@media (min-width: 992px) {
  .charts-row-dashboard {
    /* CORREÇÃO VISUAL 2: Grid 50/50 */
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-card-pie {
    grid-column: 1 / 2;
    height: 400px;
  }

  .chart-card-line {
    grid-column: 2 / 3;
    height: 400px;
  }

  .chart-card-bar {
    grid-column: 1 / 3;
    height: 400px;
  }
}
</style>
