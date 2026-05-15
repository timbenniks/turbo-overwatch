# Phase 5 — Hero detail page

**Goal:** `/hero/[key]` renders themed to the hero, with banner, headline trio, combat signature, and roster context chart. The "feels like that hero" screen is the second of the two flagship views.

**Estimate:** 1.5 days
**Prerequisites:** Phases 1–4 complete
**Spec refs:** §6.2, §7.4, §8.6

---

## Deliverables checklist

- [ ] `app/hero/[key]/page.tsx` — server component with three parallel fetches
- [ ] Fill remaining ~45 entries in `lib/hero-theme.ts`
- [ ] `components/breadcrumb.tsx`
- [ ] `components/hero-banner.tsx`
- [ ] `components/headline-stat-trio.tsx`
- [ ] `components/combat-signature.tsx`
- [ ] `components/roster-context-chart.tsx`
- [ ] Sparse-data fallback for never-played heroes (don't 404)

---

## Layout structure

```
┌─────────────────────────────────────────┐
│ ← Roster / Genji                        │  Breadcrumb
├─────────────────────────────────────────┤
│ [Full-bleed banner with hero art        │
│  + diagonal gradient overlay in theme]  │
│                                         │
│ TANK · BRAWLER                          │
│ Genji                                   │  56px serif
│ Cyborg ninja...                         │  italic serif
│                              [QP][CP]   │
├─────────────────────────────────────────┤
│  ▼ offset by ~32px                      │
│ [Time] [Win rate] [Games]               │
├─────────────────────────────────────────┤
│ SectionHeader: COMBAT SIGNATURE         │
│ [E/10] [Dmg/10] [FB/10] [D/10]          │
│  with contextual annotations            │
├─────────────────────────────────────────┤
│ SectionHeader: WHERE GENJI SITS         │
│ [Horizontal bar chart of top 8 heroes]  │
│ italic sentence beneath                 │
└─────────────────────────────────────────┘
```

---

## Step-by-step

### 1. `app/hero/[key]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { getPlayerSummary, getPlayerStatsSummary, getHero } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { getHeroTheme } from '@/lib/hero-theme'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeroBanner } from '@/components/hero-banner'
import { HeadlineStatTrio } from '@/components/headline-stat-trio'
import { CombatSignature } from '@/components/combat-signature'
import { RosterContextChart } from '@/components/roster-context-chart'
import { SectionHeader } from '@/components/section-header'
import { getHeroPortrait } from '@/lib/hero-assets'

export default async function HeroDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { key } = await params
  const { mode } = await searchParams
  const gamemode = mode === 'competitive' ? 'competitive' : 'quickplay'

  const [summary, stats, hero] = await Promise.all([
    getPlayerSummary(PLAYER_ID),
    getPlayerStatsSummary(PLAYER_ID, { gamemode }),
    getHero(key),
  ])

  if (!hero) {
    // Hero key isn't recognised by the API — only 404 if it's also missing from our asset map
    if (!getHeroPortrait(key)) notFound()
  }

  const theme = getHeroTheme(key)
  const heroStats = stats?.heroes[key] ?? null
  const generalStats = stats?.general ?? null

  return (
    <main className="max-w-5xl mx-auto pb-16">
      <Breadcrumb heroName={hero?.name ?? key} />
      <HeroBanner heroKey={key} hero={hero} theme={theme} gamemode={gamemode} />

      <div className="px-6 -mt-8 relative z-10">
        {heroStats ? (
          <HeadlineStatTrio
            heroKey={key}
            heroStats={heroStats}
            allHeroes={stats!.heroes}
          />
        ) : (
          <NeverPlayedNotice heroName={hero?.name ?? key} />
        )}
      </div>

      {heroStats && generalStats && (
        <div className="px-6 mt-10 space-y-10">
          <section>
            <SectionHeader>COMBAT SIGNATURE</SectionHeader>
            <CombatSignature heroStats={heroStats} generalStats={generalStats} />
          </section>

          <section>
            <SectionHeader>WHERE {hero?.name.toUpperCase() ?? key.toUpperCase()} SITS IN YOUR ROSTER</SectionHeader>
            <RosterContextChart heroKey={key} stats={stats!} theme={theme} />
          </section>
        </div>
      )}
    </main>
  )
}

