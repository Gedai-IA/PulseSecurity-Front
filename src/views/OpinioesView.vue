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
          <div class="chart-header">
            <h2 class="chart-title">Análise de Emoções</h2>
            <button v-if="selectedEmotion" @click="resetEmotionFilter" class="btn-reset-chart">
              Limpar
            </button>
          </div>
          <Doughnut v-if="sentimentData.labels.length" :data="sentimentData" :options="doughnutOptions"
            @click="handleDoughnutClick" ref="doughnutChartRef" />
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h2 class="chart-title">
              {{ selectedEmotion ? `Emoção "${selectedEmotion}" ao Longo do Tempo` : 'Emoções ao Longo do Tempo' }}
            </h2>
          </div>
          <Line v-if="finalEmotionsOverTimeData.labels.length" :data="finalEmotionsOverTimeData"
            :options="chartOptions" />
          <div v-else class="no-chart-data">Sem dados de emoção para exibir.</div>
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
// Imports atualizados
import { computed, onMounted, ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Bar, Line, Bubble, Doughnut } from 'vue-chartjs';
// Imports de ChartJS (adicionado BubbleController)
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BubbleController } from 'chart.js';
// Import para interatividade do gráfico
import { getElementAtEvent } from 'vue-chartjs';

// Registra todos os componentes necessários
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BubbleController);

const dataStore = useDataStore();

// --- 1. Refs para Interatividade (NOVOS) ---
const doughnutChartRef = ref(null);
const selectedEmotion = ref(null);

// --- 2. Lógica de Emoções (COPIADA DA TELA 'emocoes.vue') ---
const EMOTION_CONFIG = {
  Alegria: {
    color: '#2ecc71',
    keywords: ['gostei', 'legal', 'tmj', 'parabéns', 'kkkkk', 'unidos', 'sempre', 'dominamos', 'vai corinthians', '🦅', '👊🏼', '⚫⚪', 'respeito', 'obrigado', 'show', 'top', 'massa', 'boa', 'isso', 'vamoo', 'lindo', 'família', 'melhor', 'meu amor', 'é nós', 'parabens', 'orgulho', 'gigante', 'raça', 'campeão', 'vencer']
  },
  Raiva: {
    color: '#e74c3c',
    keywords: ['correram', 'vergonha', 'ridículo', 'lixo', 'pior', 'odeio', 'tomaram', 'lamentável', 'piada', 'fdp', 'lixo', 'time pequeno', 'some', 'fraco', 'covardes', 'merda', 'vtnc', 'humilhação', 'acabou', 'fora', 'pipoqueiro', 'incompetente', 'desgraça', 'violência', 'briga', 'morte', 'ferido', 'tumulto', 'confusão', 'bomba', 'polícia', 'invasão', 'guerra']
  },
  Frustração: {
    color: '#9b59b6',
    keywords: ['decepção', 'absurdo', 'paciência', 'desisto', 'difícil', 'complicado', 'não aguento mais', 'de novo', 'sempre a mesma coisa', 'que raiva']
  },
  Ansiedade: {
    color: '#e67e22',
    keywords: ['esperando', 'ansioso', 'cadê', 'demora', 'logo', 'será que', 'medo', 'temer', 'cuidado']
  }
};
const allEmotions = ['Alegria', 'Raiva', 'Frustração', 'Ansiedade'];

const getEmotion = (text) => {
  if (!text) return 'Neutro';
  const lowerText = text.toLowerCase();
  for (const [emotion, { keywords }] of Object.entries(EMOTION_CONFIG)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return emotion;
    }
  }
  return 'Neutro';
};

// --- 3. Dados Processados ---

// Helper atualizado para incluir data e emoção, descartando neutros
const allCommentsWithEmotion = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    const date = post.parsedDate;
    if (!date) return [];

    return allPostComments.map(comment => ({
      postDate: date,
      emotion: getEmotion(comment.text || ''),
    }));
  }).filter(item => item.emotion !== 'Neutro'); // <-- DESCARTE DE NEUTRO
});


onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  dataStore.resetFilters();
  resetEmotionFilter(); // <-- Adicionado
};

// NOVO: Limpa o filtro de emoção
const resetEmotionFilter = () => {
  selectedEmotion.value = null;
};

// NOVO: Handler de clique na Pizza
const handleDoughnutClick = (event) => {
  const chart = doughnutChartRef.value?.chart;
  if (!chart) return;
  const elements = getElementAtEvent(chart, event);
  if (elements.length > 0) {
    const { index } = elements[0];
    const newEmotion = sentimentData.value.labels[index];
    selectedEmotion.value = selectedEmotion.value === newEmotion ? null : newEmotion;
  }
};

// --- 4. Computeds dos Gráficos ---

