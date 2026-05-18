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
    const elims = curr.eliminations - prev.eliminations
    const assists = curr.assists - prev.assists
    const deaths = curr.deaths - prev.deaths
    const winrate = games > 0 ? (wins / games) * 100 : 0
    const kda = deaths > 0 ? (elims + assists) / deaths : elims + assists
    out.push({
      date: filtered[i].date,
      games_played: games,
      time_played: time,
      wins,
      winrate,
      kda,
    })
  }
  return out
}

export type RoleTrendPoint = {
  date: string
  tank: { winrate: number; kda: number; games_played: number }
  damage: { winrate: number; kda: number; games_played: number }
  support: { winrate: number; kda: number; games_played: number }
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

function pickRole(r: HistoryModeSnapshot['roles'][keyof HistoryModeSnapshot['roles']]) {
  return { winrate: r.winrate, kda: r.kda, games_played: r.games_played }
}

const DIVISION_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'champion']

export function rankToScore(rank: { division: string; tier: number } | null | undefined): number | null {
  if (!rank) return null
  const idx = DIVISION_ORDER.indexOf(rank.division.toLowerCase())
  if (idx < 0) return null
  // Tier 5 = bottom of division, tier 1 = top. Encode so higher = better.
  return idx * 5 + (6 - rank.tier)
}

export type RankTrendPoint = {
  date: string
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
