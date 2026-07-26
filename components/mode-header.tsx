import { getSeasonToDate } from '@/lib/history'
import { formatDayLabel, formatPercent, formatTime } from '@/lib/format'
import type { PlayerStatsSummary, PlayerSummary, Role } from '@/types/overfast'
import type { StatsSummaryBreakdown } from '@/lib/overfast'
import type { ViewMode } from '@/lib/view-mode'

// The context block that opens every view, with one face per mode. It exists
// because the modes are not filters of one dataset — they are different games:
//
//   competitive  a ladder position, scoped to a season that soft-resets
//   quick play   no rank, no reset, nothing at stake; the volume lives here
//   all modes    the lifetime sum, and the only place the two are compared
//
// Colour alone never carries this: each face names its own terms.

const ROLES: Role[] = ['tank', 'damage', 'support']

const ROLE_LABEL: Record<Role, string> = {
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
}

// The ladder's own materials, used only where a real rank is shown.
const DIVISION_COLORS: Record<string, string> = {
  bronze: '#a16207',
  silver: '#a1a1aa',
  gold: '#fbbf24',
  platinum: '#67e8f9',
  diamond: '#a5b4fc',
  master: '#fb923c',
  grandmaster: '#fb7185',
  champion: '#f0abfc',
}

export async function ModeHeader({
  view,
  summary,
  stats,
  breakdown,
}: {
  view: ViewMode
  summary: PlayerSummary
  stats: PlayerStatsSummary
  breakdown?: StatsSummaryBreakdown
}) {
  if (view === 'competitive') return <CompetitiveFace summary={summary} />
  if (view === 'quickplay') return <QuickplayFace stats={stats} />
  return <AllFace stats={stats} breakdown={breakdown} />
}

/* ── shell ────────────────────────────────────────────────────────────────── */

function Shell({
  eyebrow,
  headline,
  meta,
  children,
}: {
  eyebrow: string
  headline: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
      {/* The one piece of chrome that carries the mode: a hairline in the
          accent, full width, above everything. */}
      <div className="h-0.5 w-full" style={{ background: 'var(--color-accent)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border-default">
        <div className="p-5 md:p-6 lg:min-w-64">
          <div
            className="text-[10px] uppercase tracking-[0.25em] font-bold"
            style={{ color: 'var(--color-accent)' }}
          >
            {eyebrow}
          </div>
          <div className="text-[26px] md:text-[38px] font-black uppercase leading-none tracking-tight mt-1.5">
            {headline}
          </div>
          {meta && (
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-secondary font-bold mt-3">
              {meta}
            </div>
          )}
        </div>
        <div className="p-5 md:p-6">{children}</div>
      </div>
    </section>
  )
}

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] md:text-[28px] font-black leading-none tracking-tight">
          {value}
        </span>
        {note && (
          <span className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold">
            {note}
          </span>
        )}
      </div>
    </div>
  )
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-bold mt-4">
      {children}
    </p>
  )
}

/* ── competitive ──────────────────────────────────────────────────────────── */

