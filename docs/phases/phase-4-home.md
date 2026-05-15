# Phase 4 — Home page

**Goal:** `/` renders the full Home dashboard against live data for `TeKrop-2217`. This is the biggest visible phase — the screen we judge "is this design working" against.

**Estimate:** 1.5 days
**Prerequisites:** Phases 1–3 complete
**Spec refs:** §6.1, §5.4 (banner + offset cards pattern)

---

## Deliverables checklist

- [ ] `app/page.tsx` — server component with two parallel fetches
- [ ] `components/identity-header.tsx`
- [ ] `components/role-rank-stripe.tsx`
- [ ] `components/most-played.tsx` + `<HeroCardLarge>`
- [ ] `components/career-overview.tsx`
- [ ] `components/roster-table.tsx`
- [ ] `<Suspense>` boundaries around data-bound sections
- [ ] Skeleton fallbacks (basic — full polish in Phase 7)

---

## Layout structure (top to bottom)

```
┌─────────────────────────────────────────┐
│ Namecard banner (96px, overlaps content)│
│  ▼ overlapping by ~32px                 │
│ Avatar + username + title + actions     │
├─────────────────────────────────────────┤
│ SectionHeader: ROLE RANKS               │
│ [Tank] [Damage] [Support]               │
├─────────────────────────────────────────┤
│ SectionHeader: MOST PLAYED              │
│ [Hero card] [Hero card] [Hero card]     │
├─────────────────────────────────────────┤
│ SectionHeader: CAREER OVERVIEW          │
│ Card: 4 stats + percentile callouts     │
├─────────────────────────────────────────┤
│ SectionHeader: YOUR ROSTER              │
│ Filter chips: ALL / TANK / DMG / SUP    │
│ Table rows (top 6) + "Show more"        │
└─────────────────────────────────────────┘
```

Max width: ~960px centered. Tailwind: `max-w-5xl mx-auto`.

---

## Step-by-step

### 1. `app/page.tsx`

```tsx
import { Suspense } from 'react'
import { getPlayerSummary, getPlayerStatsSummary } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { IdentityHeader } from '@/components/identity-header'
import { RoleRankStripe } from '@/components/role-rank-stripe'
import { MostPlayed } from '@/components/most-played'
import { CareerOverview } from '@/components/career-overview'
import { RosterTable } from '@/components/roster-table'
import { SectionHeader } from '@/components/section-header'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const gamemode = mode === 'competitive' ? 'competitive' : 'quickplay'

  const [summary, stats] = await Promise.all([
    getPlayerSummary(PLAYER_ID),
    getPlayerStatsSummary(PLAYER_ID, { gamemode }),
  ])

  if (!summary || !stats) {
    // Phase 6 replaces this with proper empty states
    return <main className="p-8">Profile not found.</main>
  }

  return (
    <main className="max-w-5xl mx-auto pb-16">
      <IdentityHeader summary={summary} />
      <div className="px-6 space-y-10 mt-6">
        <section>
          <SectionHeader>ROLE RANKS</SectionHeader>
          <RoleRankStripe summary={summary} stats={stats} />
        </section>

        <section>
          <SectionHeader>MOST PLAYED</SectionHeader>
          <MostPlayed stats={stats} />
        </section>

        <section>
          <SectionHeader>CAREER OVERVIEW</SectionHeader>
          <CareerOverview stats={stats} gamemode={gamemode} />
        </section>

        <section>
          <SectionHeader>YOUR ROSTER</SectionHeader>
          <RosterTable stats={stats} />
        </section>
      </div>
    </main>
  )
}
```

Add Suspense boundaries around `<MostPlayed>` and `<RosterTable>` later if the page feels slow on first paint. For now, the two fetches happen at the top; everything else is sync.

### 2. `components/identity-header.tsx`

