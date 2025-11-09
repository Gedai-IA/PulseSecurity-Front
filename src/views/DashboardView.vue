<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Dashboard PulseSecurity</h1>
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
            <i class="fas fa-file-alt kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Total de Publicações</h3>
              <p class="kpi-value">{{ summaryStats.totalPublications }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-handshake kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Total de Interações</h3>
              <p class="kpi-value">{{ summaryStats.totalInteractions }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-comments kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Total de Comentários</h3>
              <p class="kpi-value">{{ summaryStats.totalComments }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-eye kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Média de Views / Post</h3>
              <p class="kpi-value">{{ summaryStats.avgViews }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-thumbs-up kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Média de Likes / Post</h3>
              <p class="kpi-value">{{ summaryStats.avgLikes }}</p>
            </div>
          </div>
          <div class="kpi-card">
            <i class="fas fa-share kpi-icon"></i>
            <div>
              <h3 class="kpi-title">Média de Compart. / Post</h3>
              <p class="kpi-value">{{ summaryStats.avgShares }}</p>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Curtidas)</h2>
            <Bar :data="topLikesData" :options="topLikesOptions" ref="topLikesChartRef" class="clickable-chart" />
          </div>
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Comentadas)</h2>
            <Bar :data="topCommentsData" :options="topCommentsOptions" ref="topCommentsChartRef"
              class="clickable-chart" />
          </div>
          <div class="chart-card">
            <h2 class="chart-title">Top 5 (Mais Vistas)</h2>
            <Bar :data="topViewsData" :options="topViewsOptions" ref="topViewsChartRef" class="clickable-chart" />
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
import { computed, onMounted, ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Bar } from 'vue-chartjs';
import { getElementAtEvent } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { formatNumber } from '@/utils/formatters.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const dataStore = useDataStore();

const topLikesChartRef = ref(null);
const topCommentsChartRef = ref(null);
const topViewsChartRef = ref(null);

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  if (typeof dataStore.resetFilters === 'function') {
    dataStore.resetFilters();
  } else {
    dataStore.startDate = dataStore.minDate;
    dataStore.endDate = dataStore.maxDate;
    dataStore.selectedTag = 'Todas';
  }
};

const safeAvg = (total, count) => {
  if (!count || count === 0) return 0;
  return (total / count);
};

const summaryStats = computed(() => {
  const pubs = dataStore.filteredPublications;
  const count = pubs.length;

  if (count === 0) {
    return {
      totalPublications: '0', totalInteractions: '0', totalComments: '0',
      avgViews: '0', avgLikes: '0', avgShares: '0',
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
  return [...dataStore.filteredPublications]
    .sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0))
    .slice(0, 5)
    .reverse();
};

const formatChartData = (posts, metric, color) => {
  return {
    labels: posts.map(p => `#${p.publicacao_n}`),
    datasets: [{
      label: `Total`,
      data: posts.map(p => Number(p[metric]) || 0),
      backgroundColor: color,
      borderRadius: 4,
      postDescriptions: posts.map(p => p.description || 'Sem descrição')
    }]
  };
};

const topLikesPosts = computed(() => getTopPosts('likes'));
const topLikesData = computed(() => formatChartData(topLikesPosts.value, 'likes', '#27ae60'));

const topCommentsPosts = computed(() => getTopPosts('comments_count'));
const topCommentsData = computed(() => formatChartData(topCommentsPosts.value, 'comments_count', '#2980b9'));

const topViewsPosts = computed(() => getTopPosts('views'));
const topViewsData = computed(() => formatChartData(topViewsPosts.value, 'views', '#f39c12'));

const handleChartClick = (event, chartRef, posts) => {
  const chart = chartRef.value?.chart;
  if (!chart) return;

  const elements = getElementAtEvent(chart, event);
  if (elements.length === 0) return;

  const { index } = elements[0];
  const post = posts[index];

  if (post && post.url) {
    window.open(post.url, '_blank', 'noopener,noreferrer');
  } else {
    console.warn('URL não encontrado para a publicação:', post);
  }
};

const createBarOptions = (postsRef, chartRef) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#333',
      titleFont: { size: 14 },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        title: function (tooltipItems) {
          const index = tooltipItems[0].dataIndex;
          const label = tooltipItems[0].chart.data.labels[index];
          const description = tooltipItems[0].dataset.postDescriptions[index];
          return `${label}: ${description.substring(0, 50)}...`;
        },
        label: function (context) {
          return ` ${context.dataset.label}: ${formatNumber(context.parsed.x)}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: { color: '#eee' },
      ticks: {
        color: '#555',
        callback: function (value) { return formatNumber(value); }
      }
    },
    y: { grid: { display: false }, ticks: { color: '#555' } }
  },
  onHover: (event, chartElement) => {
    const canvas = event.native?.target;
    if (canvas) canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
  },
  onClick: (event) => handleChartClick(event, chartRef, postsRef.value)
});

const topLikesOptions = computed(() => createBarOptions(topLikesPosts, topLikesChartRef));
const topCommentsOptions = computed(() => createBarOptions(topCommentsPosts, topCommentsChartRef));
const topViewsOptions = computed(() => createBarOptions(topViewsPosts, topViewsChartRef));
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

.header-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
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
  gap: 0.75rem;
  background-color: var(--card-bg);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  box-sizing: border-box;
}

.file-selector label {
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  font-size: 0.9rem;
}

.file-selector select {
  padding: .5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-transform: capitalize;
  min-width: 180px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  background-color: #fff;
  padding: 1rem 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
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
.filter-group select {
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #fff;
  color: var(--text-primary);
  height: 38px;
}

.filter-group input:disabled,
.filter-group select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
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

.reset-btn i {
  font-size: 0.8em;
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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.kpi-icon {
  font-size: 1.8rem;
  color: var(--primary-color);
  opacity: 0.7;
  flex-shrink: 0;
}

.kpi-card div {
  text-align: left;
}

.kpi-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
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
  height: 400px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 1.0rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
  text-align: center;
  margin-top: 0;
}

.clickable-chart {
  cursor: pointer;
}

@media (min-width: 768px) {
  .dashboard-page {
    padding: 2rem;
  }

  .main-title {
    font-size: 2rem;
  }

  .kpi-grid {
    gap: 1.5rem;
  }

  .kpi-title {
    font-size: 0.9rem;
  }

  .kpi-value {
    font-size: 1.8rem;
  }

  .kpi-icon {
    font-size: 2rem;
  }
}

@media (min-width: 992px) {
  .charts-row {
    grid-template-columns: 1fr 1fr;
  }

  .chart-card {
    height: 420px;
  }
}

@media (min-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
