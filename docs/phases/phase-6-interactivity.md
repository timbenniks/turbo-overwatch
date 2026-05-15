# Phase 6 — Interactivity + edge cases

**Goal:** the dashboard handles every state the spec calls out — gamemode tabs, role filter, empty states, private profiles, rate limiting. After this phase, nothing should crash the page.

**Estimate:** 1 day
**Prerequisites:** Phases 1–5 complete
**Spec refs:** §7.8, §8.1, §8.2

---

## Deliverables checklist

- [ ] `components/game-mode-tabs.tsx` — client component, URL-driven
- [ ] `components/role-filter.tsx` — (if not already extracted from RosterTable)
- [ ] `app/career/page.tsx` — "Coming soon" placeholder
- [ ] `app/error.tsx` — root error boundary
- [ ] `app/not-found.tsx` — root 404 page
- [ ] `components/empty-states/private-profile.tsx`
- [ ] `components/empty-states/rate-limit-banner.tsx`
- [ ] Skeleton fallback components for `<Suspense>`
- [ ] Catch and surface `PrivateProfileError` in pages

---

## Step-by-step

### 1. `components/game-mode-tabs.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export function GameModeTabs({
  current,
  basePath,
}: {
  current: 'quickplay' | 'competitive'
  basePath?: string
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const target = basePath ?? pathname

  function hrefFor(mode: 'quickplay' | 'competitive') {
    const p = new URLSearchParams(params.toString())
    p.set('mode', mode)
    return `${target}?${p}`
  }

  return (
    <div className="inline-flex rounded-full bg-black/30 backdrop-blur p-1 text-[11px] uppercase tracking-[0.15em]">
      {(['quickplay', 'competitive'] as const).map((m) => (
        <Link
          key={m}
          href={hrefFor(m)}
          className={`px-3 py-1 rounded-full transition ${
            current === m
              ? 'bg-white text-text-primary'
              : 'text-white/80 hover:text-white'
          }`}
        >
          {m === 'quickplay' ? 'Quickplay' : 'Competitive'}
        </Link>
      ))}
    </div>
  )
}
```

Wire this into the hero banner top-right (Phase 5) and add it to the Home page header area as well (just below the namecard). Two placements, same component.

### 2. `app/career/page.tsx`

```tsx
import { SectionHeader } from '@/components/section-header'

export default function CareerPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 text-center">
      <SectionHeader>CAREER</SectionHeader>
      <h1 className="font-serif text-[40px] mt-6">Coming soon.</h1>
      <p className="text-text-secondary mt-2 max-w-md mx-auto">
        Milestones, season trajectories, and recent activity will live here. For now,
        head back to <a href="/" className="underline">your roster</a>.
      </p>
    </main>
  )
}
```

### 3. `app/error.tsx`

Next 16 routes catch async errors here. Reset is the standard Next pattern.

```tsx
'use client'

import { useEffect } from 'react'
import { OverfastError, PrivateProfileError } from '@/lib/overfast'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  if (error instanceof PrivateProfileError || error.message.includes('Private profile')) {
    return <PrivateProfile />
  }

  if (error.message.includes('429')) {
    return <RateLimited reset={reset} />
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="font-serif text-[32px]">Something went wrong.</h1>
      <p className="text-text-secondary mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 px-4 py-2 bg-text-primary text-surface-canvas rounded"
      >
        Try again
      </button>
    </main>
  )
}

function PrivateProfile() {
  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="font-serif text-[32px]">This career profile is private.</h1>
      <p className="text-text-secondary mt-4">
        Personal stats need a public Overwatch career profile. You can change this
        from the in-game social options menu.
      </p>
    </main>
  )
}

function RateLimited({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="font-serif text-[28px]">Data may be a few minutes stale.</h1>
      <p className="text-text-secondary mt-2">
        The OverFast API is busy right now. We'll retry shortly.
      </p>
      <button
        onClick={reset}
        className="mt-6 px-4 py-2 border border-border-strong rounded"
      >
        Retry now
      </button>
    </main>
  )
}
```

### 4. `app/not-found.tsx`

```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="font-serif text-[40px]">Not found.</h1>
      <p className="text-text-secondary mt-2">
        That page doesn't exist. Try the <Link href="/" className="underline">roster</Link>.
      </p>
    </main>
  )
}
```

### 5. Skeleton fallbacks

`components/skeletons/index.tsx`:

```tsx
function Pulse({ className = '' }: { className?: string }) {
  return <div className={`bg-border-default animate-pulse rounded ${className}`} />
}