function NeverPlayedNotice({ heroName }: { heroName: string }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl p-6 text-center">
      <p className="font-serif text-[18px]">You haven't played {heroName} yet.</p>
      <p className="text-text-secondary text-[13px] mt-2">
        Once you have some games on this hero, this page will show your performance.
      </p>
    </div>
  )
}
```

### 2. Fill `lib/hero-theme.ts`

You have 51 hero keys from `hero_assets.json`. Spend ~1 hour with the Blizzard hero page open for each, picking primary + accent + 4-stop gradient by eye. Reference the spec §7.4: "Genji is jade green, Reinhardt is blue-and-gold, D.Va is sky blue with pink."

**Approach:** copy the visible primary colour from the hero's signature ability/outfit. Don't auto-extract from images. The four gradient stops should go light → mid → primary → dark (top-left to bottom-right of the banner).

**Acceptable shortcut for v1:** assign each unfilled hero a desaturated version of their role colour. Improve over time. Don't block on this — even ~15 heroes hand-tuned + role-fallback for the rest looks good.

```ts
function roleFallback(role: 'tank' | 'damage' | 'support'): HeroTheme {
  const map = {
    tank: { primary: '#c2410c', accent: '#fdba74', gradient: ['#fff7ed','#fed7aa','#f97316','#9a3412'] },
    damage: { primary: '#b91c1c', accent: '#fca5a5', gradient: ['#fef2f2','#fecaca','#ef4444','#7f1d1d'] },
    support: { primary: '#4d7c0f', accent: '#bef264', gradient: ['#f7fee7','#d9f99d','#84cc16','#365314'] },
  }
  return map[role] as HeroTheme
}
```

Expose `getHeroTheme(key, role?)` that falls back to role colour when the key is unknown.

### 3. `components/breadcrumb.tsx`

```tsx
import Link from 'next/link'

export function Breadcrumb({ heroName }: { heroName: string }) {
  return (
    <nav className="px-6 py-4 text-[12px] text-text-tertiary">
      <Link href="/" className="hover:text-text-primary">← Roster</Link>
      <span className="mx-2">/</span>
      <span className="text-text-primary capitalize">{heroName}</span>
    </nav>
  )
}
```

### 4. `components/hero-banner.tsx`

```tsx
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { GameModeTabs } from '@/components/game-mode-tabs' // Phase 6 — stub for now
import type { Hero } from '@/types/overfast'
import type { HeroTheme } from '@/lib/hero-theme'
import type { CSSProperties } from 'react'

