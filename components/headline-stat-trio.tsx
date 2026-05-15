import { StatCard } from '@/components/stat-card'
import { PercentileCallout } from '@/components/percentile-callout'
import { percentile } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { StatsSummary } from '@/types/overfast'

export function HeadlineStatTrio({
  heroKey,
  heroStats,
  allHeroes,
}: {
  heroKey: string
  heroStats: StatsSummary
  allHeroes: Record<string, StatsSummary>
}) {
  const time = formatTime(heroStats.time_played)
  const wrPct = percentile('winrate', heroStats.winrate)

  const sorted = Object.entries(allHeroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played
  )
  const rank = sorted.findIndex(([k]) => k === heroKey) + 1
  const rankStr = rank > 0 ? `${ordinal(rank)} most played` : ''

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <StatCard
        label="Time"
        value={time.value}
        unit={time.unit}
        subtitle={rankStr}
      />
      <StatCard
        label="Win rate"
        value={formatPercent(heroStats.winrate)}
        subtitle={<PercentileCallout result={wrPct} />}
      />
      <StatCard
        label="Games"
        value={String(heroStats.games_played)}
        subtitle={`${heroStats.games_won}W · ${heroStats.games_lost}L`}
      />
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
