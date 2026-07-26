import { getHeroTrend } from '@/lib/history'
import { rollingRate, weekBuckets } from '@/lib/rolling'
import type { ViewMode } from '@/lib/view-mode'
import { TimeSeriesChart, StackedBarChart, type ChartRow, type SeriesSpec } from '@/components/charts'
import { ChartCard } from '@/components/charts/chart-card'
import { SectionHeader } from '@/components/section-header'
import { TrendingUp } from '@/components/icons'

const WIN_LOSS: SeriesSpec[] = [
  { key: 'wins', label: 'Wins', color: 'var(--color-accent)' },
  { key: 'losses', label: 'Losses', color: 'var(--color-border-strong)' },
]

const ROLLING_WINDOW = 7

// Per-hero history. Snapshots are cumulative, so daily play is the difference
// between consecutive ones — same derivation as getDailyDelta, scoped to a hero.
export async function HeroTrend({
  heroKey,
  heroName,
  view,
}: {
  heroKey: string
  heroName: string
  view: ViewMode
}) {
  const points = await getHeroTrend(heroKey, view, 90)
  if (points.length < 3) return null

  type Day = { date: string; games_played: number; wins: number }
  const daily: Day[] = []
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const games = Math.max(0, curr.games_played - prev.games_played)
    const wins = Math.max(
      0,
      Math.round((curr.winrate / 100) * curr.games_played) -
        Math.round((prev.winrate / 100) * prev.games_played)
    )
    daily.push({ date: curr.date, games_played: games, wins: Math.min(wins, games) })
  }

  const played = daily.filter((d) => d.games_played > 0)
  if (played.length < 2) return null

  const winrate = rollingRate(
    daily.map((d) => d.wins),
    daily.map((d) => d.games_played),
    ROLLING_WINDOW
  )
  // rollingRate returns a ratio; the axis is a percentage.
  const formRows: ChartRow[] = daily.map((d, i) => ({
    date: d.date,
    winrate: winrate[i] === null ? null : winrate[i]! * 100,
  }))

  const volumeRows: ChartRow[] = weekBuckets(daily).map((b) => {
    const games = b.points.reduce((a, p) => a + p.games_played, 0)
    const wins = b.points.reduce((a, p) => a + p.wins, 0)
    return { date: b.week, wins, losses: Math.max(0, games - wins) }
  })

  return (
    <section className="scroll-mt-24">
      <SectionHeader icon={<TrendingUp size={22} />}>{heroName} over time</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <ChartCard
          title="Form"
          subtitle={`${ROLLING_WINDOW}-day rolling winrate`}
          footnote={`Only days with ${heroName} games contribute. Gaps are weeks off the hero.`}
        >
          <TimeSeriesChart
            data={formRows}
            series={[{ key: 'winrate', label: 'Winrate', color: 'var(--color-accent)' }]}
            format="percent"
            yDomain={[0, 100]}
            yTicks={[0, 25, 50, 75, 100]}
            reference={{ value: 50, label: 'Even' }}
          />
        </ChartCard>

        <ChartCard title="Volume" subtitle="Wins vs losses, weekly" legend={WIN_LOSS}>
          <StackedBarChart
            data={volumeRows}
            series={WIN_LOSS}
            format="count"
            totalFormat="count"
          />
        </ChartCard>
      </div>
    </section>
  )
}
