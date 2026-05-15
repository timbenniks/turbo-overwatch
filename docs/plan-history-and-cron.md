# Historical data + daily snapshots — implementation plan

OverFast is snapshot-only — no time-series. To plot trends we need to capture
our own daily snapshots and store them somewhere. Decision: Vercel + Upstash
(Vercel KV / Redis on the marketplace) + Vercel Cron, hitting our own snapshot
route once per day.

## Phase 0 — Vercel + storage setup (do this first, in order)

1. `vercel link` from project root — creates `.vercel/` (already gitignored).
2. `vercel` (preview deploy) — needed so we have a project ID to attach storage to.
3. Go to the project on vercel.com → Storage → "Upstash for Redis" (the Vercel KV successor on the marketplace). Provision the free tier, attach to this project.
4. `vercel env pull .env.local` — pulls the `KV_*` / `UPSTASH_REDIS_*` env vars locally.
5. Verify `.env.local` is gitignored (it is — `.env*.local` is covered).
6. `npm i @upstash/redis` (or `@vercel/kv` if it still proxies cleanly — check which the marketplace integration actually wires up before installing).

## Phase 1 — Snapshot writer

**Route**: `app/api/cron/snapshot/route.ts`

- `export const runtime = 'nodejs'` — needs network + redis.
- `export const dynamic = 'force-dynamic'` — never cache.
- Auth: check `req.headers.get('authorization') === \`Bearer ${process.env.CRON_SECRET}\``. Vercel cron auto-sends this if `CRON_SECRET` is set in env.
- Fetch in parallel: `getPlayerSummary`, `getPlayerStatsSummary(quickplay)`, `getPlayerStatsSummary(competitive)`. Skip writing if either returns null (private profile / API hiccup) — don't poison the series.
- Write payload (see schema below).
- Return `{ ok: true, date, bytes }` for log inspection.

**Schema** — keep it dumb, append-only, one row per day per gamemode:

```ts
// key:  snap:{playerId}:{gamemode}:{YYYY-MM-DD}    (UTC date)
// value: SnapshotV1
type SnapshotV1 = {
  v: 1
  date: string                // YYYY-MM-DD UTC
  capturedAt: string          // ISO timestamp
  gamemode: 'quickplay' | 'competitive'
  general: {
    time_played: number
    games_played: number
    games_won: number
    winrate: number
    kda: number
    eliminations_per_10: number
    damage_per_10: number
    healing_per_10: number
    deaths_per_10: number
  }
  roles: Record<Role, { time_played: number; games_played: number; winrate: number; kda: number }>
  heroes: Record<string, {    // only heroes with time_played > 0
    time_played: number
    games_played: number
    winrate: number
    kda: number
  }>
  competitive?: {             // from summary.competitive.pc
    tank?:    { division: string; tier: number } | null
    damage?:  { division: string; tier: number } | null
    support?: { division: string; tier: number } | null
  }
}

// secondary index for cheap range scans without SCAN:
// key:  snap:{playerId}:{gamemode}:index    (sorted set)
// score: epoch seconds of date midnight UTC
// member: YYYY-MM-DD
```

Idempotency: if today's key already exists, overwrite — last write of the day wins. That way a manual replay during the same UTC day is safe.

Don't store the deep-stats payload here. Per-hero "best in game" etc. is already retrievable on-demand from OverFast and would balloon the snapshot 10×.

## Phase 2 — Cron config

**File**: `vercel.json`

```json
{
  "crons": [
    { "path": "/api/cron/snapshot", "schedule": "0 6 * * *" }
  ]
}
```

- Daily at 06:00 UTC. Hobby plan allows daily-only — that's fine.
- Add `CRON_SECRET` to Vercel env (generate with `openssl rand -hex 32`).
- After deploy, hit the route manually once with the bearer token to seed day 1.

## Phase 3 — Read layer

**File**: `lib/history.ts`

- `getHistoryRange(playerId, gamemode, days)` — zrange the index for last N days, mget all matching snapshot keys, parse to `SnapshotV1[]`. Wrap in `'use cache'` with `cacheLife('hours')` and tag `history:${playerId}:${gamemode}` so we can invalidate after a snapshot write if we ever want push-fresh charts.
- `getHeroHistory(playerId, gamemode, heroKey, days)` — same fetch, then `.map(s => ({ date, ...s.heroes[heroKey] }))` filtered to non-null.

Skip writing tests; verify by hitting the snapshot route a few times with mocked dates and reading back.

## Phase 4 — Charts

Start narrow: one chart on the homepage and one per hero page.

- **Homepage**: line chart of overall KDA + win rate over time. Two y-axes or two stacked mini-charts.
- **Hero page**: time_played growth + win rate trend.

Library: **Recharts** (already SSR-friendly) or hand-rolled SVG. Recharts is one dep and reasonable, but it's client-only — wrap in `'use client'` leaf components and pass server-fetched data in as props. Don't fetch in the client.

Empty state: if fewer than 3 data points, render a "collecting history — check back in a few days" placeholder instead of a flat chart.

## Open questions for tomorrow

- **Backfill?** OverFast can't give us history, so day 1 of the chart will be the day we deploy. Accept that, or seed a synthetic point 30 days back at zeros? I'd accept it and just show the real ramp.
- **Retention?** No need to expire keys for one player. If we ever multi-tenant this, set TTL on the snapshot keys to e.g. 2 years.
- **Per-hero pruning?** Currently storing every hero the player has touched. ~40 heroes × ~120 bytes × 365 = ~1.7 MB/year, well within free Upstash. Leave it.
- **Where does the cron actually run from?** Vercel cron region — confirm it can reach overfast-api.tekrop.fr without rate-limiting.

## Order of operations tomorrow

1. Phase 0 (link, deploy, provision KV, pull env)
2. Write `lib/kv.ts` thin wrapper around the redis client
3. Implement `app/api/cron/snapshot/route.ts` + types
4. `vercel.json` cron + `CRON_SECRET` in Vercel env
5. Deploy, manually hit the route to seed today
6. Wait a day, hit again, verify two snapshots are stored and `zrange` returns both
7. Then move on to Phase 3/4