export function RoleStripeSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <Pulse key={i} className="h-24" />
      ))}
    </div>
  )
}

export function MostPlayedSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Pulse key={i} className="aspect-[3/4]" />
      ))}
    </div>
  )
}

export function RosterTableSkeleton() {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl divide-y divide-border-default">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Pulse key={i} className="h-14 rounded-none" />
      ))}
    </div>
  )
}

export function HeroBannerSkeleton() {
  return <Pulse className="h-[280px] rounded-none" />
}
```

Use in pages:

```tsx
<Suspense fallback={<RosterTableSkeleton />}>
  <RosterTable stats={stats} heroRoles={heroRoles} />
</Suspense>
```

### 6. Bottom tab bar / nav

Spec §4 says: "Bottom tab bar (mobile) / left nav (desktop) cycles between Home / Career / Roster." For v1 we don't have a separate Roster page (the roster table is on Home), so this is two routes: Home + Career. Keep it minimal.

`components/nav.tsx`:

```tsx
import Link from 'next/link'

export function Nav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:static md:max-w-5xl md:mx-auto bg-surface-card border-t md:border-t-0 md:border-b border-border-default">
      <div className="flex justify-around md:justify-start md:gap-6 px-6 py-3 text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
        <Link href="/" className="hover:text-text-primary">Home</Link>
        <Link href="/career" className="hover:text-text-primary">Career</Link>
      </div>
    </nav>
  )
}
```

Mount in `app/layout.tsx` after `<body>` open, so it sits above all pages. Add `pb-20 md:pb-0` to page wrappers so the mobile fixed nav doesn't cover content.

### 7. Verify empty states

You can simulate each:

- **Private profile:** swap `PLAYER_ID` to a known private one (try random battletags from forums) and confirm the error boundary handles it.
- **Player not found:** swap to `Nonexistent-9999`. `getPlayerSummary` returns `null` → page should render a friendly message (add to `app/page.tsx`).
- **No competitive rank for a role:** the existing `RolePill` shows `—`. Check by inspecting `summary.competitive.pc.tank` is `null` for some player.
- **429:** can't easily simulate in dev; trust the error boundary works.

For "player not found" specifically, update `app/page.tsx`:

```tsx
if (!summary || !stats) {
  return (
    <main className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="font-serif text-[32px]">Player not found.</h1>
      <p className="text-text-secondary mt-2">
        Check the battletag — names are case-sensitive and should be in <code>Name#1234</code> form.
      </p>
    </main>
  )
}
```

---

## Acceptance criteria

1. Tapping the gamemode tab switches `?mode=` and the page re-renders with the new gamemode's data.
2. The role filter on the roster table filters rows client-side (no refetch).
3. `/career` renders the "Coming soon" page.
4. `/hero/this-key-does-not-exist` renders the not-found page (assuming it's not in the asset map).
5. Throwing a `PrivateProfileError` from a server component (force it manually if needed) renders the private-profile branch of `app/error.tsx`.
6. Skeleton fallbacks render when wrapped in `<Suspense>` and the inner fetch is slow.
7. The mobile nav appears at the bottom; desktop nav sits at the top of the content column. No layout overlap.

---

## Files created/modified

```
components/game-mode-tabs.tsx
components/nav.tsx
components/skeletons/index.tsx
app/career/page.tsx
app/error.tsx
app/not-found.tsx
app/layout.tsx           (add <Nav />)
app/page.tsx             (catch null summary, wrap sections in Suspense)
app/hero/[key]/page.tsx  (wire <GameModeTabs>)
```

---

## Notes / gotchas

- **Error boundaries are client components.** The `'use client'` at the top of `app/error.tsx` is required by Next.
- **`PrivateProfileError` detection is fragile** — `instanceof` may not survive serialisation across the server/client boundary. Falling back to `error.message.includes(...)` is the pragmatic workaround.
- **Don't auto-refresh on 429.** Spec §8.1 explicitly says: serve stale cache, show a banner, let the next navigation re-attempt. No JS polling.
- **GameModeTabs placement on Home:** spec §6.1 shows it integrated into the identity header right side. On hero detail it's top-right of the banner. Two placements, one component.
- **No mobile gestures yet** (swipe between heroes, etc.). Out of scope for v1.
