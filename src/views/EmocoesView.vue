<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Relatório de Análise de Emoções</h1>
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
    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>

      <div v-else-if="dataStore.error" class="feedback-state error">
        <p>Ocorreu um erro ao carregar os dados.</p>
        <pre>{{ dataStore.error }}</pre>
      </div>

      <div v-else-if="processedData.length > 0" class="dashboard-grid">
        <div class="chart-card">
          <h2 class="chart-title">Distribuição de Emoções</h2>
          <div class="chart-container">
            <Doughnut :data="emotionDistributionData" :options="doughnutOptions" />
          </div>
        </div>
        <div class="chart-card full-width-card">
          <h2 class="chart-title">Contagem de Emoções ao Longo do Tempo</h2>
          <div class="chart-container">
            <Line :data="emotionOverTimeData" :options="lineChartOptions" />
          </div>
        </div>
      </div>

      <div v-else class="feedback-state">
        <p>Nenhum dado de emoção encontrado para os filtros selecionados.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Doughnut, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, CategoryScale, LinearScale, Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, PointElement, LineElement, CategoryScale, LinearScale, Filler);

const dataStore = useDataStore();

// A lógica de classificação de emoções permanece local
const EMOTION_CONFIG = {
  Alegria: { color: '#2ecc71', keywords: ['gostei', 'legal', 'tmj', 'parabéns', 'kkkkk', 'unidos', 'sempre', 'dominamos', 'vai corinthians', '🦅', '👊🏼'] },
  Raiva: { color: '#e74c3c', keywords: ['correram', 'vergonha', 'ridículo', 'lixo', 'pior', 'odeio', 'tomaram'] },
  Frustração: { color: '#9b59b6', keywords: ['vingança', 'decepção', 'absurdo', '...'] },
  Ansiedade: { color: '#e67e22', keywords: ['esperando', 'logo mais', 'ansioso', 'grupo'] },
  Neutro: { color: '#95a5a6', keywords: [] }
};
const allEmotions = Object.keys(EMOTION_CONFIG);

const getEmotionFromText = (text) => {
  if (!text) return 'Neutro';
  const lowerText = text.toLowerCase();
  for (const [emotion, { keywords }] of Object.entries(EMOTION_CONFIG)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return emotion;
    }
  }
  return 'Neutro';
};

// ATUALIZADO: Usa 'filteredPublications' e 'parsedDate'
const processedData = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    const date = post.parsedDate; // Usa a data já processada
    if (!date) return [];

    return allPostComments.map(comment => ({
      date: date.toISOString().split('T')[0],
      emotion: getEmotionFromText(comment.text || ''),
    }));
  }).filter(Boolean); // Filtra qualquer entrada inválida
});

// GRÁFICO 1: Distribuição de Emoções (REAL)
const emotionDistributionData = computed(() => {
  const counts = {};
  allEmotions.forEach(e => counts[e] = 0);

  processedData.value.forEach(item => {
    if (counts[item.emotion] !== undefined) {
      counts[item.emotion]++;
    }
  });

  return {
    labels: allEmotions,
    datasets: [{
      data: allEmotions.map(e => counts[e]),
      backgroundColor: allEmotions.map(e => EMOTION_CONFIG[e].color)
    }]
  };
});

// GRÁFICO 2: Contagem de Emoções ao Longo do Tempo (REAL)
const emotionOverTimeData = computed(() => {
  const dataByDate = {};

  processedData.value.forEach(item => {
    const dateKey = item.date;
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = {};
      allEmotions.forEach(e => dataByDate[dateKey][e] = 0);
    }
    if (dataByDate[dateKey][item.emotion] !== undefined) {
      dataByDate[dateKey][item.emotion]++;
    }
  });

  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));

  return {
    labels: sortedDates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: allEmotions.map(emotion => ({
      label: emotion,
      data: sortedDates.map(date => dataByDate[date][emotion]),
      borderColor: EMOTION_CONFIG[emotion].color,
      backgroundColor: `${EMOTION_CONFIG[emotion].color}33`, // Cor com transparência
      fill: true,
      tension: 0.4
    }))
  };
});


onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

// Opções dos gráficos
const baseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' }, tooltip: { backgroundColor: '#2c3e50', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6, } } };
const lineChartOptions = { ...baseChartOptions, scales: { x: { grid: { display: false }, ticks: { color: '#555' } }, y: { grid: { color: '#ecf0f1' }, ticks: { color: '#555' } } } };
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } };
</script>

<style scoped>
/* Use os mesmos estilos de OpinioesView.vue */
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
  /* Ajustado */
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
  transition: border-color 0.2s ease;
  text-transform: capitalize;
}

.file-selector select:hover {
  border-color: #3498db;
}

.file-selector select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* NOVOS ESTILOS PARA FILTRO */
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

/* FIM DOS NOVOS ESTILOS */

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* 2 colunas */
  gap: 1.5rem;
}

.chart-card {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  height: 420px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.full-width-card {
  grid-column: 1 / -1;
  /* Ocupa a linha inteira */
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
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

@media (max-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
