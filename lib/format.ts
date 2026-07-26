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

// Derived rates (per match, per 10 min) keep a decimal where rounding would
// erase the difference — formatNumber turns 13.2 into "13" and 0.87 into "1".
export function formatRate(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 100) return formatNumber(value)
  if (abs >= 1) return value.toFixed(1)
  if (abs > 0) return value.toFixed(2)
  return '0'
}

export function formatKda(value: number): string {
  return value.toFixed(2)
}

export function formatHours(seconds: number): string {
  const h = seconds / 3600
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// '2026-05-18' -> 'May 18'
export function formatDayLabel(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${MONTHS[Number(m) - 1] ?? ''} ${Number(d)}`
}

/**
 * Absolute UTC stamp for API freshness. Deliberately not "2 hours ago": pages
 * are cached for an hour, so a relative string rendered on the server goes
 * stale inside the very HTML that states it.
 */
export function formatUtcStamp(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  const day = MONTHS[d.getUTCMonth()]
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${day} ${d.getUTCDate()}, ${hh}:${mm} UTC`
}

export const DIVISIONS = [
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'grandmaster',
  'champion',
]

// Inverse of rankToScore in lib/history.ts: score = divisionIndex * 5 + (6 - tier),
// so scores run 1..5 per division (tier 5 lowest, tier 1 highest). Offsetting by
// one before the divide matters: score 5 is BRZ1, not SIL6.
export function formatRankScore(score: number): string {
  if (score < 1) return ''
  const idx = Math.floor((score - 1) / 5)
  const tier = 6 - (score - idx * 5)
  const div = DIVISIONS[idx]
  if (!div || tier < 1 || tier > 5) return ''
  // Champion is a single tier with no divisions, so a tier number there would
  // be inventing structure the game doesn't have.
  if (div === 'champion') return 'CHAMP'
  return `${div.slice(0, 3).toUpperCase()}${tier}`
}

export function divisionLabel(index: number): string {
  return (DIVISIONS[index] ?? '').slice(0, 3).toUpperCase()
}
