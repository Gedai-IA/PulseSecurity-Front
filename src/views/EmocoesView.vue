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
        <div class="chart-card full-width-card">
          <div class="card-header">
            <h2 class="chart-title">Evolução da Intensidade das Emoções (Simulado)</h2>
            <div class="filter-group">
              <label for="emotion-filter">Filtrar:</label>
              <select id="emotion-filter" v-model="selectedEmotion">
                <option v-for="emotion in allEmotions" :key="emotion" :value="emotion">{{ emotion }}</option>
              </select>
            </div>
          </div>
          <div class="chart-container">
            <Line :data="emotionIntensityOverTimeData" :options="lineChartOptions" />
          </div>
        </div>

        <div class="chart-card full-width-card">
          <h2 class="chart-title">Distribuição de Emoção por Região (Simulado)</h2>
          <div v-if="Object.keys(emotionByRegionData).length > 0" class="geo-charts-container">
            <div v-for="region in Object.keys(emotionByRegionData)" :key="region" class="doughnut-chart-wrapper">
              <div class="chart-container">
                <Doughnut :data="emotionByRegionData[region]" :options="doughnutOptions" />
              </div>
              <span class="doughnut-label">{{ region }}</span>
            </div>
          </div>
          <div v-else class="empty-chart-state">
            <p>Dados de região insuficientes para exibição.</p>
          </div>
        </div>

        <div class="chart-card full-width-card">
          <h2 class="chart-title">Heatmap de Engajamento por Região (Simulado)</h2>
          <div class="chart-container heatmap-container">
            <div class="map-background" :style="{ backgroundImage: `url(${brazilMapUrl})` }"></div>
            <Bubble :data="heatmapData" :options="heatmapOptions" />
          </div>
        </div>
      </div>

      <div v-else class="feedback-state">
        <p>Nenhum dado de emoção encontrado para a fonte selecionada.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Doughnut, Bubble, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, LinearScale, CategoryScale } from 'chart.js';
import brazilMapUrl from '../img/brasil.png';

ChartJS.register(Title, Tooltip, Legend, ArcElement, PointElement, LineElement, LinearScale, CategoryScale);

const dataStore = useDataStore();

const EMOTION_CONFIG = {
  Alegria: { color: '#2ecc71', keywords: ['gostei', 'legal', 'tmj', 'parabéns', 'kkkkk', 'unidos', 'sempre', 'dominamos', 'vai corinthians', '🦅', '👊🏼'] },
  Raiva: { color: '#e74c3c', keywords: ['correram', 'vergonha', 'ridículo', 'lixo', 'pior', 'odeio', 'tomaram'] },
  Frustração: { color: '#9b59b6', keywords: ['vingança', 'decepção', 'absurdo', '...'] },
  Medo: { color: '#f1c40f', keywords: ['medo', 'cuidado', 'receio'] },
  Ansiedade: { color: '#e67e22', keywords: ['esperando', 'logo mais', 'ansioso', 'grupo'] },
  Neutro: { color: '#95a5a6', keywords: [] }
};

const REGION_POSITIONS = {
  Norte: { x: -60, y: -5 },
  Nordeste: { x: -42, y: -10 },
  'Centro-Oeste': { x: -55, y: -15 },
  Sudeste: { x: -45, y: -22 },
  Sul: { x: -50, y: -28 }
};

const allEmotions = ref(['Todas', ...Object.keys(EMOTION_CONFIG)]);
const selectedEmotion = ref('Todas');
const processedData = ref([]);

const safeParseDate = (dateString) => {
  try {
    if (!dateString || !dateString.includes('-')) return null;
    const parts = dateString.split('-');
    if (parts.length === 2) {
      const currentYear = new Date().getFullYear();
      return new Date(`${currentYear}-${parts[0]}-${parts[1]}`);
    }
    return new Date(dateString);
  } catch (e) {
    return null;
  }
};

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

watch(() => dataStore.publications, (newPublications) => {
  if (!newPublications || newPublications.length === 0) {
    processedData.value = [];
    return;
  }
  const regions = Object.keys(REGION_POSITIONS);
  const allProcessedData = newPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    return allPostComments.map(comment => {
      const date = safeParseDate(post.date);
      return {
        text: comment.text || '',
        emotion: getEmotionFromText(comment.text),
        region: regions[Math.floor(Math.random() * regions.length)],
        intensity: Math.floor(Math.random() * 101),
        engagement: (Number(post.views) || 0) + (Number(post.likes) || 0),
        date: date ? date.toISOString().split('T')[0] : null
      };
    });
  }).filter(item => item.date);
  processedData.value = allProcessedData;
}, { immediate: true, deep: true });

