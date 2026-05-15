import type { PlayerStatsSummary, StatsSummary } from '@/types/overfast'

export type PercentileBand = 'top' | 'mid' | 'warn'
export type PercentileResult = { band: PercentileBand; label: string }

const BANDS: Record<string, [number, number, number]> = {
  winrate: [45, 52, 58],
  kda: [2.2, 3.2, 4.5],
  elims_per_10: [16, 22, 28],
  damage_per_10: [7000, 10000, 13000],
  healing_per_10: [6000, 9000, 12000],
  deaths_per_10: [9, 7, 5],
}

export function percentile(stat: keyof typeof BANDS, value: number): PercentileResult {
  const [, midUpper, topFloor] = BANDS[stat]
  const inverted = stat === 'deaths_per_10'

  if (inverted) {
    if (value <= topFloor) return { band: 'top', label: `Top ${rangeMid(5, 20)}%` }
    if (value <= midUpper) return { band: 'mid', label: `Avg ${rangeMid(35, 65)}%` }
    return { band: 'warn', label: `Bottom ${rangeMid(10, 25)}%` }
  }

  if (value >= topFloor) return { band: 'top', label: `Top ${rangeMid(5, 20)}%` }
  if (value >= midUpper) return { band: 'mid', label: `Avg ${rangeMid(35, 65)}%` }
  return { band: 'warn', label: `Bottom ${rangeMid(10, 25)}%` }
}

function rangeMid(lo: number, hi: number): number {
  return lo + Math.floor((hi - lo) / 2)
}

export type RosterObservation = { heroKey: string; pill: string }

export function observeRoster(stats: PlayerStatsSummary): RosterObservation[] {
  const obs: RosterObservation[] = []
  const heroes = Object.entries(stats.heroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played
  )

  const top5 = heroes.slice(0, 5)
  if (top5.length > 0) {
    const bestWr = top5.reduce((a, b) => (a[1].winrate > b[1].winrate ? a : b))
    if (bestWr[1].winrate >= 50) {
      obs.push({ heroKey: bestWr[0], pill: '★ BEST WR' })
    }
  }

  return obs
}

export type CombatAnnotation = string | null

export function observeCombat(
  heroStats: StatsSummary,
  generalStats: StatsSummary,
  stat: 'elims' | 'damage' | 'final_blows' | 'deaths'
): CombatAnnotation {
  const heroValue =
    stat === 'elims'
      ? heroStats.average.eliminations
      : stat === 'damage'
        ? heroStats.average.damage
        : stat === 'deaths'
          ? heroStats.average.deaths
          : 0
  const generalValue =
    stat === 'elims'
      ? generalStats.average.eliminations
      : stat === 'damage'
        ? generalStats.average.damage
        : stat === 'deaths'
          ? generalStats.average.deaths
          : 0

  if (!heroValue || !generalValue) return null
  const delta = ((heroValue - generalValue) / generalValue) * 100
  if (stat === 'deaths') {
    if (delta < -10) return `${Math.round(Math.abs(delta))}% fewer than avg`
    if (delta > 10) return `${Math.round(delta)}% more than avg`
    return null
  }
  if (delta > 10) return `+${Math.round(delta)}% vs your avg`
  if (delta < -10) return `${Math.round(delta)}% vs your avg`
  return null
}

export type ContextSentenceInput = {
  rank: number
  totalHeroes: number
  timeShare: number
  winrateRank: number | null
}

export function contextSentence(input: ContextSentenceInput): string {
  const parts: string[] = []
  parts.push(`${ordinal(input.rank)} most played`)
  parts.push(`${Math.round(input.timeShare * 100)}% of your total time`)
  if (input.winrateRank === 1) parts.push('highest win rate among your top 5')
  return parts.join(' · ')
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
