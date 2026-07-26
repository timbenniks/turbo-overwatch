import { getScorecard } from '@/lib/history'
import { StatTile, StatTileRow } from '@/components/stats/stat-tile'
import {
  formatTime,
  formatPercent,
  formatNumber,
  formatKda,
  formatUtcStamp,
} from '@/lib/format'
import type { StatsSummaryBreakdown } from '@/lib/overfast'
import { viewModeLabel, type ViewMode } from '@/lib/view-mode'
import type { PlayerStatsSummary } from '@/types/overfast'
import type { Metric } from '@/lib/scorecard'

// This section answers one question: am I trending up? The value is the career
// figure from the API; the delta and sparkline come from the daily snapshots in
// data/history.json, so both comparisons are measured rather than asserted.

export async function CareerOverview({
  stats,
  view,
  breakdown,
  lastUpdatedAt,
}: {
  stats: PlayerStatsSummary
  view: ViewMode
  breakdown?: StatsSummaryBreakdown
  /** Unix seconds from the player summary. */
  lastUpdatedAt?: number | null
}) {
  const g = stats.general
  const time = formatTime(g.time_played)
  const qp = breakdown?.quickplay?.general
  const cp = breakdown?.competitive?.general
  const showBreakdown = view === 'all' && (qp || cp)

  const scorecard = await getScorecard(view, 30)
  const period = scorecard ? `vs prev ${scorecard.days}d` : ''
  const m = scorecard?.metrics

  return (
    <div>
      <div className="flex justify-between items-baseline mb-4 gap-4 flex-wrap">
        <span className="text-[11px] text-text-tertiary uppercase tracking-[0.2em] font-bold">
          PC · {viewModeLabel(view)} ·{' '}
          {/* Named explicitly in competitive, where a season-scoped rank sits
              directly above these lifetime totals. */}
          {view === 'competitive' ? 'lifetime · ' : ''}
          {time.value}
          {time.unit} · {g.games_played} matches
          {typeof lastUpdatedAt === 'number' && (
            <>
              {' · '}
              <span className="text-text-secondary">
                profile updated {formatUtcStamp(lastUpdatedAt)}
              </span>
            </>
          )}
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

      <StatTileRow>
        <StatTile
          label="Win rate"
          value={formatPercent(g.winrate)}
          spark={m?.winrate.spark}
          delta={deltaFor(m?.winrate, (v) => `${v.toFixed(1)} pts`, period)}
          note={recentNote(m?.winrate, (v) => formatPercent(v), scorecard?.days)}
        />
        <StatTile
          label="KDA"
          value={formatKda(g.kda)}
          spark={m?.kda.spark}
          delta={deltaFor(m?.kda, (v) => v.toFixed(2), period)}
          note={recentNote(m?.kda, formatKda, scorecard?.days)}
        />
        <StatTile
          label="Elims / 10m"
          value={g.average.eliminations.toFixed(1)}
          spark={m?.elimsPer10.spark}
          delta={deltaFor(m?.elimsPer10, (v) => v.toFixed(1), period)}
          note={recentNote(m?.elimsPer10, (v) => v.toFixed(1), scorecard?.days)}
        />
        <StatTile
          label="Damage / 10m"
          value={`${(g.average.damage / 1000).toFixed(1)}k`}
          spark={m?.damagePer10.spark}
          delta={deltaFor(m?.damagePer10, (v) => formatNumber(v), period)}
          note={recentNote(m?.damagePer10, formatNumber, scorecard?.days)}
        />
      </StatTileRow>
    </div>
  )
}

function deltaFor(metric: Metric | undefined, format: (v: number) => string, period: string) {
  if (!metric || metric.delta === null) return undefined
  return { value: metric.delta, format, period }
}

// Spells out what the sparkline and delta are actually measuring, so the big
// career number and the recent one are never confused for each other.
function recentNote(
  metric: Metric | undefined,
  format: (v: number) => string,
  days: number | undefined
) {
  if (!metric || !days) return undefined
  // Say so rather than leaving a bare career number with no explanation —
  // competitive, for instance, can go a month untouched.
  if (metric.recent === null) return `no games last ${days}d`
  return `${format(metric.recent)} last ${days}d`
}
