/* src/utils/topicClassifier.js */

export const TOPIC_CONFIG = {
  'Ameaças e Riscos': {
    color: '#c0392b',
    keywords: [
      'guerra',
      'ataque',
      'bater',
      'briga',
      'luta',
      'vingança',
      'morte',
      'ferido',
      'tumulto',
      'confusão',
      'invasão',
      'emboscada',
      'vai morrer',
      'matar',
      'mct',
      'bct',
      'gdf',
      'pista',
    ],
  },
  'Rivalidade Esportiva': {
    color: '#e67e22',
    keywords: [
      'correram',
      'mancha',
      'porko',
      'palmeiras',
      'sem mundial',
      'freguês',
      'trikas',
      'bambis',
    ],
  },
  'Segurança (Policial)': {
    color: '#f1c40f',
    keywords: ['polícia', 'segurança', 'violência', 'roubo', 'bomba', 'choque', 'pm', 'viatura'],
  },
  'Apoio e União': {
    color: '#2ecc71',
    keywords: [
      'unidos',
      'sempre',
      'irmão',
      'tmj',
      'apoio',
      'torcida',
      'respeito',
      'corinthians',
      'gaviões',
      'fiel',
      'orgulho',
    ],
  },
  'Organização e Eventos': {
    color: '#3498db',
    keywords: [
      'jogo',
      'grupo',
      'evento',
      'final',
      'campeonato',
      'paulista',
      'estádio',
      'caravana',
      'ingresso',
      'bandeira',
    ],
  },
  'Política e Gestão': {
    color: '#9b59b6',
    keywords: [
      'política',
      'corrupção',
      'vergonha',
      'governo',
      'pagar',
      'diretoria',
      'augusto melo',
      'presidente',
      'fora',
      'eleição',
    ],
  },
  Geral: {
    color: '#95a5a6',
    keywords: [],
  },
}

// NOVO: Exportando a lista de nomes de tópicos
export const allTopics = Object.keys(TOPIC_CONFIG)

export const getTopicFromText = (text) => {
  if (!text) return 'Geral'
  const lowerText = text.toLowerCase()

  for (const [topic, { keywords }] of Object.entries(TOPIC_CONFIG)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return topic
    }
  }
  return 'Geral'
}
