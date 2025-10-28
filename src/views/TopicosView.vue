<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Relatório de Análise de Tópicos</h1>
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

      <div v-else-if="processedData.length > 0" class="dashboard-grid-topicos">
        <div class="chart-card">
          <h2 class="chart-title">Evolução da Proporção de Discussões</h2>
          <Line :data="stackedAreaData" :options="stackedAreaOptions" />
        </div>
        <div class="chart-card">
          <h2 class="chart-title">Distribuição de Emoções por Tópico</h2>
          <Bar :data="emotionsByTopicData" :options="groupedBarOptions" />
        </div>
        <div class="chart-card full-width">
          <div class="card-header">
            <h2 class="chart-title">Nuvem de Palavras por Tópico</h2>
            <select v-model="selectedTopicForWordCloud" class="topic-select">
              <option v-for="topic in allTopics" :key="topic" :value="topic">{{ topic }}</option>
            </select>
          </div>
          <div class="word-cloud-container">
            <span v-if="wordCloudData.length === 0">Nenhuma palavra encontrada para este tópico.</span>
            <span v-for="word in wordCloudData" :key="word.text"
              :style="{ fontSize: word.size + 'px', color: word.color, opacity: word.opacity, fontWeight: word.weight }">
              {{ word.text }}
            </span>
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
import { ref, onMounted, computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Line, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, BarElement, CategoryScale, LinearScale, Filler);

const dataStore = useDataStore();

const TOPIC_CONFIG = {
  'Confronto e Rivalidade': { color: '#e57373', keywords: ['correram', 'guerra', 'ataque', 'bater', 'briga', 'luta', 'vingança', 'mancha'] },
  'Apoio e União': { color: '#64b5f6', keywords: ['unidos', 'sempre', 'irmão', 'tmj', 'apoio', 'torcida', 'respeito', 'corinthians', 'gaviões'] },
  'Organização e Eventos': { color: '#ffb74d', keywords: ['jogo', 'grupo', 'evento', 'final', 'campeonato', 'paulista', 'estádio'] },
  'Geral': { color: '#4db6ac', keywords: [] }
};

const EMOTION_CONFIG = {
  Alegria: { color: '#2ecc71', keywords: ['gostei', 'legal', 'tmj', 'parabéns', 'kkkkk', 'unidos', 'sempre', 'dominamos', 'vai corinthians', '🦅', '👊🏼'] },
  Raiva: { color: '#e74c3c', keywords: ['correram', 'vergonha', 'ridículo', 'lixo', 'pior', 'odeio', 'tomaram'] },
  Frustração: { color: '#9b59b6', keywords: ['vingança', 'decepção', 'absurdo', '...'] },
  Neutro: { color: '#95a5a6', keywords: [] }
};

const allTopics = ref(Object.keys(TOPIC_CONFIG));
const allEmotions = ref(Object.keys(EMOTION_CONFIG));
const selectedTopicForWordCloud = ref(allTopics.value[0]);

const getTopicFromText = (text) => {
  if (!text) return 'Geral';
  const lowerText = text.toLowerCase();
  for (const [topic, { keywords }] of Object.entries(TOPIC_CONFIG)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return topic;
    }
  }
  return 'Geral';
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

const processedData = computed(() => {
  return dataStore.filteredPublications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    const date = post.parsedDate;
    if (!date) return [];

    return allPostComments.map(comment => ({
      date: date.toISOString().split('T')[0],
      text: `${post.description || ''} ${comment.text || ''}`,
      topic: getTopicFromText(`${post.description || ''} ${comment.text || ''}`),
      emotion: getEmotionFromText(comment.text || ''),
    }));
  });
});

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});

const resetAllFilters = () => {
  dataStore.resetFilters();
  selectedTopicForWordCloud.value = allTopics.value[0];
};

const stackedAreaData = computed(() => {
  const dataByDate = {};
  processedData.value.forEach(p => {
    if (!dataByDate[p.date]) dataByDate[p.date] = {};
    allTopics.value.forEach(topic => dataByDate[p.date][topic] = dataByDate[p.date][topic] || 0);
    if (dataByDate[p.date][p.topic] !== undefined) {
      dataByDate[p.date][p.topic]++;
    }
  });
  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));
  return {
    labels: sortedDates.map(d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })),
    datasets: allTopics.value.map(topic => ({
      label: topic,
      data: sortedDates.map(date => (dataByDate[date][topic] || 0)),
      borderColor: TOPIC_CONFIG[topic].color,
      backgroundColor: TOPIC_CONFIG[topic].color,
      fill: true,
      tension: 0.2
    }))
  };
});

const emotionsByTopicData = computed(() => {
  const data = {};
  allTopics.value.forEach(t => {
    data[t] = {};
    allEmotions.value.forEach(e => data[t][e] = 0);
  });
  processedData.value.forEach(p => {
    if (data[p.topic] && data[p.topic][p.emotion] !== undefined) {
      data[p.topic][p.emotion]++;
    }
  });
  return {
    labels: allTopics.value,
    datasets: allEmotions.value.map(emotion => ({
      label: emotion,
      data: allTopics.value.map(topic => data[topic][emotion]),
      backgroundColor: EMOTION_CONFIG[emotion].color
    }))
  };
});

const wordCloudData = computed(() => {
  const stopwords = new Set(['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ser', 'ter']);
  const wordCounts = {};
  const filteredText = processedData.value
    .filter(p => p.topic === selectedTopicForWordCloud.value)
    .map(p => p.text)
    .join(' ');

  filteredText.toLowerCase().replace(/[^a-zà-ú\s]/g, '').split(/\s+/).filter(word => word.length > 3 && !stopwords.has(word)).forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  const sortedWords = Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 50);
  const max = sortedWords[0]?.[1] || 1;
  const topicColor = TOPIC_CONFIG[selectedTopicForWordCloud.value]?.color || '#333';

  return sortedWords.map(([text, value]) => ({
    text,
    value,
    size: 14 + (value / max) * 40,
    opacity: 0.6 + (value / max) * 0.4,
    weight: 400 + Math.round((value / max) * 4) * 100,
    color: topicColor
  }));
});

const stackedAreaOptions = { responsive: true, maintainAspectRatio: false, scales: { y: { stacked: true } }, plugins: { legend: { position: 'top' } } };
const groupedBarOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: false }, y: { stacked: false } } };
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

.dashboard-grid-topicos {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.chart-card {
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  height: 450px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.card-header .chart-title {
  text-align: left;
}

.card-header .topic-select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: #fff;
  width: 100%;
}

.word-cloud-container {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px 12px;
  padding: 1rem 0;
  overflow-y: auto;
  line-height: 1.2;
}

.word-cloud-container span {
  display: inline-block;
  transition: transform 0.2s ease;
}

.word-cloud-container span:hover {
  transform: scale(1.1);
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
}

@media (min-width: 992px) {
  .dashboard-grid-topicos {
    grid-template-columns: 1fr 1fr;
  }

  .full-width {
    grid-column: 1/-1;
  }

  .chart-title {
    font-size: 1.25rem;
  }

  .card-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
  }

  .card-header .topic-select {
    width: auto;
    min-width: 200px;
  }
}
</style>