export function HeroBanner({
  heroKey,
  hero,
  theme,
  gamemode,
}: {
  heroKey: string
  hero: Hero | null
  theme: HeroTheme
  gamemode: 'quickplay' | 'competitive'
}) {
  const portrait = getHeroPortrait(heroKey)
  const [g1, g2, g3, g4] = theme.gradient

  const overlayStyle: CSSProperties = {
    background: `linear-gradient(110deg, ${g4} 0%, ${g3}cc 35%, ${g2}80 65%, transparent 100%)`,
  }

  return (
    <div className="relative h-[280px] overflow-hidden">
      {portrait && (
        <Image
          src={portrait}
          alt={hero?.name ?? heroKey}
          fill
          priority
          sizes="100vw"
          className="object-cover object-right"
        />
      )}
      <div className="absolute inset-0" style={overlayStyle} />

      <div className="relative h-full flex flex-col justify-end px-6 pb-8 text-white max-w-[420px]">
        <div className="text-[11px] uppercase tracking-[0.15em] opacity-90">
          {hero?.role} {hero?.subrole && `· ${hero.subrole}`}
        </div>
        <h1 className="font-serif text-[56px] leading-none mt-1 capitalize">
          {hero?.name ?? heroKey.replace(/-/g, ' ')}
        </h1>
        {hero?.description && (
          <p className="font-serif italic text-[12px] mt-3 opacity-90 leading-relaxed">
            {hero.description}
          </p>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <GameModeTabs current={gamemode} basePath={`/hero/${heroKey}`} />
      </div>
    </div>
  )
}
```

Note: `<GameModeTabs>` ships in Phase 6. Stub it as a div or import the Phase 6 component if you build it now.

### 5. `components/headline-stat-trio.tsx`

```tsx
import { StatCard } from '@/components/stat-card'
import { PercentileCallout } from '@/components/percentile-callout'
import { percentile } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { StatsSummary } from '@/types/overfast'

export function HeadlineStatTrio({
  heroKey,
  heroStats,
  allHeroes,
}: {
  heroKey: string
  heroStats: StatsSummary
  allHeroes: Record<string, StatsSummary>
}) {
  const time = formatTime(heroStats.time_played)
  const wrPct = percentile('winrate', heroStats.winrate)

  // Time-played rank among player's heroes
  const sorted = Object.entries(allHeroes).sort(([, a], [, b]) => b.time_played - a.time_played)
  const rank = sorted.findIndex(([k]) => k === heroKey) + 1
  const rankStr = rank > 0 ? `${ordinal(rank)} most played` : ''

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        label="TIME"
        value={time.value}
        unit={time.unit}
        subtitle={rankStr}
        className="shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      />
      <StatCard
        label="WIN RATE"
        value={formatPercent(heroStats.winrate)}
        subtitle={<PercentileCallout result={wrPct} />}
        className="shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      />
      <StatCard
        label="GAMES"
        value={String(heroStats.games_played)}
        subtitle={`${heroStats.games_won}W · ${heroStats.games_lost}L`}
        className="shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      />
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
```

### 6. `components/combat-signature.tsx`

```tsx
import { observeCombat } from '@/lib/stats-helpers'
import type { StatsSummary } from '@/types/overfast'

export function CombatSignature({
  heroStats,
  generalStats,
}: {
  heroStats: StatsSummary
  generalStats: StatsSummary
}) {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl grid grid-cols-4 divide-x divide-border-default">
      <Cell
        label="Elims / 10m"
        value={heroStats.average.eliminations.toFixed(1)}
        note={observeCombat(heroStats, generalStats, 'elims')}
      />
      <Cell
        label="Damage / 10m"
        value={`${(heroStats.average.damage / 1000).toFixed(1)}k`}
        note={observeCombat(heroStats, generalStats, 'damage')}
      />
      <Cell
        label="Healing / 10m"
        value={`${(heroStats.average.healing / 1000).toFixed(1)}k`}
        note={heroStats.average.healing > 0 ? 'Above hero avg' : null}
      />
      <Cell
        label="Deaths / 10m"
        value={heroStats.average.deaths.toFixed(1)}
        note={observeCombat(heroStats, generalStats, 'deaths')}
      />
    </div>
  )
}

function Cell({ label, value, note }: { label: string; value: string; note: string | null }) {
  return (
    <div className="p-4">
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary">{label}</div>
      <div className="font-serif text-[26px] mt-1">{value}</div>
      {note && <div className="text-[11px] text-text-secondary mt-1 italic">{note}</div>}
    </div>
  )
}
```

Spec §6.2 mentions Final blows/10min as the third stat. The summary endpoint doesn't expose `final_blows`, only the deep `/stats` endpoint does. Substitute Healing/10m (always present) for v1, or hide the cell if zero. Phase 7's "best moments" fetches the deep endpoint and can revisit.

### 7. `components/roster-context-chart.tsx`

```tsx
import { contextSentence } from '@/lib/stats-helpers'
import { formatTime } from '@/lib/format'
import type { PlayerStatsSummary } from '@/types/overfast'
import type { HeroTheme } from '@/lib/hero-theme'

export function RosterContextChart({
  heroKey,
  stats,
  theme,
}: {
  heroKey: string
  stats: PlayerStatsSummary
  theme: HeroTheme
}) {
  const sorted = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)
  const top8 = sorted.slice(0, 8)
  const maxTime = top8[0]?.[1].time_played ?? 1
  const rank = sorted.findIndex(([k]) => k === heroKey) + 1
  const totalTime = sorted.reduce((acc, [, s]) => acc + s.time_played, 0)
  const heroTime = stats.heroes[heroKey]?.time_played ?? 0
  const top5 = sorted.slice(0, 5)
  const winrateRank = top5.findIndex(([k]) => k === heroKey) === 0 &&
    top5.every(([k, s]) => k === heroKey || s.winrate <= stats.heroes[heroKey].winrate)
    ? 1 : null

  return (
    <div>
      <div className="bg-surface-card border border-border-default rounded-xl p-4 space-y-2">
        {top8.map(([key, s]) => {
          const pct = (s.time_played / maxTime) * 100
          const isCurrent = key === heroKey
          const time = formatTime(s.time_played)
          return (
            <div key={key} className="relative">
              {isCurrent && (
                <span className="absolute -top-3 left-0 text-[9px] tracking-[0.2em] uppercase text-text-primary font-medium">
                  YOU
                </span>
              )}
              <div className="flex items-center gap-3 text-[12px]">
                <span className="w-24 capitalize text-text-secondary truncate">
                  {key.replace(/-/g, ' ')}
                </span>
                <div className="flex-1 h-5 bg-surface-card-active rounded-sm overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      background: isCurrent ? theme.primary : 'var(--color-border-strong)',
                    }}
                  />
                </div>
                <span className="w-16 text-right font-serif">{time.value}{time.unit}</span>
              </div>
            </div>
          )
        })}
      </div>
      {rank > 0 && (
        <p className="mt-3 font-serif italic text-[13px] text-text-secondary">
          {contextSentence({
            rank,
            totalHeroes: sorted.length,
            timeShare: heroTime / totalTime,
            winrateRank,
          })}
        </p>
      )}
    </div>
  )
}
```

---

## Acceptance criteria

1. `/hero/genji` (or any played hero) renders with banner, theme colour, three offset cards, combat signature, context chart.
2. Banner shows the 2600px hero art from `hero_assets.json` with the per-hero gradient overlaying the left side.
3. Hero name in 56px serif. Description in italic serif at ~12px.
4. Headline trio cards have visible drop shadow and overlap the banner.
5. Combat signature annotations show "+X% vs your avg" style copy where applicable.
6. Context chart shows top 8 heroes by time, current hero highlighted in its theme primary colour.
7. `/hero/never-played-key` (e.g. a hero with zero games) renders the banner + biography + "you haven't played them" notice — does **not** 404.
8. `/hero/totally-fake` (not in API and not in asset map) returns 404.
9. Hero theme colour changes are immediately visible when switching from `/hero/genji` to `/hero/reinhardt`.

---

## Files created/modified

```
app/hero/[key]/page.tsx
components/breadcrumb.tsx
components/hero-banner.tsx
components/headline-stat-trio.tsx
components/combat-signature.tsx
components/roster-context-chart.tsx
lib/hero-theme.ts        (filled out)
```

---

## Notes / gotchas

- **Gradient direction matters.** Spec §6.2: diagonal gradient overlay in theme colour at ~70% opacity, fading to transparent on the right where the character art is. The character on Blizzard's 2600px JPEGs is consistently on the right side. Verify on 3–4 heroes.
- **`object-position`** for the banner image is `right` — keep the character visible if the banner crops.
- **`<GameModeTabs>` ships in Phase 6.** Stub a placeholder div or just import the Phase 6 component when you build it.
- **The deep `/stats` endpoint** is *not* called here. Final blows, kill streak best, multikill best all come from there — see Phase 7 ("best moments" section).
- **`SectionHeader` text** for the roster context — interpolating `hero.name.toUpperCase()` produces "WHERE GENJI SITS IN YOUR ROSTER" which is long but reads well. Truncate or break to two lines on mobile (Phase 7).
- **Don't try to perfect the theme map** in this phase. ~15 hand-tuned heroes + role fallback is enough. Iterate later.
