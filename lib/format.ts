export function formatTime(seconds: number): { value: string; unit: string } {
  if (seconds < 60) return { value: String(seconds), unit: 's' }
  if (seconds < 3600) return { value: String(Math.floor(seconds / 60)), unit: 'm' }
  if (seconds < 36000) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return { value: `${h}h ${m}`, unit: 'm' }
  }
  return { value: String(Math.floor(seconds / 3600)), unit: 'h' }
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(Math.round(value))
}

export function formatKda(value: number): string {
  return value.toFixed(2)
}
