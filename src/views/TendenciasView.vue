<template>
  <div class="dashboard-page">
    <header class="header-controls">
      <h1 class="main-title">Relatório de Análise de Tendências</h1>
      <div class="controls-group">
        <div class="file-selector">
          <label for="json-select">Fonte de Dados:</label>
          <select id="json-select" v-model="dataStore.selectedFile" @change="dataStore.loadData()"
            :disabled="dataStore.loading">
            <option v-for="file in dataStore.availableFiles" :key="file" :value="file">
              {{ file.replace('.json', '').replace('_', ' ') }}
            </option>
          </select>
        </div>
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
      <div class="filter-group">
        <label for="time-margin">Comparar Períodos:</label>
        <select id="time-margin" v-model="timeMarginInDays">
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
      </div>
    </div>
    <main class="dashboard-content">
      <div v-if="dataStore.loading" class="feedback-state">
        <div class="spinner"></div>
        <p>Analisando dados...</p>
      </div>
      <div v-else-if="dataStore.error" class="feedback-state error">
        <p>😕 Ocorreu um erro ao carregar os dados.</p>
        <pre>{{ dataStore.error }}</pre>
      </div>

      <div v-else-if="trendData.length > 0" class="chart-card">
        <h2 class="chart-title">Tópicos em Destaque: Evolução de Volume de Discussão</h2>
        <div class="trend-chart-container">
          <div v-for="item in trendData" :key="item.topic" class="trend-item">
            <span class="topic-label">{{ item.topic }}</span>
            <div class="bar-wrapper">
              <div class="bar-container">
                <div class="bar current" :style="{ width: item.currentPercent + '%' }">
                  <span class="bar-value">{{ item.current }}</span>
                </div>
                <div class="marker previous" :title="`Período Anterior: ${item.previous}`"
                  :style="{ left: item.previousPercent + '%' }"></div>
              </div>
              <span class="change-indicator" :class="getChangeClass(item.change)">
                {{ formatChange(item.change) }}
                <i v-if="isFinite(item.change) && item.change !== 0"
                  :class="item.change > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                <i v-else-if="item.change === Infinity" class="fas fa-infinity"></i>
              </span>
            </div>
          </div>
          <div class="axis" :style="{ paddingLeft: '200px' }"> <span v-for="tick in axisTicks" :key="tick">{{ tick
              }}</span>
          </div>
          <div class="legend">
            <span class="legend-item"><span class="color-box current"></span> Volume no Período Atual</span>
            <span class="legend-item"><span class="color-box previous"></span> Volume no Período Anterior</span>
          </div>
        </div>
      </div>
      <div v-else class="feedback-state">
        <p>Não há dados suficientes nos períodos de tempo selecionados para análise.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();
const timeMarginInDays = ref(7);

