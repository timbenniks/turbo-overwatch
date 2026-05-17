#!/usr/bin/env node
// Daily snapshot writer. Fetches current OverFast stats and appends/replaces
// today's UTC entry in data/history.json. Idempotent within the same UTC day.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const HISTORY_PATH = path.join(ROOT, 'data', 'history.json')

const BASE_URL = process.env.OVERFAST_BASE_URL ?? 'https://overfast-api.tekrop.fr'
const PLAYER_ID = process.env.PLAYER_ID ?? 'b3nx-21103'

function todayUtc() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function get(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return null
  if (res.status === 403) {
    console.warn(`Private profile: ${url}`)
    return null
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} on ${url}`)
  }
  return res.json()
}

function condenseGeneral(g) {
  if (!g) return null
  return {
    time_played: g.time_played ?? 0,
    games_played: g.games_played ?? 0,
    games_won: g.games_won ?? 0,
    winrate: g.winrate ?? 0,
    kda: g.kda ?? 0,
    eliminations: g.total?.eliminations ?? 0,
    assists: g.total?.assists ?? 0,
    deaths: g.total?.deaths ?? 0,
    damage: g.total?.damage ?? 0,
    healing: g.total?.healing ?? 0,
  }
}

function condenseRole(r) {
  if (!r) return { time_played: 0, games_played: 0, winrate: 0, kda: 0 }
  return {
    time_played: r.time_played ?? 0,
    games_played: r.games_played ?? 0,
    winrate: r.winrate ?? 0,
    kda: r.kda ?? 0,
  }
}

function condenseHeroes(heroes) {
  const out = {}
  if (!heroes) return out
  for (const [key, h] of Object.entries(heroes)) {
    if (!h || (h.time_played ?? 0) <= 0) continue
    out[key] = {
      time_played: h.time_played ?? 0,
      games_played: h.games_played ?? 0,
      winrate: h.winrate ?? 0,
      kda: h.kda ?? 0,
    }
  }
  return out
}

function condenseRank(r) {
  if (!r) return null
  return { division: r.division, tier: r.tier }
}

function buildModeSnapshot(stats, ranks) {
  if (!stats) return null
  const snap = {
    general: condenseGeneral(stats.general),
    roles: {
      tank: condenseRole(stats.roles?.tank),
      damage: condenseRole(stats.roles?.damage),
      support: condenseRole(stats.roles?.support),
    },
    heroes: condenseHeroes(stats.heroes),
  }
  if (ranks) {
    snap.ranks = {
      tank: condenseRank(ranks.tank),
      damage: condenseRank(ranks.damage),
      support: condenseRank(ranks.support),
    }
  }
  return snap
}

async function readHistory() {
  if (!existsSync(HISTORY_PATH)) {
    return { v: 1, playerId: PLAYER_ID, snapshots: [] }
  }
  const raw = await readFile(HISTORY_PATH, 'utf8')
  const parsed = JSON.parse(raw)
  if (parsed.v !== 1) throw new Error(`Unsupported history version: ${parsed.v}`)
  return parsed
}

async function writeHistory(history) {
  await mkdir(path.dirname(HISTORY_PATH), { recursive: true })
  await writeFile(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n', 'utf8')
}

async function main() {
  const date = todayUtc()
  console.log(`Snapshotting ${PLAYER_ID} for ${date}`)

  const [summary, quickplayStats, competitiveStats] = await Promise.all([
    get(`${BASE_URL}/players/${PLAYER_ID}/summary`),
    get(`${BASE_URL}/players/${PLAYER_ID}/stats/summary?gamemode=quickplay`),
    get(`${BASE_URL}/players/${PLAYER_ID}/stats/summary?gamemode=competitive`),
  ])

  if (!quickplayStats && !competitiveStats) {
    console.error('Both quickplay and competitive returned no data — refusing to write.')
    process.exit(1)
  }

  const compRanks = summary?.competitive?.pc ?? null

  const snapshot = {
    date,
    capturedAt: new Date().toISOString(),
    quickplay: buildModeSnapshot(quickplayStats, null),
    competitive: buildModeSnapshot(competitiveStats, compRanks),
  }

  const history = await readHistory()
  const idx = history.snapshots.findIndex((s) => s.date === date)
  if (idx >= 0) {
    history.snapshots[idx] = snapshot
    console.log(`Replaced existing snapshot for ${date}`)
  } else {
    history.snapshots.push(snapshot)
    console.log(`Appended new snapshot for ${date}`)
  }
  history.snapshots.sort((a, b) => a.date.localeCompare(b.date))
  history.playerId = PLAYER_ID

  await writeHistory(history)
  console.log(`History now has ${history.snapshots.length} day(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
