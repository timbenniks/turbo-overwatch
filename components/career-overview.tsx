import { PercentileCallout } from '@/components/percentile-callout'
import { percentile, type PercentileResult } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { PlayerStatsSummary, Gamemode } from '@/types/overfast'

export function CareerOverview({
  stats,
  gamemode,
}: {
  stats: PlayerStatsSummary
  gamemode: Gamemode
}) {
  const g = stats.general
  const time = formatTime(g.time_played)

  return (
    <div>
      <div className="flex justify-end items-baseline mb-4">
        <span className="text-[11px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
          PC · {gamemode === 'competitive' ? 'competitive' : 'quick play'} · {time.value}
          {time.unit} · {g.games_played} matches
        </span>
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
