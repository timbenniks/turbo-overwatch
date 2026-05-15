# Phase 2 — Data layer

**Goal:** typed, cached OverFast API client plus the hero theme and asset maps. After this phase, any server component can fetch data with one function call and get a typed response back.

**Estimate:** 1 day
**Prerequisites:** Phase 1 complete
**Spec refs:** §3, §7.2, §7.4, §8.1

---

## Deliverables checklist

- [ ] `types/overfast.ts` — typed response shapes
- [ ] `lib/overfast.ts` — cached API wrappers + error classes
- [ ] `lib/hero-assets.ts` — static 2600px portrait map
- [ ] `lib/hero-theme.ts` — per-hero colour map (default + 6 starters)
- [ ] `lib/constants.ts` — `PLAYER_ID`, `BASE_URL`
- [ ] `scripts/check-api.ts` — manual sanity script
- [ ] Verified: each endpoint returns the shape we typed

---

## Step-by-step

### 1. `types/overfast.ts`

Transcribe from spec §3.4. Use snake_case to match API shape — we don't normalise.

```ts
export type Role = 'tank' | 'damage' | 'support'
export type Platform = 'pc' | 'console'
export type Gamemode = 'quickplay' | 'competitive'

export type Rank = {
  division: string
  tier: number
  role_icon: string
  rank_icon: string
  tier_icon: string
}

export type CompetitivePlatform = {
  season: number
  tank: Rank | null
  damage: Rank | null
  support: Rank | null
  open: Rank | null
} | null

export type PlayerSummary = {
  username: string
  avatar: string
  namecard: string | null
  title: string | null
  endorsement: { level: number; frame: string } | null
  competitive: {
    pc: CompetitivePlatform
    console: CompetitivePlatform
  }
}

export type StatTotals = {
  eliminations: number
  assists: number
  deaths: number
  damage: number
  healing: number
}

export type StatsSummary = {
  games_played: number
  games_won: number
  games_lost: number
  time_played: number
  winrate: number
  kda: number
  total: StatTotals
  average: StatTotals
}

export type PlayerStatsSummary = {
  general: StatsSummary
  roles: {
    tank: StatsSummary
    damage: StatsSummary
    support: StatsSummary
  }
  heroes: Record<string, StatsSummary>
}

export type HeroBackground = {
  sizes: string[]
  url: string
}

export type Hero = {
  name: string
  description: string
  role: Role
  subrole?: string
  portrait?: string | null
  backgrounds: HeroBackground[]
  abilities: Array<{ name: string; description: string; icon?: string }>
  // story, perks, etc. — add when needed
}

export type HeroListItem = {
  key: string
  name: string
  portrait: string | null
  role: Role
}

export type GlobalHeroStat = {
  hero: string
  pickrate: number
  winrate: number
}
```

### 2. `lib/constants.ts`

```ts
export const BASE_URL = 'https://overfast-api.tekrop.fr'
export const PLAYER_ID = 'b3nx-21103'
```

### 3. `lib/overfast.ts`

```ts
import { cacheLife, cacheTag } from 'next/cache'
import { BASE_URL } from './constants'
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
  }
}

export class PrivateProfileError extends Error {
  constructor(public playerId: string) {
    super(`Private profile: ${playerId}`)
  }
}

export function normalisePlayerId(id: string): string {
  return id.replace('#', '-')
}

export async function getPlayerSummary(playerId: string): Promise<PlayerSummary | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`player-${playerId}`, 'player-summary')

  const id = normalisePlayerId(playerId)
  const res = await fetch(`${BASE_URL}/players/${id}/summary`)

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
  cacheLife('minutes')
  cacheTag(`player-${playerId}`, 'player-stats')

  const id = normalisePlayerId(playerId)
  const params = new URLSearchParams()
  if (opts.gamemode) params.set('gamemode', opts.gamemode)
  if (opts.platform) params.set('platform', opts.platform)

  const url = `${BASE_URL}/players/${id}/stats/summary${params.size ? `?${params}` : ''}`
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getHero(key: string): Promise<Hero | null> {
  'use cache'
  cacheLife('days')
  cacheTag(`hero-${key}`, 'heroes')

  const res = await fetch(`${BASE_URL}/heroes/${key}`)
  if (res.status === 404) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getHeroList(): Promise<HeroListItem[]> {
  'use cache'
  cacheLife('days')
  cacheTag('hero-list', 'heroes')

  const res = await fetch(`${BASE_URL}/heroes`)
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}

export async function getGlobalHeroStats(opts: {
  platform?: Platform
  gamemode?: Gamemode
  region?: 'europe' | 'americas' | 'asia'
} = {}): Promise<GlobalHeroStat[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('global-hero-stats')

  const params = new URLSearchParams()
  params.set('platform', opts.platform ?? 'pc')
  params.set('gamemode', opts.gamemode ?? 'quickplay')
  params.set('region', opts.region ?? 'europe')

  const res = await fetch(`${BASE_URL}/heroes/stats?${params}`)
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}
```

**Gotcha:** 429 retry cannot live inside a `'use cache'` function (per spec §8.1). Let the error bubble; Phase 6 adds an error boundary that surfaces the "data may be stale" banner.

### 4. `lib/hero-assets.ts`

Copy `docs/hero_assets.json` into `lib/data/hero-assets.json` (the docs version is a reference now; the runtime copy lives under `lib/`).

