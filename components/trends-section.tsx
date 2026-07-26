import {
  getTrend,
  getDailyDelta,
  getRoleDelta,
  getRankTrend,
  getHeroMovers,
  getSeasonState,
} from '@/lib/history'
import { rollingRate, rollingMean, weekBuckets } from '@/lib/rolling'
import { heroHref, type ViewMode } from '@/lib/view-mode'
import {
  TimeSeriesChart,
  StackedBarChart,
  PercentAreaChart,
  type ChartRow,
  type SeriesSpec,
} from '@/components/charts'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { BarRows, type BarRow } from '@/components/charts/bar-rows'
import { ChartCard, ChartEmpty } from '@/components/charts/chart-card'
import { SectionHeader } from '@/components/section-header'
import { SegmentedNav } from '@/components/segmented-nav'
import { TrendingUp } from '@/components/icons'
import {
  DEFAULT_TREND_RANGE,
  TREND_RANGES,
  rangeToDays,
  type TrendRange,
} from '@/lib/trend-range'
import { divisionLabel, formatHours, formatTime } from '@/lib/format'
import { segmentIndices } from '@/lib/seasons'

const ROLES: SeriesSpec[] = [
  { key: 'tank', label: 'Tank', color: 'var(--color-role-tank)' },
  { key: 'damage', label: 'Damage', color: 'var(--color-role-damage)' },
  { key: 'support', label: 'Support', color: 'var(--color-role-support)' },
]

// Wins wear the mode accent; losses stay neutral. Role colours are untouched —
// they encode role, which is a different dimension from mode.
const WIN_LOSS: SeriesSpec[] = [
  { key: 'wins', label: 'Wins', color: 'var(--color-accent)' },
  { key: 'losses', label: 'Losses', color: 'var(--color-border-strong)' },
]

const ROLLING_WINDOW = 7