```tsx
import Image from 'next/image'
import type { PlayerSummary } from '@/types/overfast'

export function IdentityHeader({ summary }: { summary: PlayerSummary }) {
  const [username, tag] = summary.username.split('#')

  return (
    <header className="relative">
      <div className="h-24 w-full overflow-hidden bg-gradient-to-br from-role-tank/40 to-role-support/40">
        {summary.namecard && (
          <Image
            src={summary.namecard}
            alt=""
            width={1200}
            height={96}
            className="w-full h-full object-cover"
            priority
          />
        )}
      </div>

      <div className="px-6 -mt-10 flex items-end gap-4">
        <div className="relative">
          <Image
            src={summary.avatar}
            alt={`${username} avatar`}
            width={72}
            height={72}
            className="rounded-full ring-4 ring-surface-canvas"
          />
        </div>
        <div className="flex-1 pb-2">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-[22px] text-text-primary">{username}</h1>
            {tag && <span className="text-[11px] text-text-tertiary">#{tag}</span>}
          </div>
          {summary.title && (
            <p className="font-serif italic text-[12px] text-text-secondary">
              {summary.title}
            </p>
          )}
        </div>
        {summary.endorsement && (
          <div className="pb-2 flex items-center gap-1 text-[11px] text-text-tertiary">
            <Image src={summary.endorsement.frame} alt="" width={20} height={20} />
            <span>Endorsement {summary.endorsement.level}</span>
          </div>
        )}
      </div>
    </header>
  )
}
```

### 3. `components/role-rank-stripe.tsx`

```tsx
import { RolePill } from '@/components/role-pill'
import { formatPercent } from '@/lib/format'
import type { PlayerSummary, PlayerStatsSummary, Role } from '@/types/overfast'

const ROLES: Role[] = ['tank', 'damage', 'support']

export function RoleRankStripe({
  summary,
  stats,
}: {
  summary: PlayerSummary
  stats: PlayerStatsSummary
}) {
  const pcRanks = summary.competitive?.pc

  return (
    <div className="grid grid-cols-3 gap-3">
      {ROLES.map((role) => {
        const rank = pcRanks?.[role] ?? null
        const division = rank ? `${rank.division[0].toUpperCase()}${rank.tier}` : undefined
        const roleStats = stats.roles[role]
        return (
          <div key={role} className="bg-surface-card border border-border-default border-l-[3px] border-l-role-tank/0 rounded-xl p-4" data-role={role}>
            <div className="flex items-center justify-between mb-2">
              <RolePillInner role={role} division={division} />
              <span className="text-[10px] text-text-tertiary uppercase tracking-[0.1em]">
                {roleStats.games_played} games
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[22px]">{formatPercent(roleStats.winrate)}</span>
              <span className="text-[11px] text-text-tertiary">
                {roleStats.games_won}W · {roleStats.games_lost}L
              </span>
            </div>
            <div className="text-[11px] text-text-tertiary mt-1">
              KDA {roleStats.kda.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Inline simpler pill (the standalone RolePill is the bordered card variant)
function RolePillInner({ role, division }: { role: Role; division?: string }) {
  const labels = { tank: 'Tank', damage: 'Damage', support: 'Support' } as const
  const colors = { tank: 'text-role-tank', damage: 'text-role-damage', support: 'text-role-support' } as const
  return (
    <div className="text-[11px] uppercase tracking-[0.15em]">
      <span className={colors[role]}>{labels[role]}</span>
      {division && <span className="text-text-tertiary"> · {division}</span>}
    </div>
  )
}
```

Use the actual `<RolePill>` from Phase 3 if it fits; otherwise inline the simpler version. Decide once you see it on screen.

### 4. `components/most-played.tsx` + `<HeroCardLarge>`

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { formatTime, formatPercent } from '@/lib/format'
import type { PlayerStatsSummary, StatsSummary } from '@/types/overfast'

export function MostPlayed({ stats }: { stats: PlayerStatsSummary }) {
  const top3 = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)
    .slice(0, 3)

  return (
    <div className="grid grid-cols-3 gap-4">
      {top3.map(([key, heroStats]) => (
        <HeroCardLarge key={key} heroKey={key} stats={heroStats} />
      ))}
    </div>
  )
}