const emotionByRegionData = computed(() => {
  const regionData = {};
  const emotionLabels = Object.keys(EMOTION_CONFIG);
  const emotionColors = Object.values(EMOTION_CONFIG).map(e => e.color);
  processedData.value.forEach(item => {
    if (!regionData[item.region]) {
      regionData[item.region] = {
        labels: emotionLabels,
        datasets: [{ data: Array(emotionLabels.length).fill(0), backgroundColor: emotionColors }]
      };
    }
    const emotionIndex = emotionLabels.indexOf(item.emotion);
    if (emotionIndex !== -1) {
      regionData[item.region].datasets[0].data[emotionIndex]++;
    }
  });
  return regionData;
});

const heatmapData = computed(() => {
  const engagementByRegion = {};
  processedData.value.forEach(item => {
    engagementByRegion[item.region] = (engagementByRegion[item.region] || 0) + item.engagement;
  });
  const maxEngagement = Math.max(...Object.values(engagementByRegion), 1);
  return {
    datasets: Object.entries(engagementByRegion).map(([region, totalEngagement]) => {
      const position = REGION_POSITIONS[region] || { x: 0, y: 0 };
      const radius = 5 + (totalEngagement / maxEngagement) * 35;
      return {
        label: region,
        data: [{ x: position.x, y: position.y, r: radius }],
        backgroundColor: 'rgba(231, 76, 60, 0.5)',
        borderColor: 'rgba(192, 57, 43, 0.8)',
        borderWidth: 1,
      };
    })
  };
});

const emotionIntensityOverTimeData = computed(() => {
  const dataByDate = {};
  const emotionColor = EMOTION_CONFIG[selectedEmotion.value]?.color || '#34495e';
  const filteredData = selectedEmotion.value === 'Todas' ? processedData.value : processedData.value.filter(item => item.emotion === selectedEmotion.value);
  filteredData.forEach(item => {
    if (!dataByDate[item.date]) dataByDate[item.date] = { totalIntensity: 0, count: 0 };
    dataByDate[item.date].totalIntensity += (Number(item.intensity) || 0);
    dataByDate[item.date].count++;
  });
  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels: sortedDates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: `Intensidade Média (${selectedEmotion.value})`,
      data: sortedDates.map(d => dataByDate[d].count > 0 ? dataByDate[d].totalIntensity / dataByDate[d].count : 0),
      borderColor: emotionColor,
      backgroundColor: `${emotionColor}33`,
      fill: true,
      tension: 0.4
    }]
  };
});

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const baseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#2c3e50', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6, } } };
const lineChartOptions = { ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: true, position: 'top', align: 'end' } }, scales: { x: { grid: { display: false }, ticks: { color: '#555' } }, y: { grid: { color: '#ecf0f1' }, ticks: { color: '#555' } } } };
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
const heatmapOptions = {
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const engagement = context.raw.r;
          return `${label}: Raio ~ ${engagement.toFixed(2)}`;
        }
      }
    }
  },
  scales: { x: { display: false, min: -75, max: -35 }, y: { display: false, min: -35, max: 5 } }
};
</script>

<style scoped>
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
  margin-bottom: 2.5rem;
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

.file-selector label,
.filter-group label {
  font-weight: 500;
  color: var(--text-secondary);
}

.file-selector select,
.filter-group select {
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

.file-selector select:hover,
.filter-group select:hover {
  border-color: #3498db;
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
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 450px;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: left;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.geo-charts-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  flex-grow: 1;
  padding: 1rem 0;
}

.doughnut-chart-wrapper {
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-grow: 1;
}

.doughnut-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.heatmap-container {
  position: relative;
  flex-grow: 1;
}

.map-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.15;
  pointer-events: none;
}

.feedback-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  color: var(--text-secondary);
  font-size: 1.2rem;
  text-align: center;
}

.feedback-state.error p {
  color: #c0392b;
}

.feedback-state.error pre {
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

@media (max-width: 768px) {

  .header-controls,
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .main-title {
    font-size: 1.75rem;
  }
}
</style>