export async function TrendsSection({
  view,
  range,
}: {
  view: ViewMode
  range: TrendRange
}) {
  const days = rangeToDays(range)

  const [cumulative, deltas, roleDeltas, ranks, movers, seasons] = await Promise.all([
    getTrend(view, days),
    getDailyDelta(view, days),
    getRoleDelta(view, days),
    // Rank is competitive-only; a ladder card under a quickplay filter is a lie.
    view === 'quickplay' ? Promise.resolve([]) : getRankTrend(days),
    getHeroMovers(view, days, 6),
    getSeasonState(days),
  ])

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4 md:mb-6">
      <SectionHeader icon={<TrendingUp size={22} />}>Trends</SectionHeader>
      <SegmentedNav
        items={TREND_RANGES}
        current={range}
        param="range"
        defaultKey={DEFAULT_TREND_RANGE}
        hash="trends"
        label="Trend range"
      />
    </div>
  )

  if (deltas.length === 0) {
    return (
      <section id="trends" className="scroll-mt-24">
        {header}
        <div className="bg-surface-card border border-border-default rounded-2xl p-8">
          <ChartEmpty
            message={
              cumulative.length > 0
                ? 'Only one snapshot in this range — pick a longer range.'
                : 'No snapshots yet. The daily workflow will populate this section.'
            }
          />
        </div>
      </section>
    )
  }

  /* ── rolling form (winrate & KDA) ──────────────────────────────────────── */

  const winrate = rollingRate(
    deltas.map((d) => d.wins),
    deltas.map((d) => d.games_played),
    ROLLING_WINDOW
  )
  const kda = rollingMean(
    deltas.map((d) => (d.games_played > 0 ? d.kda : null)),
    ROLLING_WINDOW
  )

  const formRows: ChartRow[] = deltas.map((d, i) => ({
    date: d.date,
    // rollingRate returns a ratio; the axis is a percentage.
    winrate: winrate[i] === null ? null : winrate[i]! * 100,
    kda: kda[i],
  }))

  const careerKda = cumulative[cumulative.length - 1]?.kda ?? null

  /* ── weekly volume ─────────────────────────────────────────────────────── */

  const volumeRows: ChartRow[] = weekBuckets(deltas).map((b) => {
    const games = b.points.reduce((a, p) => a + p.games_played, 0)
    const wins = b.points.reduce((a, p) => a + p.wins, 0)
    return { date: b.week, wins, losses: Math.max(0, games - wins) }
  })

  const totalGames = deltas.reduce((a, d) => a + d.games_played, 0)
  const totalWins = deltas.reduce((a, d) => a + d.wins, 0)
  const totalTime = deltas.reduce((a, d) => a + d.time_played, 0)

  /* ── weekly role mix ───────────────────────────────────────────────────── */

  const roleRows: ChartRow[] = weekBuckets(roleDeltas)
    .map((b) => ({
      date: b.week,
      tank: b.points.reduce((a, p) => a + p.tank, 0),
      damage: b.points.reduce((a, p) => a + p.damage, 0),
      support: b.points.reduce((a, p) => a + p.support, 0),
    }))
    // A week with no play would divide by zero in a 100%-stacked area.
    .filter((r) => (r.tank as number) + (r.damage as number) + (r.support as number) > 0)

  /* ── rank ladder ───────────────────────────────────────────────────────── */

  // One line per role per season segment. An Overwatch season opens with a soft
  // reset that drops you one to two divisions, so joining across a boundary
  // would draw a fall the player never took. Separate dataKeys give a true
  // break without inventing null rows on the axis.
  //
  // Segments advance only on an *observed* season change: snapshots taken before
  // seasons were recorded stay joined to the run that follows, because breaking
  // there would assert a rollover nobody saw.
  const rowSegments = segmentIndices(
    ranks.map((p) => p.date),
    seasons.boundaries
  )
  const segmentIds = Array.from(new Set(rowSegments))

  const rankRows: ChartRow[] = ranks.map((p, i) => {
    const row: ChartRow = { date: p.date }
    for (const r of ROLES) {
      const score = p[r.key as 'tank' | 'damage' | 'support']
      for (const g of segmentIds) {
        row[`${r.key}_g${g}`] = g === rowSegments[i] ? score : null
      }
    }
    return row
  })

  const rankSeries: SeriesSpec[] = []
  for (const r of ROLES) {
    for (const g of segmentIds) {
      const key = `${r.key}_g${g}`
      if (!rankRows.some((row) => typeof row[key] === 'number')) continue
      // Every segment of a role shares the role's name and colour, so the
      // tooltip and legend read by role, not by role-and-season.
      rankSeries.push({ key, label: r.label, color: r.color })
    }
  }
  // Legend shows each role once, however many season segments it spans.
  const rankLegend = ROLES.filter((r) => rankSeries.some((s) => s.label === r.label))
  const rankScores = rankRows.flatMap((r) =>
    rankSeries.map((s) => r[s.key]).filter((v): v is number => typeof v === 'number')
  )
  const seasonMarkers = seasons.boundaries
    .filter((b) => ranks.some((p) => p.date === b))
    .map((b) => ({
      x: b,
      label: `S${ranks.find((p) => p.date === b)?.season ?? ''}`,
    }))
  const rankMin = rankScores.length ? Math.min(...rankScores) - 2 : 0
  const rankMax = rankScores.length ? Math.max(...rankScores) + 2 : 10
  const rankTicks: number[] = []
  const rankBands: { from: number; to: number; label: string }[] = []
  for (let idx = 0; idx < 8; idx++) {
    const from = idx * 5 + 0.5
    const to = idx * 5 + 5.5
    if (to < rankMin || from > rankMax) continue
    rankBands.push({ from, to, label: divisionLabel(idx) })
    // Every tier when the span is narrow; only division ends once it grows,
    // otherwise the axis turns into a wall of labels.
    const tiers =
      rankMax - rankMin <= 12
        ? [1, 2, 3, 4, 5].map((t) => idx * 5 + t)
        : [idx * 5 + 1, idx * 5 + 5]
    for (const tier of tiers) {
      if (tier >= rankMin && tier <= rankMax) rankTicks.push(tier)
    }
  }

  /* ── hero movers ───────────────────────────────────────────────────────── */

  const moverRows: BarRow[] = movers.map((m) => {
    const t = formatTime(m.time_played)
    return {
      key: m.key,
      label: m.key.replace(/-/g, ' '),
      value: m.time_played,
      valueLabel: `${t.value}${t.unit}`,
      note: m.winrate !== null ? `${Math.round(m.winrate)}% wr` : undefined,
      href: heroHref(m.key, view),
    }
  })

  // With no games in the range, every rate chart is an empty axis and every
  // ranking is an empty list. One sentence beats five blank cards; the heatmap
  // and the ladder still say something, so they stay.
  const noActivity = totalGames === 0

  return (
    <section id="trends" className="scroll-mt-24">
      {header}

      {noActivity && (
        <div className="bg-surface-card border border-border-default rounded-2xl p-5 md:p-6 mb-3 md:mb-4">
          <p className="text-[12px] md:text-[13px] uppercase tracking-widest text-text-secondary font-bold">
            No {view === 'all' ? '' : `${view === 'quickplay' ? 'quick play' : 'competitive'} `}
            games in this range
            {range !== 'all' && ' — try a longer one'}.
          </p>
          {rankSeries.length > 0 && (
            <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-text-tertiary font-bold mt-2">
              Rank is still shown below: it holds between seasons even when you
              stop playing.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <ChartCard
          title="Activity"
          subtitle="Games per day"
          className="lg:col-span-2"
          footnote={`${totalGames} games · ${formatHours(totalTime)} · ${totalWins} won in this range. Shade is relative to the busiest day.`}
        >
          <ActivityHeatmap days={deltas} />
        </ChartCard>

        {!noActivity && (
        <ChartCard
          title="Form"
          subtitle={`${ROLLING_WINDOW}-day rolling winrate`}
          footnote="Wins ÷ games over the trailing week, so a single game can't swing the line. Gaps are weeks with no games."
        >
          <TimeSeriesChart
            data={formRows}
            series={[
              { key: 'winrate', label: 'Winrate', color: 'var(--color-accent)' },
            ]}
            format="percent"
            yDomain={[0, 100]}
            yTicks={[0, 25, 50, 75, 100]}
            reference={{ value: 50, label: 'Even' }}
          />
        </ChartCard>
        )}

        {!noActivity && (
        <ChartCard
          title="KDA"
          subtitle={`${ROLLING_WINDOW}-day rolling KDA`}
          footnote={
            careerKda !== null
              ? 'Dashed line is the career average for this mode.'
              : undefined
          }
        >
          <TimeSeriesChart
            data={formRows}
            series={[{ key: 'kda', label: 'KDA', color: 'var(--color-accent)' }]}
            format="kda"
            reference={
              careerKda !== null ? { value: careerKda, label: 'Career' } : undefined
            }
          />
        </ChartCard>
        )}

        {!noActivity && (
        <ChartCard
          title="Volume"
          subtitle="Wins vs losses, weekly"
          legend={WIN_LOSS}
          footnote="Grouped by week — over half of all days have no games at all."
        >
          <StackedBarChart
            data={volumeRows}
            series={WIN_LOSS}
            format="count"
            totalFormat="count"
          />
        </ChartCard>
        )}

        {!noActivity && (
        <ChartCard
          title="Role mix"
          subtitle="Share of time played, weekly"
          legend={ROLES}
          footnote="Hover for hours per role."
        >
          {roleRows.length > 0 ? (
            <PercentAreaChart data={roleRows} series={ROLES} format="hours" />
          ) : (
            <ChartEmpty message="No role time recorded in this range." />
          )}
        </ChartCard>
        )}

        {rankSeries.length > 0 && (
          <ChartCard
            title="Rank"
            subtitle="Competitive ladder"
            legend={rankLegend}
            footnote={
              seasonMarkers.length > 0
                ? 'Stepped on purpose — rank only moves when a snapshot records it. Lines break at a season change: a new season soft-resets your placement.'
                : 'Stepped on purpose — rank only moves when a snapshot records a new division.'
            }
          >
            <TimeSeriesChart
              data={rankRows}
              series={rankSeries}
              format="rank"
              yDomain={[rankMin, rankMax]}
              yTicks={rankTicks}
              bands={rankBands}
              markers={seasonMarkers}
              step
              endLabels
            />
          </ChartCard>
        )}

        {!noActivity && (
          <ChartCard
            title="Recently played"
            subtitle="Time added in this range"
            footnote="Ranked by time gained between the first and last snapshot in range."
          >
            {moverRows.length > 0 ? (
              <BarRows rows={moverRows} />
            ) : (
              <ChartEmpty message="No hero time added in this range." />
            )}
          </ChartCard>
        )}
      </div>
    </section>
  )
}