function HeroCardLarge({ heroKey, stats }: { heroKey: string; stats: StatsSummary }) {
  const portrait = getHeroPortrait(heroKey)
  const time = formatTime(stats.time_played)

  return (
    <Link
      href={`/hero/${heroKey}`}
      className="relative block aspect-[3/4] rounded-xl overflow-hidden bg-surface-card border border-border-default group"
    >
      {portrait && (
        <Image
          src={portrait}
          alt={heroKey}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="font-serif text-[20px] capitalize">{heroKey.replace(/-/g, ' ')}</h3>
        <div className="text-[12px] mt-1 opacity-90 flex gap-3">
          <span>{time.value}{time.unit}</span>
          <span>{formatPercent(stats.winrate)} WR</span>
        </div>
      </div>
    </Link>
  )
}
```

**Section label:** "Most played" — no "this week" (spec §8.5: API doesn't expose time-windowed data).

### 5. `components/career-overview.tsx`

```tsx
import { StatCard } from '@/components/stat-card'
import { PercentileCallout } from '@/components/percentile-callout'
import { percentile } from '@/lib/stats-helpers'
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
      <div className="flex justify-between items-baseline mb-3">
        <span /> {/* SectionHeader sits above already */}
        <span className="text-[11px] text-text-tertiary">
          PC · {gamemode === 'competitive' ? 'competitive' : 'quick play'} · {time.value}{time.unit} · {g.games_played} matches
        </span>
      </div>
      <div className="bg-surface-card border border-border-default rounded-xl grid grid-cols-4 divide-x divide-border-default">
        <Cell label="Elims / 10m" value={g.average.eliminations.toFixed(1)} pct={percentile('elims_per_10', g.average.eliminations)} />
        <Cell label="Damage / 10m" value={`${(g.average.damage / 1000).toFixed(1)}k`} pct={percentile('damage_per_10', g.average.damage)} />
        <Cell label="KDA" value={g.kda.toFixed(2)} pct={percentile('kda', g.kda)} />
        <Cell label="Win rate" value={formatPercent(g.winrate)} pct={percentile('winrate', g.winrate)} />
      </div>
    </div>
  )
}

function Cell({ label, value, pct }: { label: string; value: string; pct: ReturnType<typeof percentile> }) {
  return (
    <div className="p-4">
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary">{label}</div>
      <div className="font-serif text-[26px] mt-1">{value}</div>
      <div className="mt-1"><PercentileCallout result={pct} /></div>
    </div>
  )
}
```

### 6. `components/roster-table.tsx`

```tsx
'use client' // only because of the role filter state — could be split if needed

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { getHeroTheme } from '@/lib/hero-theme'
import { observeRoster } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { PlayerStatsSummary, Role } from '@/types/overfast'

type Filter = 'all' | Role

