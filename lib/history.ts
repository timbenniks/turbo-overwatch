import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cacheLife, cacheTag } from 'next/cache'
import type {
  DailySnapshot,
  History,
  HistoryModeSnapshot,
} from '@/types/history'
import type { ViewMode } from './view-mode'
import { DIVISIONS } from './format'
import { rollingRate } from './rolling'
import { currentSeason, seasonBoundaries, type SeasonSegment } from './seasons'
import {
  buildMetric,
  splitWindows,
  type Metric,
  type MetricKey,
} from './scorecard'

// Sparkline smoothing window, in days. Matches the 7-day rolling window the
// Trends charts use so the two tell the same story.
const SPARK_WINDOW = 7

const HISTORY_PATH = path.join(process.cwd(), 'data', 'history.json')

async function readHistoryFile(): Promise<History | null> {
  try {
    const raw = await readFile(HISTORY_PATH, 'utf8')
    const parsed = JSON.parse(raw) as History
    if (parsed.v !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export async function getHistory(): Promise<DailySnapshot[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('history')

  const history = await readHistoryFile()
  return history?.snapshots ?? []
}

function pickForView(snap: DailySnapshot, view: ViewMode): HistoryModeSnapshot | null {
  if (view === 'quickplay') return snap.quickplay
  if (view === 'competitive') return snap.competitive
  // 'all' — merge totals naively (sum games/time, weighted winrate/kda)
  const qp = snap.quickplay
  const cp = snap.competitive
  if (!qp && !cp) return null
  if (!qp) return cp
  if (!cp) return qp
  const games = qp.general.games_played + cp.general.games_played
  const won = qp.general.games_won + cp.general.games_won
  return {
    general: {
      time_played: qp.general.time_played + cp.general.time_played,
      games_played: games,
      games_won: won,
      winrate: games > 0 ? Math.round((won / games) * 100) : 0,
      kda: weighted(qp.general.kda, qp.general.games_played, cp.general.kda, cp.general.games_played),
      eliminations: qp.general.eliminations + cp.general.eliminations,
      assists: qp.general.assists + cp.general.assists,
      deaths: qp.general.deaths + cp.general.deaths,
      damage: qp.general.damage + cp.general.damage,
      healing: qp.general.healing + cp.general.healing,
    },
    roles: {
      tank: mergeRole(qp.roles.tank, cp.roles.tank),
      damage: mergeRole(qp.roles.damage, cp.roles.damage),
      support: mergeRole(qp.roles.support, cp.roles.support),
    },
    heroes: mergeHeroes(qp.heroes, cp.heroes),
  }
}

function weighted(a: number, wa: number, b: number, wb: number) {
  const total = wa + wb
  if (total <= 0) return 0
  return (a * wa + b * wb) / total
}

function mergeRole(a: HistoryModeSnapshot['roles'][keyof HistoryModeSnapshot['roles']], b: typeof a) {
  const games = a.games_played + b.games_played
  return {
    time_played: a.time_played + b.time_played,
    games_played: games,
    winrate: weighted(a.winrate, a.games_played, b.winrate, b.games_played),
    kda: weighted(a.kda, a.games_played, b.kda, b.games_played),
  }
}

function mergeHeroes(
  a: HistoryModeSnapshot['heroes'],
  b: HistoryModeSnapshot['heroes']
): HistoryModeSnapshot['heroes'] {
  const out: HistoryModeSnapshot['heroes'] = { ...a }
  for (const [key, stat] of Object.entries(b)) {
    const existing = out[key]
    if (!existing) {
      out[key] = stat
      continue
    }
    const games = existing.games_played + stat.games_played
    out[key] = {
      time_played: existing.time_played + stat.time_played,
      games_played: games,
      winrate: weighted(existing.winrate, existing.games_played, stat.winrate, stat.games_played),
      kda: weighted(existing.kda, existing.games_played, stat.kda, stat.games_played),
    }
  }
  return out
}

export type TrendPoint = {
  date: string
  time_played: number
  games_played: number
  winrate: number
  kda: number
}

export async function getTrend(view: ViewMode, days = 90): Promise<TrendPoint[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const points: TrendPoint[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const mode = pickForView(snap, view)
    if (!mode) continue
    points.push({
      date: snap.date,
      time_played: mode.general.time_played,
      games_played: mode.general.games_played,
      winrate: mode.general.winrate,
      kda: mode.general.kda,
    })
  }
  return points
}

export type HeroTrendPoint = {
  date: string
  time_played: number
  games_played: number
  winrate: number
  kda: number
}

export async function getHeroTrend(
  heroKey: string,
  view: ViewMode,
  days = 90
): Promise<HeroTrendPoint[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const points: HeroTrendPoint[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const mode = pickForView(snap, view)
    if (!mode) continue
    const h = mode.heroes[heroKey]
    if (!h) continue
    points.push({
      date: snap.date,
      time_played: h.time_played,
      games_played: h.games_played,
      winrate: h.winrate,
      kda: h.kda,
    })
  }
  return points
}

export type DailyDelta = {
  date: string
  games_played: number
  time_played: number
  wins: number
  winrate: number
  kda: number
  eliminations: number
  assists: number
  deaths: number
  damage: number
  healing: number
}

// Returns per-day deltas — i.e. games played *that day*, derived by subtracting
// consecutive cumulative snapshots. Useful for "activity" bar charts.
export async function getDailyDelta(view: ViewMode, days = 30): Promise<DailyDelta[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - (days + 1))
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const filtered: { date: string; mode: HistoryModeSnapshot }[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const mode = pickForView(snap, view)
    if (!mode) continue
    filtered.push({ date: snap.date, mode })
  }

  const out: DailyDelta[] = []
  for (let i = 1; i < filtered.length; i++) {
    const prev = filtered[i - 1].mode.general
    const curr = filtered[i].mode.general
    const games = Math.max(0, curr.games_played - prev.games_played)
    const time = Math.max(0, curr.time_played - prev.time_played)
    const wins = Math.max(0, curr.games_won - prev.games_won)
    const elims = Math.max(0, curr.eliminations - prev.eliminations)
    const assists = Math.max(0, curr.assists - prev.assists)
    const deaths = Math.max(0, curr.deaths - prev.deaths)
    const damage = Math.max(0, curr.damage - prev.damage)
    const healing = Math.max(0, curr.healing - prev.healing)
    const winrate = games > 0 ? (wins / games) * 100 : 0
    const kda = deaths > 0 ? (elims + assists) / deaths : elims + assists
    out.push({
      date: filtered[i].date,
      games_played: games,
      time_played: time,
      wins,
      winrate,
      kda,
      eliminations: elims,
      assists,
      deaths,
      damage,
      healing,
    })
  }
  return out
}

export type Scorecard = {
  days: number
  metrics: Record<MetricKey, Metric>
}

/**
 * The last `days` compared against the `days` before them, plus a rolling
 * sparkline series for each metric. Deltas are only ever between two windows
 * that both contain games — see buildMetric.
 */
export async function getScorecard(view: ViewMode, days = 30): Promise<Scorecard | null> {
  const deltas = await getDailyDelta(view, days * 2)
  if (deltas.length === 0) return null

  const { recent, previous } = splitWindows(deltas, days)

  // Rolling series are computed over the full pair of windows so the earliest
  // sparkline point still has a week of history behind it, then trimmed to the
  // recent window.
  const trim = <T,>(series: T[]) => series.slice(-recent.length)
  const rolling = (nums: number[], dens: number[], scale = 1) =>
    trim(rollingRate(nums, dens, SPARK_WINDOW).map((v) => (v === null ? null : v * scale)))

  const games = deltas.map((d) => d.games_played)
  const time = deltas.map((d) => d.time_played)

  return {
    days,
    metrics: {
      winrate: buildMetric(
        'winrate',
        recent,
        previous,
        rolling(
          deltas.map((d) => d.wins),
          games,
          100
        )
      ),
      kda: buildMetric(
        'kda',
        recent,
        previous,
        rolling(
          deltas.map((d) => d.eliminations + d.assists),
          deltas.map((d) => d.deaths)
        )
      ),
      elimsPer10: buildMetric(
        'elimsPer10',
        recent,
        previous,
        rolling(
          deltas.map((d) => d.eliminations),
          time,
          600
        )
      ),
      damagePer10: buildMetric(
        'damagePer10',
        recent,
        previous,
        rolling(
          deltas.map((d) => d.damage),
          time,
          600
        )
      ),
    },
  }
}

export type SeasonState = {
  current: SeasonSegment | null
  /** Dates where the season number changed — where rank lines must break. */
  boundaries: string[]
}

/**
 * Season segmentation of the competitive snapshots. Derived from the recorded
 * season numbers, never from a hardcoded season calendar.
 */
export async function getSeasonState(days = 3650): Promise<SeasonState> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const points = snaps
    .filter((s) => s.date >= cutoffStr && s.competitive?.ranks)
    .map((s) => ({ date: s.date, season: s.competitive?.ranks?.season ?? null }))

  return { current: currentSeason(points), boundaries: seasonBoundaries(points) }
}

/**
 * Competitive totals accumulated since the current season was first seen.
 * The API only reports lifetime competitive stats, so this window is something
 * only the local snapshot history can provide.
 */
export async function getSeasonToDate(): Promise<{
  season: SeasonSegment
  games: number
  wins: number
  time: number
  winrate: number | null
} | null> {
  const { current } = await getSeasonState()
  if (!current) return null

  const snaps = await getHistory()
  const inSeason = snaps.filter((s) => s.date >= current.from && s.competitive)
  const first = inSeason[0]?.competitive?.general
  const last = inSeason[inSeason.length - 1]?.competitive?.general
  if (!first || !last) return null

  // The first snapshot of the season is the baseline, so a season that began
  // before tracking still reports only what happened since it was seen.
  const games = Math.max(0, last.games_played - first.games_played)
  const wins = Math.max(0, last.games_won - first.games_won)
  const time = Math.max(0, last.time_played - first.time_played)

  return {
    season: current,
    games,
    wins,
    time,
    winrate: games > 0 ? (wins / games) * 100 : null,
  }
}

export type RoleStat = {
  winrate: number
  kda: number
  games_played: number
  time_played: number
}

export type RoleTrendPoint = {
  date: string
  tank: RoleStat
  damage: RoleStat
  support: RoleStat
}

export async function getRoleTrend(view: ViewMode, days = 90): Promise<RoleTrendPoint[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const out: RoleTrendPoint[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const mode = pickForView(snap, view)
    if (!mode) continue
    out.push({
      date: snap.date,
      tank: pickRole(mode.roles.tank),
      damage: pickRole(mode.roles.damage),
      support: pickRole(mode.roles.support),
    })
  }
  return out
}

function pickRole(r: HistoryModeSnapshot['roles'][keyof HistoryModeSnapshot['roles']]): RoleStat {
  return {
    winrate: r.winrate,
    kda: r.kda,
    games_played: r.games_played,
    time_played: r.time_played,
  }
}

export type RoleDeltaPoint = {
  date: string
  tank: number
  damage: number
  support: number
}

// Per-day time played per role, in seconds — derived by subtracting consecutive
// cumulative role snapshots, same as getDailyDelta does for the general totals.
export async function getRoleDelta(view: ViewMode, days = 90): Promise<RoleDeltaPoint[]> {
  const roles = await getRoleTrend(view, days + 1)
  const out: RoleDeltaPoint[] = []
  for (let i = 1; i < roles.length; i++) {
    const prev = roles[i - 1]
    const curr = roles[i]
    out.push({
      date: curr.date,
      tank: Math.max(0, curr.tank.time_played - prev.tank.time_played),
      damage: Math.max(0, curr.damage.time_played - prev.damage.time_played),
      support: Math.max(0, curr.support.time_played - prev.support.time_played),
    })
  }
  return out
}

export type HeroMover = {
  key: string
  time_played: number
  games_played: number
  winrate: number | null
}

// Heroes ranked by time gained across the window — "what have I been playing
// lately", as opposed to the cumulative all-time roster in RosterTable.
export async function getHeroMovers(
  view: ViewMode,
  days = 30,
  limit = 5
): Promise<HeroMover[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - (days + 1))
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const modes: HistoryModeSnapshot[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const mode = pickForView(snap, view)
    if (mode) modes.push(mode)
  }
  if (modes.length < 2) return []

  const first = modes[0].heroes
  const last = modes[modes.length - 1].heroes

  const movers: HeroMover[] = []
  for (const [key, end] of Object.entries(last)) {
    const start = first[key]
    const time = end.time_played - (start?.time_played ?? 0)
    const games = end.games_played - (start?.games_played ?? 0)
    if (time <= 0 && games <= 0) continue
    // Wins are not stored per hero, so reconstruct them from the cumulative
    // winrate at each end of the window.
    const endWins = (end.winrate / 100) * end.games_played
    const startWins = start ? (start.winrate / 100) * start.games_played : 0
    movers.push({
      key,
      time_played: time,
      games_played: games,
      winrate: games > 0 ? clampPercent(((endWins - startWins) / games) * 100) : null,
    })
  }

  return movers.sort((a, b) => b.time_played - a.time_played).slice(0, limit)
}

