import { PercentileCallout } from '@/components/percentile-callout'
import { percentile, type PercentileResult } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { StatsSummaryBreakdown } from '@/lib/overfast'
import { viewModeLabel, type ViewMode } from '@/lib/view-mode'
import type { PlayerStatsSummary } from '@/types/overfast'

export function CareerOverview({
  stats,
  view,
  breakdown,
}: {
  stats: PlayerStatsSummary
  view: ViewMode
  breakdown?: StatsSummaryBreakdown
}) {
  const g = stats.general
  const time = formatTime(g.time_played)
  const qp = breakdown?.quickplay?.general
  const cp = breakdown?.competitive?.general
  const showBreakdown = view === 'all' && (qp || cp)

  return (
    <div>
      <div className="flex justify-between items-baseline mb-4 gap-4 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
          PC · {viewModeLabel(view)} · {time.value}
          {time.unit} · {g.games_played} matches
        </span>
        {showBreakdown && (
          <span className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
            QP{' '}
            <span className="text-text-secondary">
              {qp?.games_played ?? 0}g · {formatPercent(qp?.winrate ?? 0)}
            </span>
            {'  ·  '}
            CP{' '}
            <span className="text-text-secondary">
              {cp?.games_played ?? 0}g · {formatPercent(cp?.winrate ?? 0)}
            </span>
          </span>
        )}
      </div>
      <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border-default">
        <Cell
          label="Elims / 10m"
          value={g.average.eliminations.toFixed(1)}
          pct={percentile('elims_per_10', g.average.eliminations)}
        />
        <Cell
          label="Damage / 10m"
          value={`${(g.average.damage / 1000).toFixed(1)}k`}
          pct={percentile('damage_per_10', g.average.damage)}
        />
        <Cell label="KDA" value={g.kda.toFixed(2)} pct={percentile('kda', g.kda)} />
        <Cell
          label="Win rate"
          value={formatPercent(g.winrate)}
          pct={percentile('winrate', g.winrate)}
        />
      </div>
    </div>
  )
}

function Cell({
  label,
  value,
  pct,
}: {
  label: string
  value: string
  pct: PercentileResult
}) {
  return (
    <div className="p-4 md:p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
        {label}
      </div>
      <div className="text-[28px] md:text-[44px] font-black mt-2 leading-none tracking-tight">{value}</div>
      <div className="mt-3">
        <PercentileCallout result={pct} />
      </div>
    </div>
  )
}
