<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Relatório de Análise de Opiniões</h1>
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
        <input type="date" id="start-date" v-model="dataStore.startDate" :disabled="dataStore.loading">
      </div>
      <div class="filter-group">
        <label for="end-date">Data Fim:</label>
        <input type="date" id="end-date" v-model="dataStore.endDate" :disabled="dataStore.loading">
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

      <div v-else-if="dataStore.filteredPublications.length > 0" class="dashboard-grid">
        <div class="chart-card full-width-card">
          <h2 class="chart-title">Publicações ao Longo do Tempo</h2>
          <Line v-if="postsOverTimeData.labels.length" :data="postsOverTimeData" :options="chartOptions" />
        </div>

        <div class="chart-card">
          <h2 class="chart-title">Análise de Sentimentos</h2>
          <Doughnut v-if="sentimentData.labels.length" :data="sentimentData" :options="doughnutOptions" />
        </div>
        <div class="chart-card">
          <h2 class="chart-title">Total de Engajamento</h2>
          <Bar v-if="totalEngagementData.datasets[0]?.data.length" :data="totalEngagementData"
            :options="chartOptions" />
        </div>
        <div class="chart-card">
          <h2 class="chart-title">Correlação: Views vs. Likes</h2>
          <Bubble v-if="engagementCorrelationData.datasets[0]?.data.length" :data="engagementCorrelationData"
            :options="bubbleChartOptions" />
        </div>

        <div class="chart-card medium-width-card">
          <h2 class="chart-title">Top 10 Palavras Mais Frequentes</h2>
          <Bar v-if="wordFrequencyData.labels.length" :data="wordFrequencyData" :options="horizontalBarOptions" />
        </div>
        <div class="chart-card medium-width-card">
          <h2 class="chart-title">Top 10 Tags Mais Utilizadas</h2>
          <Bar v-if="topTagsData.labels.length" :data="topTagsData" :options="horizontalBarOptions" />
        </div>
      </div>

      <div v-else-if="!dataStore.loading && !dataStore.error" class="feedback-state no-data-state">
        <p>Nenhum dado encontrado para os filtros selecionados.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Bar, Line, Bubble, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement);

const dataStore = useDataStore();

const positiveWords = ['bom', 'ótimo', 'gostei', 'legal', 'sempre', 'unidos', 'tmj', 'parabéns', 'excelente', 'adorei', 'incrível', 'sucesso', 'sempre', 'dominamos', 'vai corinthians'];
const negativeWords = ['correram', 'vergonha', 'ridículo', 'morte', 'pagar', 'vingança', 'lixo', 'pior', 'odeio', 'péssimo', 'decepção', 'absurdo', 'tomaram'];

const allCommentsAndReplies = computed(() => {
  return dataStore.filteredPublications.flatMap(p =>
    (p.comments || []).flatMap(c => [c, ...(c.replies || [])])
  );
});

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  dataStore.resetFilters();
};

const sentimentData = computed(() => {
  const sentimentCounts = { Positivo: 0, Negativo: 0, Neutro: 0 };
  allCommentsAndReplies.value.forEach(comment => {
    const text = (comment.text || '').toLowerCase();
    const positiveScore = positiveWords.filter(word => text.includes(word)).length;
    const negativeScore = negativeWords.filter(word => text.includes(word)).length;
    if (positiveScore > negativeScore) sentimentCounts.Positivo++;
    else if (negativeScore > positiveScore) sentimentCounts.Negativo++;
    else sentimentCounts.Neutro++;
  });
  return {
    labels: ['Positivo', 'Negativo', 'Neutro'],
    datasets: [{
      data: [sentimentCounts.Positivo, sentimentCounts.Negativo, sentimentCounts.Neutro],
      backgroundColor: ['#27ae60', '#c0392b', '#2980b9']
    }]
  };
});

const wordFrequencyData = computed(() => {
  const stopwords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ser', 'ter', 'ele', 'ela', 'nós', 'vc', 'vcs', 'tá']);
  const wordCounts = {};

  const allText = dataStore.filteredPublications.map(p => {
    const description = p.description || '';
    const commentsText = (p.comments || []).flatMap(c => [c.text, ...(c.replies || []).map(r => r.text)]).join(' ');
    return `${description} ${commentsText}`;
  }).join(' ');

  allText.toLowerCase().replace(/[^a-zà-ú\s]/g, '').split(/\s+/).filter(word => word.length > 2 && !stopwords.has(word)).forEach(word => { wordCounts[word] = (wordCounts[word] || 0) + 1; });
  const sortedWords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  return {
    labels: sortedWords.map(([word]) => word),
    datasets: [{ label: 'Ocorrências', data: sortedWords.map(([, count]) => count), backgroundColor: '#d35400' }]
  };
});

