<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Dashboard de Resumo</h1>
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

      <div v-if="!dataStore.error && dataStore.filteredPublications.length > 0" class="dashboard-summary">
        <div class="kpi-grid">
          <div class="kpi-card">
            <h3>Total de Publicações</h3>
            <p>{{ summaryStats.totalPublications }}</p>
            <i class="fas fa-file-alt kpi-icon"></i>
          </div>
          <div class="kpi-card">
            <h3>Total de Interações</h3>
            <p>{{ summaryStats.totalInteractions }}</p>
            <i class="fas fa-handshake kpi-icon"></i>
          </div>
          <div class="kpi-card">
            <h3>Total de Comentários</h3>
            <p>{{ summaryStats.totalComments }}</p>
            <i class="fas fa-comments kpi-icon"></i>
          </div>
          <div class="kpi-card">
            <h3>Média de Views</h3>
            <p>{{ summaryStats.avgViews }}</p>
            <i class="fas fa-eye kpi-icon"></i>
          </div>
          <div class="kpi-card">
            <h3>Média de Likes</h3>
            <p>{{ summaryStats.avgLikes }}</p>
            <i class="fas fa-thumbs-up kpi-icon"></i>
          </div>
          <div class="kpi-card">
            <h3>Média de Compart.</h3>
            <p>{{ summaryStats.avgShares }}</p>
            <i class="fas fa-share kpi-icon"></i>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Curtidas)</h2>
            <Bar :data="topLikesData" :options="topLikesOptions" />
          </div>
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Comentadas)</h2>
            <Bar :data="topCommentsData" :options="topCommentsOptions" />
          </div>
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Vistas)</h2>
            <Bar :data="topViewsData" :options="topViewsOptions" />
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
import { computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const dataStore = useDataStore();

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  dataStore.resetFilters();
};

const safeAvg = (total, count) => {
  if (count === 0) return 0;
  return (total / count);
};

const formatNumber = (num) => {
  if (num < 1000) return num.toFixed(0);
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
  return (num / 1000000).toFixed(1) + 'M';
};

const summaryStats = computed(() => {
  const pubs = dataStore.filteredPublications;
  const count = pubs.length;

  if (count === 0) {
    return {
      totalPublications: 0,
      totalInteractions: 0,
      totalComments: 0,
      avgViews: 0,
      avgLikes: 0,
      avgShares: 0,
    };
  }

  const totals = pubs.reduce((acc, post) => {
    acc.views += Number(post.views) || 0;
    acc.likes += Number(post.likes) || 0;
    acc.comments_count += Number(post.comments_count) || 0;
    acc.shares += Number(post.shares) || 0;
    acc.bookmarks += Number(post.bookmarks) || 0;
    acc.totalComments += (post.comments || []).reduce((commentCount, c) => {
      return commentCount + 1 + (c.replies || []).length;
    }, 0);
    return acc;
  }, { views: 0, likes: 0, comments_count: 0, shares: 0, bookmarks: 0, totalComments: 0 });

  const totalInteractions = totals.likes + totals.comments_count + totals.shares + totals.bookmarks;

  return {
    totalPublications: formatNumber(count),
    totalInteractions: formatNumber(totalInteractions),
    totalComments: formatNumber(totals.totalComments),
    avgViews: formatNumber(safeAvg(totals.views, count)),
    avgLikes: formatNumber(safeAvg(totals.likes, count)),
    avgShares: formatNumber(safeAvg(totals.shares, count)),
  };
});


const getTopPosts = (metric) => {
  const pubs = [...dataStore.filteredPublications];
  pubs.sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0));
  return pubs.slice(0, 5).reverse();
};

const formatChartData = (posts, metric, color) => {
  return {
    labels: posts.map(p => `#${p.publicacao_n} (${(p.description || 'Sem descrição').substring(0, 15)}...)`),
    datasets: [{
      label: `Total de ${metric}`,
      data: posts.map(p => Number(p[metric]) || 0),
      backgroundColor: color,
      borderRadius: 4,
    }]
  };
};

const topLikesPosts = computed(() => getTopPosts('likes'));
const topLikesData = computed(() => formatChartData(topLikesPosts.value, 'likes', '#27ae60'));

const topCommentsPosts = computed(() => getTopPosts('comments_count'));
const topCommentsData = computed(() => formatChartData(topCommentsPosts.value, 'comments_count', '#2980b9'));

const topViewsPosts = computed(() => getTopPosts('views'));
const topViewsData = computed(() => formatChartData(topViewsPosts.value, 'views', '#f39c12'));

const handleChartClick = (event, elements, posts) => {
  if (elements.length === 0) return;

  const dataIndex = elements[0].index;
  const post = posts[dataIndex];

  if (post && post.link) {
    window.open(post.link, '_blank');
  } else {
    console.warn('Link não encontrado para a publicação:', post);
  }
};

const baseBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 }
  },
  scales: {
    x: { grid: { color: '#eee' }, ticks: { color: '#555' } },
    y: { grid: { display: false }, ticks: { color: '#555' } }
  },
  onHover: (event, chartElement) => {
    const canvas = event.native.target;
    canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
  }
};

const topLikesOptions = computed(() => ({
  ...baseBarOptions,
  onClick: (event, elements) => {
    handleChartClick(event, elements, topLikesPosts.value);
  }
}));

const topCommentsOptions = computed(() => ({
  ...baseBarOptions,
  onClick: (event, elements) => {
    handleChartClick(event, elements, topCommentsPosts.value);
  }
}));

const topViewsOptions = computed(() => ({
  ...baseBarOptions,
  onClick: (event, elements) => {
    handleChartClick(event, elements, topViewsPosts.value);
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

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.kpi-card h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.kpi-card p {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1;
}

.kpi-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  color: #f0f3f5;
  transition: transform 0.3s ease;
}

.kpi-card:hover .kpi-icon {
  transform: scale(1.1) rotate(-5deg);
}

.charts-row {
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
  transition: box-shadow 0.2s ease;
}

.chart-card:hover {
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
  .kpi-grid {
    grid-template-columns: 1fr 1fr;
  }

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

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
  }

  .kpi-card p {
    font-size: 2.25rem;
  }

  .kpi-icon {
    font-size: 2.5rem;
  }
}

@media (min-width: 992px) {
  .charts-row {
    grid-template-columns: 1fr 1fr;
  }

  .chart-card {
    height: 420px;
  }

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (min-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