async function CompetitiveFace({ summary }: { summary: PlayerSummary }) {
  const std = await getSeasonToDate()
  const ranks = summary.competitive?.pc
  const season = std?.season.season ?? ranks?.season ?? null
  const time = std ? formatTime(std.time) : null

  return (
    <Shell
      eyebrow="Competitive"
      headline={season !== null ? `Season ${season}` : 'Ranked'}
      meta={
        std
          ? std.season.startObserved
            ? `Started ${formatDayLabel(std.season.from)}${std.season.days >= 2 ? ` · day ${std.season.days}` : ''}`
            : `Tracked since ${formatDayLabel(std.season.from)}`
          : undefined
      }
    >
      <div className="flex flex-wrap gap-x-10 gap-y-5">
        {ROLES.map((role) => {
          const rank = ranks?.[role] ?? null
          return (
            <div key={role}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-1.5">
                {ROLE_LABEL[role]}
              </div>
              {rank ? (
                <div
                  className="text-[18px] md:text-[24px] font-black uppercase leading-none tracking-tight"
                  style={{ color: DIVISION_COLORS[rank.division] }}
                >
                  {rank.division}
                  {/* Champion is a single tier — no division number exists. */}
                  {rank.division !== 'champion' && (
                    <span className="text-text-tertiary"> {rank.tier}</span>
                  )}
                </div>
              ) : (
                <div className="text-[18px] md:text-[24px] font-black uppercase leading-none tracking-tight text-text-tertiary">
                  Unranked
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* A season-to-date figure is the gap between two snapshots, so with one
          there is nothing to report yet. Say so instead of printing dashes. */}
      {std && std.season.days < 2 && (
        <div className="mt-5 pt-5 border-t border-border-default">
          <p className="text-[11px] uppercase tracking-widest text-text-secondary font-bold">
            Season {season} was first recorded on {formatDayLabel(std.season.from)}.
            Season-to-date figures appear once a second daily snapshot lands.
          </p>
        </div>
      )}

      {std && std.season.days >= 2 && (
        <div className="mt-5 pt-5 border-t border-border-default flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <Figure
            label="Games this season"
            value={String(std.games)}
            note={std.games > 0 ? `${std.wins}W · ${std.games - std.wins}L` : undefined}
          />
          <Figure
            label="Win rate this season"
            value={std.winrate !== null ? formatPercent(std.winrate) : '—'}
          />
          <Figure
            label="Time this season"
            value={time && std.time > 0 ? `${time.value}${time.unit}` : '0'}
          />
        </div>
      )}

      <Footnote>
        Ranks are per season. Career totals below are lifetime — OverFast has no
        per-season stats, so season figures come from this site&apos;s own daily
        snapshots.
      </Footnote>
    </Shell>
  )
}

/* ── quick play ───────────────────────────────────────────────────────────── */

function QuickplayFace({ stats }: { stats: PlayerStatsSummary }) {
  const g = stats.general
  const time = formatTime(g.time_played)
  const heroes = Object.keys(stats.heroes).length
  // Where the hours actually go: quick play is a hero pool, not a ladder.
  const topShare = (() => {
    const times = Object.values(stats.heroes).map((h) => h.time_played)
    const total = times.reduce((a, b) => a + b, 0)
    const top3 = times.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0)
    return total > 0 ? (top3 / total) * 100 : null
  })()

  return (
    <Shell
      eyebrow="Quick play"
      headline="Unranked"
      meta="No rank, no season reset · lifetime"
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
        <Figure
          label="Games"
          value={String(g.games_played)}
          note={`${g.games_won}W · ${g.games_lost}L`}
        />
        <Figure label="Time played" value={`${time.value}${time.unit}`} />
        <Figure label="Win rate" value={formatPercent(g.winrate)} />
        <Figure
          label="Hero pool"
          value={String(heroes)}
          note={topShare !== null ? `top 3 = ${formatPercent(topShare)}` : undefined}
        />
      </div>

      <Footnote>
        Nothing here resets. Quick play is where the volume and the hero pool
        live, so it is measured by breadth rather than placement.
      </Footnote>
    </Shell>
  )
}

/* ── all modes ────────────────────────────────────────────────────────────── */

function AllFace({
  stats,
  breakdown,
}: {
  stats: PlayerStatsSummary
  breakdown?: StatsSummaryBreakdown
}) {
  const g = stats.general
  const time = formatTime(g.time_played)
  const qp = breakdown?.quickplay?.general
  const cp = breakdown?.competitive?.general

  return (
    <Shell
      eyebrow="All modes"
      headline="Lifetime"
      meta={`${g.games_played} matches · ${time.value}${time.unit}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
        <Figure
          label="Quick play"
          value={qp ? String(qp.games_played) : '—'}
          note={qp ? formatPercent(qp.winrate) : undefined}
        />
        <Figure
          label="Competitive"
          value={cp ? String(cp.games_played) : '—'}
          note={cp ? formatPercent(cp.winrate) : undefined}
        />
        <Figure label="Combined win rate" value={formatPercent(g.winrate)} />
      </div>

      <Footnote>
        The only view that mixes the two. Every rate here is weighted by games,
        so the bigger mode dominates — switch modes to read either on its own.
      </Footnote>
    </Shell>
  )
}