const totalEngagementData = computed(() => {
  const totals = dataStore.filteredPublications.reduce((acc, post) => {
    acc.views += Number(post.views) || 0;
    acc.likes += Number(post.likes) || 0;
    acc.comments += Number(post.comments_count) || 0;
    acc.shares += Number(post.shares) || 0;
    acc.bookmarks += Number(post.bookmarks) || 0;
    return acc;
  }, { views: 0, likes: 0, comments: 0, shares: 0, bookmarks: 0 });

  return {
    labels: ['Views', 'Likes', 'Comentários', 'Compart.', 'Salvos'],
    datasets: [{ label: 'Total de Interações', data: [totals.views, totals.likes, totals.comments, totals.shares, totals.bookmarks], backgroundColor: ['#2980b9', '#27ae60', '#f1c40f', '#c0392b', '#8e44ad'] }],
  };
});

const postsOverTimeData = computed(() => {
  const countsByDate = {};
  dataStore.filteredPublications.forEach(post => {
    const date = post.parsedDate;
    if (date) {
      const dateKey = date.toISOString().split('T')[0];
      countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(countsByDate).sort((a, b) => new Date(a) - new Date(b));

  return {
    labels: sortedDates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
    datasets: [{ label: 'Número de Publicações', data: sortedDates.map(date => countsByDate[date]), borderColor: '#8e44ad', backgroundColor: 'rgba(142, 68, 173, 0.1)', fill: true, tension: 0.3 }]
  };
});

const topTagsData = computed(() => {
  const tagCounts = {};
  dataStore.filteredPublications.flatMap(p => p.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  return {
    labels: sortedTags.map(([tag]) => tag),
    datasets: [{ label: 'Ocorrências', data: sortedTags.map(([, count]) => count), backgroundColor: '#16a085' }]
  };
});

const bubbleChartPosts = computed(() => dataStore.filteredPublications);

const engagementCorrelationData = computed(() => {
  const data = bubbleChartPosts.value.map(post => ({
    x: Number(post.views) || 0,
    y: Number(post.likes) || 0,
    r: (Number(post.comments_count) || 0) * 0.5 + 5
  }));

  return {
    datasets: [{ label: 'Publicações (Tamanho por Comentários)', data, backgroundColor: 'rgba(192, 57, 43, 0.6)' }]
  };
});

const handleChartClick = (event, elements, posts) => {
  if (elements.length === 0) return;
  const dataIndex = elements[0].index;
  const post = posts[dataIndex];
  if (post && post.link) {
    window.open(post.link, '_blank');
  }
};

const baseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 } }, scales: { x: { grid: { display: false }, ticks: { color: '#555' } }, y: { grid: { color: '#eee' }, ticks: { color: '#555' } } } };
const chartOptions = { ...baseChartOptions };
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#555', font: { size: 12 }, padding: 20 } } } };
const horizontalBarOptions = { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: '#eee' }, ticks: { color: '#555' } }, y: { grid: { display: false }, ticks: { color: '#555' } } } };

const bubbleChartOptions = computed(() => ({
  ...baseChartOptions,
  plugins: { ...baseChartOptions.plugins, legend: { display: true, position: 'top' } },
  scales: { x: { ...baseChartOptions.scales.x, title: { display: true, text: 'Visualizações' } }, y: { ...baseChartOptions.scales.y, title: { display: true, text: 'Curtidas' } } },
  onHover: (event, chartElement) => {
    const canvas = event.native.target;
    canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
  },
  onClick: (event, elements) => {
    handleChartClick(event, elements, bubbleChartPosts.value);
  }
}));
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

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
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

  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .full-width-card {
    grid-column: 1 / -1;
  }

  .chart-card {
    height: 420px;
    grid-column: span 1;
  }

  .chart-card:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .full-width-card {
    grid-column: span 6;
  }

  .chart-card {
    grid-column: span 2;
  }

  .medium-width-card {
    grid-column: span 3;
  }
}
</style>
