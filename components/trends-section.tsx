import {
  getTrend,
  getDailyDelta,
  getRoleTrend,
  getRankTrend,
} from '@/lib/history'
import type { ViewMode } from '@/lib/view-mode'
import { LineChart, type LineSeries } from '@/components/charts/line-chart'
import { BarChart, type BarDatum } from '@/components/charts/bar-chart'
import { SectionHeader } from '@/components/section-header'
import { TrendModeToggle } from '@/components/trend-mode-toggle'
import type { TrendMode } from '@/lib/trend-mode'
import { TrendingUp } from '@/components/icons'
import { formatPercent, formatKda } from '@/lib/format'

const ROLE_COLORS = {
  tank: 'var(--color-role-tank)',
  damage: 'var(--color-role-damage)',
  support: 'var(--color-role-support)',
}

const DIVISIONS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'champion']

function formatDateLabel(iso: string): string {
  // 2026-05-18 -> "MAY 18"
  const [, m, d] = iso.split('-')
  const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(m) - 1] ?? ''
  return `${month} ${Number(d)}`
}

function formatRankScore(score: number): string {
  const idx = Math.floor(score / 5)
  const tier = 6 - (score % 5)
  const div = DIVISIONS[idx]
  if (!div) return ''
  return `${div.slice(0, 3).toUpperCase()}${tier}`
}