// 'sentimentData' (Gráfico de Pizza) - LÓGICA ATUALIZADA
const sentimentData = computed(() => {
  const counts = { Alegria: 0, Raiva: 0, Frustração: 0, Ansiedade: 0 };
  allCommentsWithEmotion.value.forEach(item => {
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

// Dados BASE para o Gráfico de Linha de Emoções (NOVO)
const emotionsOverTimeData = computed(() => {
  const dataByDate = {};
  allCommentsWithEmotion.value.forEach(item => {
    const dateKey = item.postDate.toISOString().split('T')[0];
    if (!dataByDate[dateKey]) {
      dataByDate[dateKey] = { Alegria: 0, Raiva: 0, Frustração: 0, Ansiedade: 0 };
    }
    dataByDate[dateKey][item.emotion]++;
  });
  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels: sortedDates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: allEmotions.map(emotion => ({
      label: emotion,
      data: sortedDates.map(date => dataByDate[date][emotion] || 0),
      borderColor: EMOTION_CONFIG[emotion].color,
      backgroundColor: `${EMOTION_CONFIG[emotion].color}33`,
      fill: true,
      tension: 0.4
    }))
  };
});

// Dados FINAIS para o Gráfico de Linha de Emoções (filtrado) (NOVO)
const finalEmotionsOverTimeData = computed(() => {
  if (!selectedEmotion.value) {
    return emotionsOverTimeData.value; // Mostra tudo
  }
  return {
    ...emotionsOverTimeData.value,
    datasets: emotionsOverTimeData.value.datasets.filter(
      ds => ds.label === selectedEmotion.value
    )
  };
});

// 'wordFrequencyData' (Sem alteração)
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

// 'totalEngagementData' (REMOVIDO DOS GRÁFICOS, MAS MANTIDO CASO VOCÊ QUEIRA USAR DEPOIS)
// (O gráfico foi substituído pela linha do tempo de emoções)
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

// 'postsOverTimeData' (Sem alteração)
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

// 'topTagsData' (Sem alteração)
const topTagsData = computed(() => {
  const tagCounts = {};
  dataStore.filteredPublications.flatMap(p => p.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
  const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  return {
    labels: sortedTags.map(([tag]) => tag),
    datasets: [{ label: 'Ocorrências', data: sortedTags.map(([, count]) => count), backgroundColor: '#16a085' }]
  };
});

// 'bubbleChartPosts' (Sem alteração)
const bubbleChartPosts = computed(() => dataStore.filteredPublications);

// 'engagementCorrelationData' (Sem alteração - adicionei 'link' para o clique)
const engagementCorrelationData = computed(() => {
  const data = bubbleChartPosts.value.map(post => ({
    x: Number(post.views) || 0,
    y: Number(post.likes) || 0,
    r: (Number(post.comments_count) || 0) * 0.5 + 5,
    link: post.url // Adiciona o link para o clique
  }));

  return {
    datasets: [{ label: 'Publicações (Tamanho por Comentários)', data, backgroundColor: 'rgba(192, 57, 43, 0.6)' }]
  };
});

// 'handleChartClick' (Atualizado para pegar 'link' do dataPoint)
const handleChartClick = (event, elements, posts) => {
  if (elements.length === 0) return;
  const dataIndex = elements[0].index;
  // 'posts' é passado pelo 'bubbleChartOptions'
  const post = posts[dataIndex];
  if (post && post.link) {
    window.open(post.link, '_blank', 'noopener,noreferrer');
  }
};


// --- 5. Opções dos Gráficos ---

const baseChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 } }, scales: { x: { grid: { display: false }, ticks: { color: '#555' } }, y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { color: '#555' } } } };
const chartOptions = { ...baseChartOptions };

// Opções da Pizza (Doughnut) - Atualizado com Tooltip de Porcentagem
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#555', font: { size: 12 }, padding: 20 } },
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

const horizontalBarOptions = { ...baseChartOptions, indexAxis: 'y', scales: { x: { grid: { color: '#eee' }, ticks: { color: '#555' } }, y: { grid: { display: false }, ticks: { color: '#555' } } } };

// Opções da Bolha (Bubble) - Atualizado com 'onClick'
const bubbleChartOptions = computed(() => ({
  ...baseChartOptions,
  plugins: { ...baseChartOptions.plugins, legend: { display: true, position: 'top' } },
  scales: { x: { ...baseChartOptions.scales.x, title: { display: true, text: 'Visualizações' } }, y: { ...baseChartOptions.scales.y, title: { display: true, text: 'Curtidas' } } },
  onHover: (event, chartElement) => {
    const canvas = event.native?.target;
    if (canvas) {
      canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
    }
  },
  onClick: (event, elements) => {
    // Passa os posts corretos para o handler
    handleChartClick(event, elements, bubbleChartPosts.value);
  }
}));
</script>

<style scoped>
/* Estilos originais */
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

/* --- ESTILOS ADICIONADOS --- */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  /* Substitui o margin-bottom do chart-title */
  gap: 1rem;
}

.chart-header .chart-title {
  margin-bottom: 0;
  text-align: left;
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

.no-chart-data {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: var(--text-secondary);
  font-style: italic;
}


/* --- Media Queries (Originais) --- */
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
