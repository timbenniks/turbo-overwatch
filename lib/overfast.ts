import { cacheLife, cacheTag } from 'next/cache'
import { BASE_URL } from './constants'
import { mergeSummary, mergeDeep } from './merge-stats'
import type { ViewMode } from './view-mode'
import type {
  PlayerSummary,
  PlayerStatsSummary,
  Hero,
  HeroListItem,
  GlobalHeroStat,
  Gamemode,
  Platform,
} from '@/types/overfast'

export class OverfastError extends Error {
  constructor(public status: number, public body: string) {
    super(`OverFast ${status}: ${body}`)
    this.name = 'OverfastError'
  }
}

export class PrivateProfileError extends Error {
  constructor(public playerId: string) {
    super(`Private profile: ${playerId}`)
    this.name = 'PrivateProfileError'
  }
}

export function normalisePlayerId(id: string): string {
  return id.replace('#', '-')
}

const PLAYER_DATA_LIFE = { stale: 60, revalidate: 3600, expire: 86400 }

async function fetchWithRetry(url: string, attempts = 5): Promise<Response> {
  let last: Response | null = null
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url)
    if (res.ok || res.status === 404 || res.status === 403) return res
    last = res
    if (res.status !== 429 && res.status < 500) return res
    // A production build prerenders with 8 parallel workers, which trips
    // OverFast's rate limit in bursts. It tells us how long to wait — obey it
    // rather than guessing, or the build fails on a transient 429.
    const retryAfter = Number(res.headers.get('retry-after'))
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000 + 250
      : 500 * Math.pow(2, i) + Math.random() * 250
    await new Promise((r) => setTimeout(r, Math.min(delay, 10_000)))
  }
  return last!
}

export async function getPlayerSummary(playerId: string): Promise<PlayerSummary | null> {
  'use cache'
  cacheLife(PLAYER_DATA_LIFE)
  cacheTag(`player-${playerId}`, 'player-summary')

  const id = normalisePlayerId(playerId)
  const res = await fetchWithRetry(`${BASE_URL}/players/${id}/summary`)

  if (res.status === 404) return null
  if (res.status === 403) throw new PrivateProfileError(id)
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getPlayerStatsSummary(
  playerId: string,
  opts: { gamemode?: Gamemode; platform?: Platform } = {}
): Promise<PlayerStatsSummary | null> {
  'use cache'
  cacheLife(PLAYER_DATA_LIFE)
  cacheTag(`player-${playerId}`, 'player-stats')

  const id = normalisePlayerId(playerId)
  const params = new URLSearchParams()
  if (opts.gamemode) params.set('gamemode', opts.gamemode)
  if (opts.platform) params.set('platform', opts.platform)

  const qs = params.toString()
  const url = `${BASE_URL}/players/${id}/stats/summary${qs ? `?${qs}` : ''}`
  const res = await fetchWithRetry(url)
  if (res.status === 404) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getHero(key: string): Promise<Hero | null> {
  'use cache'
  cacheLife('days')
  cacheTag(`hero-${key}`, 'heroes')

  const res = await fetchWithRetry(`${BASE_URL}/heroes/${key}`)
  // The hero key comes straight from the URL, and OverFast validates it against
  // an enum — so an unknown hero is a 422, not a 404. Both mean "no such hero";
  // throwing instead logged an unhandled error on every bad /hero/... URL.
  if (res.status === 404 || res.status === 422) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getHeroList(): Promise<HeroListItem[]> {
  'use cache'
  cacheLife('days')
  cacheTag('hero-list', 'heroes')

  const res = await fetchWithRetry(`${BASE_URL}/heroes`)
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export type DeepStat = { key: string; label: string; value: string | number }
export type DeepCategory = {
  category:
    | 'assists'
    | 'average'
    | 'best'
    | 'combat'
    | 'game'
    | 'hero_specific'
    | 'match_awards'
    | 'miscellaneous'
  label: string
  stats: DeepStat[]
}
export type PlayerStatsDeep = Record<string, DeepCategory[]>

export async function getPlayerStatsDeep(
  playerId: string,
  opts: { gamemode?: Gamemode; platform?: Platform; hero?: string } = {}
): Promise<PlayerStatsDeep | null> {
  'use cache'
  cacheLife(PLAYER_DATA_LIFE)
  cacheTag(`player-${playerId}`, 'player-stats-deep')

  const id = normalisePlayerId(playerId)
  const params = new URLSearchParams()
  params.set('gamemode', opts.gamemode ?? 'quickplay')
  if (opts.platform) params.set('platform', opts.platform)
  if (opts.hero) params.set('hero', opts.hero)

  const res = await fetchWithRetry(`${BASE_URL}/players/${id}/stats?${params}`)
  if (res.status === 404) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export type StatsSummaryBreakdown = {
  combined: PlayerStatsSummary | null
  quickplay: PlayerStatsSummary | null
  competitive: PlayerStatsSummary | null
}

export async function getPlayerStatsBreakdown(
  playerId: string,
  opts: { platform?: Platform } = {}
): Promise<StatsSummaryBreakdown> {
  const [quickplay, competitive] = await Promise.all([
    getPlayerStatsSummary(playerId, { gamemode: 'quickplay', platform: opts.platform }),
    getPlayerStatsSummary(playerId, { gamemode: 'competitive', platform: opts.platform }),
  ])
  return {
    quickplay,
    competitive,
    combined: mergeSummary(quickplay, competitive),
  }
}

export function selectStatsForView(
  breakdown: StatsSummaryBreakdown,
  view: ViewMode
): PlayerStatsSummary | null {
  if (view === 'quickplay') return breakdown.quickplay
  if (view === 'competitive') return breakdown.competitive
  return breakdown.combined
}

export async function getPlayerStatsDeepForView(
  playerId: string,
  view: ViewMode,
  opts: { platform?: Platform; hero?: string } = {}
): Promise<PlayerStatsDeep | null> {
  if (view !== 'all') {
    return getPlayerStatsDeep(playerId, { gamemode: view, ...opts })
  }
  const [qpDeep, compDeep, qpSummary, compSummary] = await Promise.all([
    getPlayerStatsDeep(playerId, { gamemode: 'quickplay', ...opts }),
    getPlayerStatsDeep(playerId, { gamemode: 'competitive', ...opts }),
    getPlayerStatsSummary(playerId, { gamemode: 'quickplay', platform: opts.platform }),
    getPlayerStatsSummary(playerId, { gamemode: 'competitive', platform: opts.platform }),
  ])
  return mergeDeep(
    { deep: qpDeep, timePlayed: qpSummary?.general.time_played ?? 0 },
    { deep: compDeep, timePlayed: compSummary?.general.time_played ?? 0 }
  )
}

export async function getGlobalHeroStats(
  opts: {
    platform?: Platform
    gamemode?: Gamemode
    region?: 'europe' | 'americas' | 'asia'
  } = {}
): Promise<GlobalHeroStat[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('global-hero-stats')

  const params = new URLSearchParams()
  params.set('platform', opts.platform ?? 'pc')
  params.set('gamemode', opts.gamemode ?? 'quickplay')
  params.set('region', opts.region ?? 'europe')

  const res = await fetchWithRetry(`${BASE_URL}/heroes/stats?${params}`)
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}
