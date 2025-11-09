/* src/utils/sentimentClassifier.js */

export const SENTIMENT_CONFIG = {
  Positivo: {
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
      'ganhamos',
    ],
  },
  Negativo: {
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
      'invasão',
      'guerra',
      'perdemos',
      'lixos',
    ],
  },
}

export const allSentiments = ['Positivo', 'Negativo']

export const getSentiment = (text) => {
  if (!text) return 'Neutro'
  const lowerText = text.toLowerCase()

  for (const keyword of SENTIMENT_CONFIG.Negativo.keywords) {
    if (lowerText.includes(keyword)) {
      return 'Negativo'
    }
  }

  for (const keyword of SENTIMENT_CONFIG.Positivo.keywords) {
    if (lowerText.includes(keyword)) {
      return 'Positivo'
    }
  }

  return 'Neutro'
}
