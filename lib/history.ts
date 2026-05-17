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
}

// Returns per-day deltas — i.e. games played *that day*, derived by subtracting
// consecutive cumulative snapshots. Useful for "activity" bar charts.
export async function getDailyDelta(view: ViewMode, days = 30): Promise<DailyDelta[]> {
  const trend = await getTrend(view, days + 1)
  const out: DailyDelta[] = []
  for (let i = 1; i < trend.length; i++) {
    const prev = trend[i - 1]
    const curr = trend[i]
    const games = Math.max(0, curr.games_played - prev.games_played)
    const time = Math.max(0, curr.time_played - prev.time_played)
    const prevWins = (prev.winrate / 100) * prev.games_played
    const currWins = (curr.winrate / 100) * curr.games_played
    const wins = Math.max(0, Math.round(currWins - prevWins))
    out.push({ date: curr.date, games_played: games, time_played: time, wins })
  }
  return out
}
