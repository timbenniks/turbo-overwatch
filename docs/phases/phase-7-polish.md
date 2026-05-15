# Phase 7 — Polish

**Goal:** ship-ready. Lazy-fetched "Best moments" section on hero detail, responsive QA at 375px and 1440px, accessibility pass, small motion touches.

**Estimate:** 1 day
**Prerequisites:** Phases 1–6 complete
**Spec refs:** §5.3 (component grammar), §7.5 (image handling), §7.7 (responsive), §8.8 (best moments)

---

## Deliverables checklist

- [ ] `components/best-moments.tsx` — lazy-loaded trophy cards
- [ ] `lib/overfast.ts` — add `getPlayerStatsDeep(playerId, heroKey)` wrapper for `/players/{id}/stats`
- [ ] Responsive QA — fix breaks at 375px and 1440px
- [ ] Accessibility — alt text, focus rings, hit targets ≥44px
- [ ] `prefers-reduced-motion` honoured
- [ ] Count-up animation on first render of headline numbers (CSS only)
- [ ] Subtle hover lift on hero cards (already there from Phase 4 — verify)
- [ ] Final visual pass — typography, spacing, colour

---

## Step-by-step

### 1. Deep stats endpoint wrapper

Add to `lib/overfast.ts`:

```ts
export type CareerStatCategory = 'assists' | 'average' | 'best' | 'combat' | 'game' | 'hero_specific' | 'match_awards' | 'miscellaneous'

export type CareerStat = { key: string; label: string; value: string | number }

export type CareerStatsByCategory = Partial<Record<CareerStatCategory, CareerStat[]>>

export type PlayerStatsDeep = {
  [heroKey: string]: CareerStatsByCategory
}

export async function getPlayerStatsDeep(
  playerId: string,
  opts: { gamemode?: Gamemode; platform?: Platform; hero?: string } = {}
): Promise<PlayerStatsDeep | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`player-${playerId}`, 'player-stats-deep')

  const id = normalisePlayerId(playerId)
  const params = new URLSearchParams()
  params.set('gamemode', opts.gamemode ?? 'quickplay')
  if (opts.platform) params.set('platform', opts.platform)
  if (opts.hero) params.set('hero', opts.hero)

  const res = await fetch(`${BASE_URL}/players/${id}/stats?${params}`)
  if (res.status === 404) return null
  if (!res.ok) throw new OverfastError(res.status, await res.text())
  return res.json()
}
```

Verify the actual response shape — career stats are heavily nested. Run against `TeKrop-2217&hero=genji` first and inspect.

### 2. `components/best-moments.tsx`

Lazy fetch on the hero detail page. Wrap in `<Suspense>` so the main page renders first.

```tsx
import { getPlayerStatsDeep } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import type { Gamemode } from '@/types/overfast'

export async function BestMoments({
  heroKey,
  gamemode,
}: {
  heroKey: string
  gamemode: Gamemode
}) {
  const deep = await getPlayerStatsDeep(PLAYER_ID, { gamemode, hero: heroKey })
  const heroData = deep?.[heroKey]
  const best = heroData?.best ?? []

  // Pick three highlights — exact keys vary per hero, but these are common
  const elims = findStat(best, ['eliminations_most_in_game', 'eliminations_most_in_life'])
  const streak = findStat(best, ['kill_streak_best'])
  const multikill = findStat(best, ['multikill_best'])

  const cards = [
    { label: 'Most elims in a game', stat: elims },
    { label: 'Best kill streak', stat: streak },
    { label: 'Best multikill', stat: multikill },
  ].filter((c) => c.stat != null)

  if (cards.length === 0) return null

  return (
    <section>
      <SectionHeader>BEST MOMENTS</SectionHeader>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={`bg-surface-card border rounded-xl p-4 ${
              i === 0 ? 'border-text-primary' : 'border-border-default'
            } relative`}
          >
            {i === 0 && (
              <span className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.15em] text-text-tertiary">
                Personal best
              </span>
            )}
            <div className="font-serif text-[28px]">{c.stat?.value}</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary mt-2">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function findStat(stats: { key: string; value: string | number }[] | undefined, keys: string[]) {
  if (!stats) return null
  for (const k of keys) {
    const found = stats.find((s) => s.key === k)
    if (found) return found
  }
  return null
}
```

Wire into `app/hero/[key]/page.tsx`:

```tsx
import { Suspense } from 'react'
import { BestMoments } from '@/components/best-moments'

// ...inside the heroStats && generalStats block:
<Suspense fallback={<BestMomentsSkeleton />}>
  <BestMoments heroKey={key} gamemode={gamemode} />
</Suspense>
```

Skeleton: three pulsing cards in a row.

### 3. Responsive QA

**Test at 375px and 1440px** for every screen. Spec §7.7 table:

