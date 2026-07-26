import { StatTile } from '@/components/stats/stat-tile'
import { formatTime, formatPercent } from '@/lib/format'
import type { StatsSummary } from '@/types/overfast'

// Below this, a winrate is noise: one won game reads as "+52 points vs global",
// which is arithmetic, not a finding. The global average still shows as context.
const MIN_GAMES_FOR_COMPARISON = 10

export function HeadlineStatTrio({
  heroKey,
  heroStats,
  allHeroes,
  globalWinrate,
  globalLabel,
}: {
  heroKey: string
  heroStats: StatsSummary
  allHeroes: Record<string, StatsSummary>
  /** Real global winrate for this hero, from getGlobalHeroStats(). */
  globalWinrate?: number | null
  globalLabel?: string
}) {
  const time = formatTime(heroStats.time_played)

  const sorted = Object.entries(allHeroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played
  )
  const rank = sorted.findIndex(([k]) => k === heroKey) + 1
  const rankStr = rank > 0 ? `${ordinal(rank)} most played` : undefined

  const comparable =
    globalWinrate != null && heroStats.games_played >= MIN_GAMES_FOR_COMPARISON

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <Card>
        <StatTile label="Time" value={time.value} unit={time.unit} size="lg" note={rankStr} />
      </Card>
      <Card>
        <StatTile
          label="Win rate"
          value={formatPercent(heroStats.winrate)}
          size="lg"
          // Measured comparison: the real global winrate for this hero.
          delta={
            comparable
              ? {
                  value: heroStats.winrate - globalWinrate!,
                  format: (v) => `${v.toFixed(1)} pts`,
                  period: globalLabel ?? 'vs global',
                }
              : undefined
          }
          note={
            globalWinrate == null
              ? undefined
              : comparable
                ? `${globalWinrate.toFixed(1)}% global average`
                : `${globalWinrate.toFixed(1)}% global · too few games to compare`
          }
        />
      </Card>
      <Card>
        <StatTile
          label="Games"
          value={String(heroStats.games_played)}
          size="lg"
          note={`${heroStats.games_won}W · ${heroStats.games_lost}L`}
        />
      </Card>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-surface-card border border-border-default rounded-2xl">{children}</div>
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
