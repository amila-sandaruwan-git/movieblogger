export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return 'Recently' }
}

export const formatShortDate = (dateString: string): string => {
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return 'Recently' }
}

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toString()
}

export const formatRelativeTime = (dateString: string): string => {
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'Recently'
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatShortDate(dateString)
  } catch { return 'Recently' }
}

export const formatTMDbRating = (rating: number | null) => {
  if (!rating) return null
  const stars = Math.round(rating / 2)
  return {
    stars: '★'.repeat(stars) + '☆'.repeat(5 - stars),
    numeric: rating.toFixed(1),
  }
}

export const truncateText = (text: string, max: number): string =>
  text.length <= max ? text : text.substring(0, max) + '...'

export const getYearFromDate = (dateString: string): string => {
  try {
    const d = new Date(dateString)
    return isNaN(d.getTime()) ? '' : d.getFullYear().toString()
  } catch { return '' }
}