export const EMOTION_CONFIG = {
  Alegria: {
    color: '#2ecc71',
    keywords: [
      'gostei',
      'legal',
      'tmj',
      'parabéns',
      'kkkkk',
      'unidos',
      'sempre',
      'dominamos',
      'vai corinthians',
      '🦅',
      '👊🏼',
      '⚫⚪',
      'respeito',
      'obrigado',
      'show',
      'top',
      'massa',
      'boa',
      'isso',
      'vamoo',
      'lindo',
      'família',
      'melhor',
      'meu amor',
      'é nós',
      'parabens',
      'orgulho',
      'gigante',
      'raça',
      'campeão',
      'vencer',
    ],
  },
  Raiva: {
    color: '#e74c3c',
    keywords: [
      'correram',
      'vergonha',
      'ridículo',
      'lixo',
      'pior',
      'odeio',
      'tomaram',
      'lamentável',
      'piada',
      'fdp',
      'lixo',
      'time pequeno',
      'some',
      'fraco',
      'covardes',
      'merda',
      'vtnc',
      'humilhação',
      'acabou',
      'fora',
      'pipoqueiro',
      'incompetente',
      'desgraça',
      'violência',
      'briga',
      'morte',
      'ferido',
      'tumulto',
      'confusão',
      'bomba',
      'polícia',
      'invasão',
      'guerra',
    ],
  },
  Frustração: {
    color: '#9b59b6',
    keywords: [
      'decepção',
      'absurdo',
      'paciência',
      'desisto',
      'difícil',
      'complicado',
      'não aguento mais',
      'de novo',
      'sempre a mesma coisa',
      'que raiva',
    ],
  },
  Ansiedade: {
    color: '#e67e22',
    keywords: [
      'esperando',
      'ansioso',
      'cadê',
      'demora',
      'logo',
      'será que',
      'medo',
      'temer',
      'cuidado',
    ],
  },
}

export const allEmotions = ['Alegria', 'Raiva', 'Frustração', 'Ansiedade']

export const getEmotion = (text) => {
  if (!text) return 'Neutro'
  const lowerText = text.toLowerCase()

  for (const [emotion, { keywords }] of Object.entries(EMOTION_CONFIG)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return emotion
    }
  }
  return 'Neutro'
}
