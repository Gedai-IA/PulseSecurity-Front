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

    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>

      <div v-else-if="dataStore.error" class="feedback-state error">
        <p>Ocorreu um erro ao carregar os dados.</p>
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
            <select v-model="selectedTopicForWordCloud">
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

      <div v-else class="feedback-state">
        <p>Nenhum dado encontrado para a fonte selecionada.</p>
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
  return dataStore.publications.flatMap(post => {
    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);
    const date = safeParseDate(post.date);
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

const stackedAreaData = computed(() => {
  const dataByDate = {};
  processedData.value.forEach(p => {
    if (!dataByDate[p.date]) dataByDate[p.date] = {};
    allTopics.value.forEach(topic => dataByDate[p.date][topic] = dataByDate[p.date][topic] || 0);
    dataByDate[p.date][p.topic]++;
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
const groupedBarOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true } } };
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
  text-transform: capitalize;
}

.dashboard-grid-topicos {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.full-width {
  grid-column: 1/-1;
}

.chart-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.chart-card .card-header .chart-title {
  text-align: left;
}

.chart-card .card-header select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.word-cloud-container {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px 12px;
  padding: 1rem;
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
  .dashboard-grid-topicos {
    grid-template-columns: 1fr;
  }
}
</style>
