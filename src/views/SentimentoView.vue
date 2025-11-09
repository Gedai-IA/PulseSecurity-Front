<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Relatório de Análise de Sentimento</h1>
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

    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state loading-overlay">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>
      <div v-else-if="dataStore.error" class="feedback-state error-overlay">
        <p>Ocorreu um erro ao carregar os dados.</p>
        <pre>{{ dataStore.error }}</pre>
      </div>

      <div v-else-if="processedData.length > 0" class="dashboard-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h2 class="chart-title">Distribuição de Sentimento</h2>
            <button v-if="selectedSentiment" @click="resetSentimentFilter" class="btn-reset-chart">
              Limpar filtro
            </button>
          </div>
          <div class="chart-container">
            <Doughnut :data="sentimentDistributionData" :options="doughnutOptions" @click="handleChartClick"
              ref="doughnutChartRef" />
          </div>
        </div>
        <div class="chart-card full-width-card">
          <div class="chart-header">
            <h2 class="chart-title">
              {{ selectedSentiment
                ? `Volume de Sentimento "${selectedSentiment}" ao Longo do Tempo`
                : 'Volume de Sentimentos (Positivo vs. Negativo) ao Longo do Tempo'
              }}
            </h2>
          </div>
          <div class="chart-container">
            <Line :data="finalSentimentOverTimeData" :options="lineChartOptions" />
          </div>
        </div>
      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Nenhum dado de sentimento encontrado para os filtros selecionados.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Doughnut, Line } from 'vue-chartjs';
import { getElementAtEvent } from 'vue-chartjs';
import {
  Chart as ChartJS, Title, Tooltip, Legend, ArcElement, PointElement,
  LineElement, CategoryScale, LinearScale, Filler
} from 'chart.js';
import { SENTIMENT_CONFIG, allSentiments, getSentiment } from '@/utils/sentimentClassifier.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, PointElement, LineElement, CategoryScale, LinearScale, Filler);

const dataStore = useDataStore();
const doughnutChartRef = ref(null);
const selectedSentiment = ref(null);

const processedData = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    const date = post.parsedDate;
    if (!date) return [];

    return allPostComments.map(comment => ({
      date: date.toISOString().split('T')[0],
      sentiment: getSentiment(comment.text || ''),
    }));
  })
    .filter(item => item.sentiment !== 'Neutro');
});

const sentimentDistributionData = computed(() => {
  const counts = {};
  allSentiments.forEach(s => counts[s] = 0);

  processedData.value.forEach(item => {
    if (counts[item.sentiment] !== undefined) {
      counts[item.sentiment]++;
    }
  });

  return {
    labels: allSentiments,
    datasets: [{
      data: allSentiments.map(s => counts[s]),
      backgroundColor: allSentiments.map(s => SENTIMENT_CONFIG[s].color)
    }]
  };
});

const sentimentOverTimeData = computed(() => {
  const dataByDate = {};

  processedData.value.forEach(item => {
    const dateKey = item.date;
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = {};
      allSentiments.forEach(s => dataByDate[dateKey][s] = 0);
    }
    if (dataByDate[dateKey][item.sentiment] !== undefined) {
      dataByDate[dateKey][item.sentiment]++;
    }
  });

  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));

  return {
    labels: sortedDates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: allSentiments.map(sentiment => ({
      label: sentiment,
      data: sortedDates.map(date => dataByDate[date][sentiment] || 0),
      borderColor: SENTIMENT_CONFIG[sentiment].color,
      backgroundColor: `${SENTIMENT_CONFIG[sentiment].color}33`,
      fill: true,
      tension: 0.4
    }))
  };
});

const finalSentimentOverTimeData = computed(() => {
  if (!selectedSentiment.value) {
    return sentimentOverTimeData.value;
  }
  return {
    ...sentimentOverTimeData.value,
    datasets: sentimentOverTimeData.value.datasets.filter(
      ds => ds.label === selectedSentiment.value
    )
  };
});

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  dataStore.resetFilters();
  resetSentimentFilter();
};

const handleChartClick = (event) => {
  const chart = doughnutChartRef.value?.chart;
  if (!chart) return;

  const elements = getElementAtEvent(chart, event);
  if (elements.length > 0) {
    const { index } = elements[0];
    const newSentiment = sentimentDistributionData.value.labels[index];

    selectedSentiment.value = selectedSentiment.value === newSentiment ? null : newSentiment;
  }
};

const resetSentimentFilter = () => {
  selectedSentiment.value = null;
};

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: {
      backgroundColor: '#2c3e50',
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 6,
      displayColors: true,
      usePointStyle: true,
    }
  }
};

const lineChartOptions = {
  ...baseChartOptions,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#555' } },
    y: { beginAtZero: true, grid: { color: '#ecf0f1' }, ticks: { color: '#555' } }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right' },
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: {
        label: function (context) {
          const label = context.label || '';
          const value = context.parsed;
          const sum = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = sum > 0 ? ((value / sum) * 100).toFixed(1) + '%' : '0%';
          return ` ${label}: ${value} (${percentage})`;
        }
      }
    }
  }
};
</script>

<style scoped>
/* O CSS é o mesmo da versão anterior, não precisa mudar nada */
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
  padding: 1rem;
  background-color: var(--primary-bg);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.header-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  gap: 1rem;
  background-color: var(--card-bg);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  width: 100%;
  justify-content: space-between;
  box-sizing: border-box;
}

.file-selector label {
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
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
  flex-grow: 1;
  width: 100%;
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #fff;
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  width: 100%;
}

.filter-group label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.filter-group input[type="date"],
.filter-group select {
  width: 100%;
  box-sizing: border-box;
  padding: 0.6rem 0.6rem;
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

.reset-group {
  align-items: flex-end;
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
  width: 100%;
  justify-content: center;
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
}

.error-overlay {
  background-color: rgba(255, 235, 235, 0.9);
}

.error-overlay p {
  color: #c0392b;
  font-weight: 500;
}

.feedback-state pre {
  background-color: #fdd;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.8rem;
  width: 100%;
  max-width: 90vw;
  overflow-x: auto;
  text-align: left;
  box-sizing: border-box;
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.chart-card {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  height: 350px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  margin: 0;
  flex-grow: 1;
}

.btn-reset-chart {
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset-chart:hover {
  background-color: #bdc3c7;
  color: #fff;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
}

@media (min-width: 576px) {
  .reset-btn {
    width: auto;
  }
}

@media (min-width: 768px) {
  .dashboard-page {
    padding: 2rem;
  }

  .header-controls {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
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

  .filter-bar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
  }

  .filter-group {
    flex-direction: row;
    align-items: center;
    width: auto;
  }

  .filter-group input[type="date"],
  .filter-group select {
    width: auto;
  }

  .reset-group {
    align-self: flex-end;
  }

  .reset-btn {
    width: auto;
  }

  .chart-card {
    height: 420px;
  }
}

@media (min-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }

  .full-width-card {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr 2fr;
  }

  .full-width-card {
    grid-column: auto;
    grid-row: 1 / span 1;
    grid-column: 2 / span 1;
  }

  .chart-card {
    height: 450px;
  }
}
</style>