export async function TrendsSection({
  view,
  trendMode,
}: {
  view: ViewMode
  trendMode: TrendMode
}) {
  const [cumulative, deltas, roles, ranks] = await Promise.all([
    getTrend(view, 90),
    getDailyDelta(view, 90),
    getRoleTrend(view, 90),
    getRankTrend(90),
  ])

  if (cumulative.length === 0) {
    return (
      <section id="trends" className="scroll-mt-24">
        <SectionHeader icon={<TrendingUp size={22} />}>Trends</SectionHeader>
        <EmptyState message="No snapshots yet. The daily workflow will populate this section." />
      </section>
    )
  }

  const useDelta = trendMode === 'delta'
  const series = useDelta ? deltas : cumulative
  const xLabels = series.map((p) => formatDateLabel(p.date))
  const xIndices = series.map((_, i) => i)

  const winrateSeries: LineSeries[] = [
    {
      label: useDelta ? "Day's winrate" : 'Career winrate',
      color: 'var(--color-text-primary)',
      points: xIndices.map((x, i) => ({ x, y: series[i]?.winrate ?? null })),
    },
  ]

  const kdaSeries: LineSeries[] = [
    {
      label: useDelta ? "Day's KDA" : 'Career KDA',
      color: 'var(--color-text-primary)',
      points: xIndices.map((x, i) => ({ x, y: series[i]?.kda ?? null })),
    },
  ]

  // Per-role winrate: cumulative pulls from roles[]; delta requires more work.
  // For delta view, derive per-role from consecutive role snapshots.
  const roleWinrateSeries: LineSeries[] = useDelta
    ? buildRoleDeltaSeries(roles, 'winrate')
    : [
        {
          label: 'Tank',
          color: ROLE_COLORS.tank,
          points: roles.map((p, i) => ({ x: i, y: p.tank.games_played > 0 ? p.tank.winrate : null })),
        },
        {
          label: 'Damage',
          color: ROLE_COLORS.damage,
          points: roles.map((p, i) => ({ x: i, y: p.damage.games_played > 0 ? p.damage.winrate : null })),
        },
        {
          label: 'Support',
          color: ROLE_COLORS.support,
          points: roles.map((p, i) => ({ x: i, y: p.support.games_played > 0 ? p.support.winrate : null })),
        },
      ]
  const roleXLabels = roles.map((p) => formatDateLabel(p.date))

  // Volume bars: only meaningful as deltas. If cumulative selected, show
  // running games_played as bars but still meaningful as totals.
  const volumeData: BarDatum[] = useDelta
    ? deltas.map((d) => ({
        label: formatDateLabel(d.date),
        segments: [
          { value: d.wins, color: 'var(--color-text-primary)', label: 'Wins' },
          { value: Math.max(0, d.games_played - d.wins), color: 'var(--color-border-strong)', label: 'Losses' },
        ],
      }))
    : cumulative.map((d) => {
        const wins = Math.round((d.winrate / 100) * d.games_played)
        return {
          label: formatDateLabel(d.date),
          segments: [
            { value: wins, color: 'var(--color-text-primary)', label: 'Wins' },
            { value: Math.max(0, d.games_played - wins), color: 'var(--color-border-strong)', label: 'Losses' },
          ],
        }
      })

  // Time played bars
  const timeData: BarDatum[] = (useDelta ? deltas : cumulative).map((d) => ({
    label: formatDateLabel(d.date),
    segments: [
      { value: d.time_played / 3600, color: 'var(--color-text-primary)' },
    ],
  }))

  // Rank progression
  const rankSeries: LineSeries[] =
    ranks.length > 0
      ? [
          {
            label: 'Tank',
            color: ROLE_COLORS.tank,
            points: ranks.map((p, i) => ({ x: i, y: p.tank })),
          },
          {
            label: 'Damage',
            color: ROLE_COLORS.damage,
            points: ranks.map((p, i) => ({ x: i, y: p.damage })),
          },
          {
            label: 'Support',
            color: ROLE_COLORS.support,
            points: ranks.map((p, i) => ({ x: i, y: p.support })),
          },
        ]
      : []
  const rankXLabels = ranks.map((p) => formatDateLabel(p.date))
  const rankYs = rankSeries.flatMap((s) => s.points.map((p) => p.y).filter((v): v is number => v !== null))
  const rankMin = rankYs.length ? Math.max(0, Math.min(...rankYs) - 2) : 0
  const rankMax = rankYs.length ? Math.max(...rankYs) + 2 : 40

  const totalSnapshots = cumulative.length
  const isThin = totalSnapshots < 3

  return (
    <section id="trends" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4 md:mb-6">
        <SectionHeader icon={<TrendingUp size={22} />}>Trends</SectionHeader>
        <TrendModeToggle current={trendMode} />
      </div>

      {isThin && (
        <p className="text-[11px] md:text-[12px] uppercase tracking-widest text-text-tertiary font-bold mb-4">
          {totalSnapshots} snapshot{totalSnapshots === 1 ? '' : 's'} so far — charts will get more interesting as the daily workflow runs.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <ChartCard
          title="Winrate"
          subtitle={useDelta ? 'Per-day winrate' : 'Career winrate'}
        >
          <LineChart
            series={winrateSeries}
            xLabels={xLabels}
            yMin={0}
            yMax={100}
            yFormat={formatPercent}
          />
        </ChartCard>

        <ChartCard
          title="KDA"
          subtitle={useDelta ? "Per-day KDA" : 'Career KDA'}
        >
          <LineChart
            series={kdaSeries}
            xLabels={xLabels}
            yMin={0}
            yFormat={formatKda}
          />
        </ChartCard>

        <ChartCard
          title="Winrate by role"
          subtitle={useDelta ? "Per-day, per role" : 'Career, per role'}
        >
          <LineChart
            series={roleWinrateSeries}
            xLabels={roleXLabels}
            yMin={0}
            yMax={100}
            yFormat={formatPercent}
          />
        </ChartCard>

        <ChartCard
          title="Games played"
          subtitle={useDelta ? 'Wins vs losses, per day' : 'Career wins vs losses'}
        >
          <BarChart
            data={volumeData}
            yFormat={(v) => String(Math.round(v))}
            legend={[
              { label: 'Wins', color: 'var(--color-text-primary)' },
              { label: 'Losses', color: 'var(--color-border-strong)' },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Time played"
          subtitle={useDelta ? 'Hours per day' : 'Career hours'}
        >
          <BarChart
            data={timeData}
            yFormat={(v) => `${v.toFixed(1)}h`}
          />
        </ChartCard>

        {rankSeries.length > 0 && (
          <ChartCard
            title="Rank"
            subtitle="Competitive division progression"
          >
            <LineChart
              series={rankSeries}
              xLabels={rankXLabels}
              yMin={rankMin}
              yMax={rankMax}
              yFormat={(v) => formatRankScore(Math.round(v))}
              ySteps={3}
            />
          </ChartCard>
        )}
      </div>
    </section>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-surface-card border border-border-default rounded-2xl p-4 md:p-6">
      <div className="mb-3 md:mb-4">
        <div className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
          {subtitle}
        </div>
        <div className="text-[18px] md:text-[22px] uppercase font-black tracking-tight leading-none mt-1">
          {title}
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-2xl p-8 text-center">
      <p className="text-text-secondary uppercase tracking-widest text-[12px] font-bold">{message}</p>
    </div>
  )
}

function buildRoleDeltaSeries(
  roles: Awaited<ReturnType<typeof getRoleTrend>>,
  _key: 'winrate'
): LineSeries[] {
  // Reconstruct per-day winrate from cumulative role snapshots.
  // wins_t = round((winrate_t / 100) * games_t). Daily wins = wins_t - wins_{t-1}.
  const compute = (
    pick: (r: (typeof roles)[number]) => { winrate: number; games_played: number }
  ): { date: string; value: number | null }[] => {
    const out: { date: string; value: number | null }[] = []
    for (let i = 1; i < roles.length; i++) {
      const prev = pick(roles[i - 1])
      const curr = pick(roles[i])
      const games = curr.games_played - prev.games_played
      if (games <= 0) {
        out.push({ date: roles[i].date, value: null })
        continue
      }
      const wins =
        Math.round((curr.winrate / 100) * curr.games_played) -
        Math.round((prev.winrate / 100) * prev.games_played)
      out.push({ date: roles[i].date, value: Math.max(0, Math.min(100, (wins / games) * 100)) })
    }
    return out
  }

  const tank = compute((r) => r.tank)
  const damage = compute((r) => r.damage)
  const support = compute((r) => r.support)

  return [
    { label: 'Tank', color: ROLE_COLORS.tank, points: tank.map((p, i) => ({ x: i, y: p.value })) },
    { label: 'Damage', color: ROLE_COLORS.damage, points: damage.map((p, i) => ({ x: i, y: p.value })) },
    { label: 'Support', color: ROLE_COLORS.support, points: support.map((p, i) => ({ x: i, y: p.value })) },
  ]
}