const TOPIC_CONFIG = {
  'Confronto e Rivalidade': { keywords: ['correram', 'guerra', 'ataque', 'bater', 'briga', 'luta', 'vingança', 'mancha'] },
  'Apoio e União': { keywords: ['unidos', 'sempre', 'irmão', 'tmj', 'apoio', 'torcida', 'respeito', 'corinthians', 'gaviões'] },
  'Organização e Eventos': { keywords: ['jogo', 'grupo', 'evento', 'final', 'campeonato', 'paulista', 'estádio'] },
  'Segurança': { keywords: ['polícia', 'segurança', 'violência', 'roubo', 'morte'] },
  'Política e Corrupção': { keywords: ['política', 'corrupção', 'vergonha', 'governo', 'pagar'] },
  'Geral': { keywords: [] }
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

// ATUALIZADO: Usa 'filteredPublications' e 'parsedDate'
const processedDataByDate = computed(() => {
  // USA OS DADOS JÁ FILTRADOS PELOS FILTROS GLOBAIS
  const publications = dataStore.filteredPublications;
  if (!publications || publications.length === 0) return [];

  const topicMentions = [];
  publications.forEach(post => {
    const date = post.parsedDate; // Usa data processada
    if (!date) return;

    const allPostComments = (post.comments || []).flatMap(c => [c, ...(c.replies || [])]);

    allPostComments.forEach(comment => {
      const fullText = `${post.description || ''} ${comment.text || ''}`;
      const topic = getTopicFromText(fullText);
      topicMentions.push({ date, topic });
    });
  });
  return topicMentions;
});

const trendData = computed(() => {
  const allMentions = processedDataByDate.value;
  if (allMentions.length === 0) return [];

  // A "última data" é a data mais recente NOS DADOS FILTRADOS
  // Se o usuário filtrou por uma data fim, ela será o limite.
  // Se não, será a última data dos dados.
  const latestDateInData = new Date(
    Math.max(...allMentions.map(mention => mention.date.getTime()))
  );

  const margin = Number(timeMarginInDays.value);

  const currentPeriodEnd = latestDateInData;
  const currentPeriodStart = new Date(currentPeriodEnd.getTime() - (margin - 1) * 24 * 60 * 60 * 1000);
  const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1 * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(previousPeriodEnd.getTime() - (margin - 1) * 24 * 60 * 60 * 1000);

  const topicCounts = {};
  Object.keys(TOPIC_CONFIG).forEach(topic => {
    topicCounts[topic] = { current: 0, previous: 0 };
  });

  allMentions.forEach(({ date, topic }) => {
    // Normaliza datas para ignorar horas/minutos
    const mentionDate = new Date(date.setHours(0, 0, 0, 0));

    if (mentionDate >= currentPeriodStart && mentionDate <= currentPeriodEnd) {
      if (topicCounts[topic]) topicCounts[topic].current++;
    } else if (mentionDate >= previousPeriodStart && mentionDate <= previousPeriodEnd) {
      if (topicCounts[topic]) topicCounts[topic].previous++;
    }
  });

  const maxVolume = Math.max(...Object.values(topicCounts).flatMap(v => [v.current, v.previous]), 1);

  return Object.entries(topicCounts)
    .map(([topic, counts]) => {
      const { current, previous } = counts;
      let change = 0;
      if (previous > 0) {
        change = ((current - previous) / previous) * 100;
      } else if (current > 0) {
        change = Infinity;
      }

      return {
        topic,
        current,
        previous,
        change,
        currentPercent: (current / maxVolume) * 100,
        previousPercent: (previous / maxVolume) * 100
      };
    })
    .filter(item => item.current > 0 || item.previous > 0)
    .sort((a, b) => b.current - a.current);
});

const axisTicks = computed(() => {
  if (trendData.value.length === 0) return [0, 0, 0, 0, 0];
  const maxVolume = Math.max(...trendData.value.flatMap(v => [v.current, v.previous]), 1);
  const niceMaxValue = Math.ceil(maxVolume / 4) * 4;
  if (niceMaxValue === 0) return [0, 0, 0, 0, 0];
  return Array.from({ length: 5 }, (_, i) => Math.round(i * (niceMaxValue / 4)));
});

const getChangeClass = (change) => {
  if (change === Infinity) return 'positive';
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
};

const formatChange = (change) => {
  if (change === Infinity) return '+∞%';
  if (isFinite(change)) return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
  return '0%';
};

onMounted(() => {
  if (dataStore.publications.length === 0) {
    dataStore.loadData();
  }
});
</script>

<style scoped>
/* Use os mesmos estilos de OpinioesView.vue, mas com as adições */
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
  gap: 1rem;
}

.main-title {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.file-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #fff;
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

.chart-card {
  background-color: #fff;
  padding: 2rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
}

.chart-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3rem;
}

.trend-chart-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 0 1rem;
}

.trend-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 1rem;
}

.topic-label {
  text-align: right;
  font-weight: 500;
  font-size: 1rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-container {
  position: relative;
  height: 28px;
  background-color: #e9ecef;
  width: 100%;
  border-radius: 4px;
  flex-grow: 1;
}

.bar.current {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #5b9bd5;
  border-radius: 4px;
  transition: width 0.5s ease-out;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.bar-value {
  padding-right: 8px;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.marker.previous {
  position: absolute;
  top: -4px;
  transform: translateX(-50%);
  width: 2px;
  height: calc(100% + 8px);
  background-color: #7f8c8d;
  transition: left 0.5s ease-out;
  z-index: 1;
}

.change-indicator {
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  width: 80px;
  text-align: left;
}

.change-indicator.positive {
  color: #27ae60;
}

.change-indicator.negative {
  color: #c0392b;
}

.change-indicator.neutral {
  color: #7f8c8d;
}

.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  border-top: 2px solid #dee2e6;
  padding-top: 8px;
  font-size: 0.8rem;
  color: #6c757d;
}

.legend {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .9rem;
}

.color-box {
  width: 15px;
  height: 15px;
  border-radius: 3px;
}

.color-box.current {
  background-color: #5b9bd5;
}

.color-box.previous {
  background-color: #7f8c8d;
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

@media (max-width: 768px) {

  .header-controls,
  .controls-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .trend-item {
    grid-template-columns: 1fr;
  }

  .topic-label {
    text-align: left;
    margin-bottom: 0.5rem;
  }

  .axis {
    padding-left: 0 !important;
  }
}
</style>
