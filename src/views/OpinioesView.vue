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

      <div v-else class="feedback-state">
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

// ATUALIZADO: Usa 'filteredPublications'
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

  // ATUALIZADO: Usa 'filteredPublications'
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
  // ATUALIZADO: Usa 'filteredPublications'
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
  // ATUALIZADO: Usa 'filteredPublications' e 'parsedDate'
  dataStore.filteredPublications.forEach(post => {
    const date = post.parsedDate; // Usa a data já processada
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
  // ATUALIZADO: Usa 'filteredPublications'
  dataStore.filteredPublications.flatMap(p => p.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  return {
    labels: sortedTags.map(([tag]) => tag),
    datasets: [{ label: 'Ocorrências', data: sortedTags.map(([, count]) => count), backgroundColor: '#16a085' }]
  };
});

const engagementCorrelationData = computed(() => {
  // ATUALIZADO: Usa 'filteredPublications'
  const data = dataStore.filteredPublications.map(post => ({
    x: Number(post.views) || 0,
    y: Number(post.likes) || 0,
    r: (Number(post.comments_count) || 0) * 0.5 + 5
  }));

  return {
    datasets: [{ label: 'Publicações (Tamanho por Comentários)', data, backgroundColor: 'rgba(192, 57, 43, 0.6)' }]
  };
});

// Opções dos gráficos
const baseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 } }, scales: { x: { grid: { display: false }, ticks: { color: '#555' } }, y: { grid: { color: '#eee' }, ticks: { color: '#555' } } } };
const chartOptions = { ...baseChartOptions };
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#555', font: { size: 12 }, padding: 20 } } } };
const horizontalBarOptions = { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: '#eee' }, ticks: { color: '#555' } }, y: { grid: { display: false }, ticks: { color: '#555' } } } };
const bubbleChartOptions = { ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: true, position: 'top' } }, scales: { x: { ...baseChartOptions.scales.x, title: { display: true, text: 'Visualizações' } }, y: { ...baseChartOptions.scales.y, title: { display: true, text: 'Curtidas' } } } };
</script>

<style scoped>
/* Copie os estilos do seu arquivo original */
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
  grid-template-columns: repeat(3, 1fr);
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
}

.medium-width-card {
  grid-column: span 1;
}

.medium-width-card:last-child:nth-child(odd) {
  grid-column-start: 2;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  text-align: center;
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

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .full-width-card,
  .medium-width-card {
    grid-column: span 2;
  }

  .chart-card {
    grid-column: span 1;
  }

  .chart-card:last-child:nth-child(odd) {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .chart-card,
  .full-width-card,
  .medium-width-card {
    grid-column: span 1 !important;
  }

  .header-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .main-title {
    font-size: 1.75rem;
  }
}
</style>
