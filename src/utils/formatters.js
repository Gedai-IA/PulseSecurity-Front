export const formatNumber = (numStr) => {
  const num = Number(numStr) || 0
  if (num < 1000) return num.toFixed(0)
  if (num < 1000000) return (num / 1000).toFixed(1).replace('.0', '') + 'k'
  return (num / 1000000).toFixed(1).replace('.0', '') + 'M'
}

export const formatChange = (change) => {
  if (change === Infinity) return '+∞%'
  if (isFinite(change)) return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
  return '0%'
}