```ts
import heroAssets from './data/hero-assets.json'

const assetMap = new Map<string, string>(
  heroAssets.map((entry: { hero: string; url: string }) => [entry.hero, entry.url])
)

export function getHeroPortrait(key: string): string | null {
  return assetMap.get(key) ?? null
}

export function getAllHeroKeys(): string[] {
  return Array.from(assetMap.keys())
}
```

Add `resolveJsonModule: true` in `tsconfig.json` if not already set.

### 5. `lib/hero-theme.ts`

Start with default + 6 starters. Fill the rest in Phase 5 once we see the banners rendering.

```ts
export type HeroTheme = {
  primary: string
  accent: string
  gradient: [string, string, string, string]
}

const themes: Record<string, HeroTheme> = {
  default: {
    primary: '#52525b',
    accent: '#a1a1aa',
    gradient: ['#e4e4e7', '#a1a1aa', '#52525b', '#27272a'],
  },
  genji: {
    primary: '#4d7c0f',
    accent: '#a3e635',
    gradient: ['#d4f0a8', '#a8d676', '#6ba832', '#3d6e0f'],
  },
  reinhardt: {
    primary: '#1e3a8a',
    accent: '#fbbf24',
    gradient: ['#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
  },
  dva: {
    primary: '#0369a1',
    accent: '#f9a8d4',
    gradient: ['#dbeafe', '#bae6fd', '#7dd3fc', '#0369a1'],
  },
  ana: {
    primary: '#78350f',
    accent: '#fde68a',
    gradient: ['#fef3c7', '#fcd34d', '#b45309', '#78350f'],
  },
  tracer: {
    primary: '#c2410c',
    accent: '#fdba74',
    gradient: ['#ffedd5', '#fed7aa', '#f97316', '#c2410c'],
  },
  baptiste: {
    primary: '#0e7490',
    accent: '#67e8f9',
    gradient: ['#cffafe', '#67e8f9', '#0891b2', '#155e75'],
  },
}

export function getHeroTheme(key: string): HeroTheme {
  return themes[key] ?? themes.default
}
```

### 6. `app/dev/api/page.tsx`

A dev-only sanity route that exercises every API wrapper through the real Next cache layer.

```tsx
import { getPlayerSummary, getPlayerStatsSummary, getHero, getHeroList } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'

export default async function ApiDevPage() {
  const [summary, stats, heroes, genji] = await Promise.all([
    getPlayerSummary(PLAYER_ID),
    getPlayerStatsSummary(PLAYER_ID, { gamemode: 'quickplay' }),
    getHeroList(),
    getHero('genji'),
  ])

  return (
    <main className="p-8 font-mono text-[12px] space-y-6">
      <section>
        <h2 className="font-bold">summary</h2>
        <pre>{JSON.stringify(summary, null, 2)}</pre>
      </section>
      <section>
        <h2 className="font-bold">stats — hero keys ({Object.keys(stats?.heroes ?? {}).length})</h2>
        <pre>{Object.keys(stats?.heroes ?? {}).join(', ')}</pre>
      </section>
      <section>
        <h2 className="font-bold">hero list ({heroes.length})</h2>
        <pre>{heroes.slice(0, 5).map((h) => h.key).join(', ')} …</pre>
      </section>
      <section>
        <h2 className="font-bold">genji</h2>
        <pre>backgrounds: {genji?.backgrounds?.length ?? 0}</pre>
      </section>
    </main>
  )
}
```

Reload twice — second load should be near-instant (cache hit).

---

## Acceptance criteria

1. All five API wrappers compile with no TypeScript errors.
2. Hitting `/dev/api` (or running `check-api.ts`) returns real data for `TeKrop-2217`:
   - Summary has `username`, `avatar`, `competitive.pc`
   - Stats summary has `general`, `roles`, and a `heroes` map with >5 keys
   - `getHero('genji')` returns a `backgrounds` array with at least 3 entries
3. Second request within 5 min is served from cache (no network call — verify in network panel or by logging in the wrapper, *outside* the `'use cache'` boundary).
4. `getHeroPortrait('soldier-76')` returns a 2600px URL.
5. `getHeroTheme('zenyatta')` returns the `default` theme (not error).

---

## Files created

```
types/overfast.ts
lib/overfast.ts
lib/hero-assets.ts
lib/data/hero-assets.json    (copied from docs/)
lib/hero-theme.ts
lib/constants.ts
app/dev/api/page.tsx
```

---

## Notes / gotchas

- **API hero keys use hyphens** (`soldier-76`, `junker-queen`, `wrecking-ball`) — match what `hero_assets.json` uses.
- **`hero_assets.json` is a superset** — includes unreleased heroes the API doesn't know about. Don't assume every key in the asset map exists in `/heroes`.
- **Player IDs are case-sensitive.** Keep capitalisation as the user supplied.
- **Don't normalise inside the cached function body** — do it before the cache call if anything ever depends on normalisation key collision. (For v1 it's fine inside.)
- **Path alias:** the `@/*` alias points at project root (`./*` in `tsconfig.json`). JSON imports use relative paths from within `lib/`.
- **Cache Components is strict about determinism.** `Date.now()`, `Math.random()`, etc. in a server component throw at runtime *unless* the component has first read dynamic data (cookies, headers, searchParams, or uncached `fetch()`). If you want timing in `/dev/api`, log it server-side instead of rendering it.