| Element | Mobile fix needed |
|---|---|
| Identity header | Stack avatar above pills |
| Role rank stripe | Already mobile-shaped |
| Most played | Horizontal scroll, 1.5 cards visible |
| Career overview | 2×2 grid |
| Roster table | Hide KDA + E/10m columns, surface them inline |
| Hero banner | 240px tall, name 40px |
| Combat signature | 2×2 grid |

Apply Tailwind responsive prefixes:

```tsx
// Most played
<div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory">
  {/* cards get min-w-[60%] md:min-w-0 + snap-start */}
</div>

// Career overview
<div className="grid grid-cols-2 md:grid-cols-4">

// Roster table
<div className="grid grid-cols-[44px_1fr_70px_70px] md:grid-cols-[44px_1fr_80px_80px_80px_80px]">
  {/* hide KDA and E/10m columns on mobile */}
</div>

// Hero banner
<div className="h-[240px] md:h-[280px]">
<h1 className="font-serif text-[40px] md:text-[56px]">

// Combat signature
<div className="grid grid-cols-2 md:grid-cols-4">
```

Open Chrome devtools → device emulation → iPhone SE (375px). Walk through both screens. Note breaks. Fix.

### 4. Accessibility pass

- **Alt text:** every `<Image>` either has descriptive alt (hero portraits: `alt={hero.name}`) or `alt=""` for decorative (namecard, gradients).
- **Focus rings:** add `focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:outline-none` to all `<Link>` and `<button>` elements.
- **Hit targets:** verify nav links, tab buttons, role filter buttons are all ≥44×44px on mobile. Currently the gamemode tabs are 28px tall — bump to `py-2 md:py-1` so mobile has more padding.
- **Semantic landmarks:** wrap nav in `<nav>`, main content in `<main>`, use `<h1>`/`<h2>`/`<h3>` consistently.
- **Colour-only signals:** percentile callouts already pair colour with an arrow icon — good. Verify the green/red winrate cells in the roster table also have a visual cue beyond colour (a small ▲/▼ next to the number).

### 5. `prefers-reduced-motion`

Add to `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6. Count-up animation (optional, CSS only)

Skip if it's not adding value. If included, use CSS `@property` + a custom keyframe — no JS. Keep duration short (≤400ms). Disable under `prefers-reduced-motion`.

### 7. Final visual pass

Walk both screens with the spec open side-by-side and check:

- All headline numbers are serif
- All labels are 11px uppercase with 0.15em letter-spacing
- All borders are 0.5px (use `border` not `border-2`) in `border-default` colour
- Card radius is 12px (`rounded-xl`)
- Drop shadow is only on the headline trio cards that overlap the banner
- No 600 or 700 font weight anywhere
- Hero theme colour shows on roster row borders + hero banner gradient + context chart highlighted bar
- Percentile arrows are consistently ↑ / ↓ / →

---

## Acceptance criteria

1. `/hero/genji` shows three "best moments" cards loaded lazily — first paint of the page does not wait on this fetch.
2. Both screens look intentional at 375px and 1440px — no overflow, no truncated text, no overlapping elements.
3. Tabbing through the page hits every interactive element in a sensible order; focus rings are visible.
4. Setting `prefers-reduced-motion` in devtools disables hover lifts and any count-up animation.
5. Every `<Image>` has alt text or `alt=""`.
6. Lighthouse audit on a production build (`npm run build && npm run start`) shows performance ≥90, accessibility ≥95.
7. No console errors in dev or in production preview.

---

## Files created/modified

```
components/best-moments.tsx
components/skeletons/index.tsx        (add BestMomentsSkeleton)
lib/overfast.ts                       (add getPlayerStatsDeep)
types/overfast.ts                     (add deep stats types)
app/hero/[key]/page.tsx               (mount <BestMoments>)
app/globals.css                       (reduced-motion block)
*                                     (responsive prefixes across all components)
```

---

## Notes / gotchas

- **The deep stats endpoint shape is loose.** Career stats come back as nested objects/arrays with variable keys per hero. Inspect a real response before relying on it. The `best` category is where game-records live.
- **Hide "best moments" if data is empty.** Brand-new heroes or short-play heroes may have no `best` category. The component already returns `null` in that case — verify on a hero with little play.
- **Don't over-animate.** Spec §5.3 implies a calm, editorial register. The count-up is optional. Hover lift and the gradient overlap shadow are enough.
- **Production build performance** is what Lighthouse measures. Don't audit `npm run dev`.
- **Test cache eviction.** Wait 5+ minutes between two requests for the same player to verify the cache regenerates. If it doesn't — check `cacheComponents` is on and the directive is at the top of the function body, not deeper.

---

## Done definition

When this phase passes its acceptance criteria, v1 is complete:

- Home renders for the hard-coded player
- Hero detail renders themed for any hero
- All documented empty states are handled
- Mobile + desktop both look intentional
- The code is set up for v2 (search, career feed, snapshots) but doesn't include them

Update the project README to point at this set of phase files and the spec.