function clampPercent(v: number): number {
  return Math.max(0, Math.min(100, v))
}

export function rankToScore(rank: { division: string; tier: number } | null | undefined): number | null {
  if (!rank) return null
  const idx = DIVISIONS.indexOf(rank.division.toLowerCase())
  if (idx < 0) return null
  // Tier 5 = bottom of division, tier 1 = top. Encode so higher = better.
  return idx * 5 + (6 - rank.tier)
}

export type RankTrendPoint = {
  date: string
  season: number | null
  tank: number | null
  damage: number | null
  support: number | null
  tankRank: { division: string; tier: number } | null
  damageRank: { division: string; tier: number } | null
  supportRank: { division: string; tier: number } | null
}

export async function getRankTrend(days = 90): Promise<RankTrendPoint[]> {
  const snaps = await getHistory()
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const out: RankTrendPoint[] = []
  for (const snap of snaps) {
    if (snap.date < cutoffStr) continue
    const ranks = snap.competitive?.ranks
    if (!ranks) continue
    out.push({
      date: snap.date,
      season: typeof ranks.season === 'number' ? ranks.season : null,
      tank: rankToScore(ranks.tank),
      damage: rankToScore(ranks.damage),
      support: rankToScore(ranks.support),
      tankRank: ranks.tank,
      damageRank: ranks.damage,
      supportRank: ranks.support,
    })
  }
  return out
}
