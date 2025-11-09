export const TOPIC_CONFIG = {
  'Confronto e Rivalidade': {
    color: '#e57373',
    keywords: ['correram', 'guerra', 'ataque', 'bater', 'briga', 'luta', 'vingança', 'mancha'],
  },
  'Apoio e União': {
    color: '#64b5f6',
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
    ],
  },
  'Organização e Eventos': {
    color: '#ffb74d',
    keywords: ['jogo', 'grupo', 'evento', 'final', 'campeonato', 'paulista', 'estádio'],
  },
  Segurança: {
    color: '#b072d4',
    keywords: ['polícia', 'segurança', 'violência', 'roubo', 'morte'],
  },
  'Política e Corrupção': {
    color: '#f06292',
    keywords: ['política', 'corrupção', 'vergonha', 'governo', 'pagar'],
  },
  Geral: {
    color: '#4db6ac',
    keywords: [],
  },
}

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