export function RosterTable({ stats }: { stats: PlayerStatsSummary }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)

  // We don't have per-hero role mapping from stats summary — need to either:
  //   (a) cross-reference with getHeroList() result, or
  //   (b) accept role passed in from a parent that resolved it
  // For now, this component receives `heroRoles` lookup from page-level fetch.
  // TODO: thread `heroRoles` from page.tsx — fetch getHeroList there.

  const observations = observeRoster(stats)
  const obsMap = new Map(observations.map((o) => [o.heroKey, o.pill]))

  const sorted = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)
  const rows = showAll ? sorted : sorted.slice(0, 6)

  return (
    <div>
      <div className="flex gap-2 mb-3 text-[11px] uppercase tracking-[0.15em]">
        {(['all', 'tank', 'damage', 'support'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full border ${
              filter === f
                ? 'bg-text-primary text-surface-canvas border-text-primary'
                : 'border-border-default text-text-tertiary'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_80px_80px_80px_80px] gap-3 px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-text-tertiary border-b border-border-default">
          <span /> <span>Hero</span> <span className="text-right">Time</span>
          <span className="text-right">WR</span> <span className="text-right">KDA</span>
          <span className="text-right">E/10m</span>
        </div>
        {rows.map(([key, heroStats]) => {
          const theme = getHeroTheme(key)
          const time = formatTime(heroStats.time_played)
          const portrait = getHeroPortrait(key)
          const pill = obsMap.get(key)
          return (
            <Link
              href={`/hero/${key}`}
              key={key}
              className="grid grid-cols-[44px_1fr_80px_80px_80px_80px] gap-3 px-4 py-3 items-center border-b border-border-default last:border-b-0 hover:bg-surface-card-active"
              style={{ borderLeft: `3px solid ${theme.primary}` }}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-border-default">
                {portrait && <Image src={portrait} alt="" fill className="object-cover" />}
              </div>
              <div>
                <div className="capitalize text-[14px]">{key.replace(/-/g, ' ')}</div>
                {pill && <div className="text-[10px] text-semantic-good mt-0.5">{pill}</div>}
              </div>
              <div className="text-right font-serif">{time.value}<span className="text-text-tertiary text-[11px] ml-0.5">{time.unit}</span></div>
              <div className={`text-right font-serif ${heroStats.winrate >= 50 ? 'text-semantic-good' : 'text-semantic-warn'}`}>
                {formatPercent(heroStats.winrate)}
              </div>
              <div className="text-right font-serif">{heroStats.kda.toFixed(2)}</div>
              <div className="text-right font-serif">{heroStats.average.eliminations.toFixed(1)}</div>
            </Link>
          )
        })}
      </div>

      {!showAll && sorted.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-[12px] text-text-secondary hover:text-text-primary"
        >
          Show {sorted.length - 6} more heroes →
        </button>
      )}
    </div>
  )
}
```

**Important:** the role-per-hero data is not in `stats.heroes`. You need `getHeroList()` to map `heroKey → role`. Either:
- Fetch it in `page.tsx` and pass `heroRoles: Record<string, Role>` as a prop, or
- Make `<RosterTable>` `async` server component and split the client filter into a sub-component.

The cleaner path: fetch `getHeroList()` in `page.tsx`, build the role map there, pass down. The role filter stays in this client component.

---

## Acceptance criteria

1. Navigating to `/` renders the full Home page against live `TeKrop-2217` data.
2. Namecard banner shows with avatar overlapping by ~32px.
3. Three role rank cards render, with `—` muted state for any unranked role.
4. Most-played row shows three large hero cards with portraits from `hero_assets.json`, each links to `/hero/{key}` (page can 404 until Phase 5).
5. Career overview shows 4 stats with percentile callouts in the right semantic colours.
6. Roster table shows the top 6 heroes sorted by time played, role filter works client-side, "Show more" expands.
7. Hero theme colour shows on each roster row's left border.
8. No layout shift between fonts loading and the page settling (use `next/font` `display: 'swap'` if needed).

---

## Files created

```
app/page.tsx
components/identity-header.tsx
components/role-rank-stripe.tsx
components/most-played.tsx
components/career-overview.tsx
components/roster-table.tsx
```

---

## Notes / gotchas

- **Role-per-hero mapping** is the trickiest data wiring on this page. Decide upfront whether to fetch `getHeroList()` here or defer.
- **`stats.heroes` keys are hyphenated** (`soldier-76`, `wrecking-ball`). The hero theme map and asset map use the same hyphenation — verify a `soldier-76` row renders correctly.
- **Hero display name:** spec doesn't insist on it, but `key.replace(/-/g, ' ')` then capitalising is fine for now. Later, swap to the actual `name` field from `getHeroList()`.
- **Don't add the search/settings action buttons** on the header in v1 — spec §6.1 says placeholder is fine. Skip them to save time, or stub no-op buttons.
- **Suspense boundaries:** if first paint feels slow once data is wired, wrap `<MostPlayed>` and `<RosterTable>` in `<Suspense>` with basic skeletons. Spec §7.3.
