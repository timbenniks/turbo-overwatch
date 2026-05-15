# Overwatch 2 Dashboard — Build Spec

**Status:** Ready to build
**Scope:** v1 — single hard-coded player, Home + Hero Detail screens, foundation for Career feed
**Stack:** Next.js 16 (App Router, React 19.2), TypeScript, Tailwind CSS 4
**Data:** [OverFast API](https://overfast-api.tekrop.fr) (free, rate-limited)
**Node:** 20.9+ (required by Next 16)

---

## 1. Product thesis

Every existing Overwatch stats site treats the game like fantasy football: tables of numbers, percentile rankings, dense data grids. Tracker.gg is the canonical example — well-organised, information-rich, visually flat. The numbers are all there, but nothing earns hierarchy. A 31-elim personal best looks the same as a recon-assists count of zero.

The opposite failure mode is the gorgeous mobile concepts on Behance and Dribbble: beautiful character art, four data points per screen, no real reason to open the app twice.

This dashboard threads the needle. **Heroes are the navigation, not a filter.** The roster of characters you actually play is the primary surface. Stats are revealed through them, themed by them, organised around them. We borrow the data discipline from Tracker.gg (percentile callouts, /10min normalisation, role breakdowns) and the visual register from the Behance work (large hero art, light surfaces, editorial typography).

The single most important design move: **the home screen sorts by time played, and the hero detail screen is themed to that hero.** Everything else flows from these two decisions.

### Success criteria

A user should be able to:

- Open the app and in one glance know who they main, how those mains are performing, and where they stand across the three roles.
- Tap any hero and get a screen that *feels like* that hero — colour, art, register — alongside meaningful stats about their play with that hero.
- Come back tomorrow and have a reason to — at least one element on the home screen should reflect recent activity (most played this week).

### Non-goals (v1)

- Player search and multi-player support. Hard-coded battletag for the prototype.
- Match history / per-game detail. The API doesn't expose this richly.
- Social features (friends, comparisons across accounts).
- Notifications, mobile push, native apps.
- The Career timeline / milestones feed — designed for, scaffolded as a placeholder route, but not built in v1.

### Why this stack

Next.js 16 server-side caching (Cache Components, `'use cache'` with `cacheLife` profiles) is the single biggest reason we picked it over Vite + React. The OverFast API has a 30 req/sec rate limit shared globally. With server-side caching, ten visitors loading the dashboard within the same 5-minute window cost us one upstream call total. With client-side fetching, each visitor would hit the API independently — fine for personal use, fragile if shared. Next 16's image optimisation also pays off here because the design rests on large Blizzard hero portraits (1600px JPEGs) that benefit dramatically from AVIF resizing.

Tailwind 4 was picked for the CSS-first `@theme` model. Our design tokens (surface colours, role colours, semantic colours) are pure CSS variables now, which means they're available to inline styles too — critical for the per-hero theming system where we set CSS variables per element from JavaScript data.

---

## 2. Reference material

- **API docs:** https://overfast-api.tekrop.fr (Redoc, requires JS)
- **OpenAPI spec:** check the spec file alongside this doc for the full schema
- **Blizzard hero pages:** https://overwatch.blizzard.com/en-gb/heroes — source of truth for hero art, colour palette per character, biographical copy
- **Visual reference (what we're *not* doing):** Tracker.gg-style data-dense dashboards
- **Visual reference (what we *are* doing):** the Behance Overwatch mobile concept (large character art, light surface, editorial type) and the Anthony Bellavia character-app studies (per-hero theming)

---

## 3. Data layer

### 3.1 API overview

Base URL: `https://overfast-api.tekrop.fr`

**Rate limit:** 30 requests/second shared across all consumers. This is a *shared* limit, not per-user — important. We must cache aggressively and batch where possible. See section 8.1.

**Caching:** the API itself returns `Cache-Control` and `X-Cache-TTL` headers. Respect these. Most endpoints are cached for 10 minutes to 1 hour upstream.

### 3.2 Endpoints we use

| Endpoint | Purpose | Cache profile |
|----------|---------|---------------|
| `GET /heroes` | List of all heroes (key, name, portrait, role) | `cacheLife('days')` |
| `GET /heroes/{key}` | Single hero with description, abilities, backgrounds, biography | `cacheLife('days')` |
| `GET /heroes/stats` | Global pickrate/winrate per hero — used for percentile callouts | `cacheLife('hours')` |
| `GET /players/{id}/summary` | Identity card: username, avatar, namecard, title, endorsement, competitive ranks | `cacheLife('minutes')` |
| `GET /players/{id}/stats/summary` | **Primary stats endpoint.** Pre-aggregated KDA, winrate, time_played for general / per-role / per-hero. One call, full dashboard data. | `cacheLife('minutes')` |

Cache profiles are Next 16's built-in `cacheLife` presets — `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`. See section 7.3 for the implementation pattern. The `minutes` profile gives stale-while-revalidate around the 5-minute mark, which is appropriate for player data that changes between matches but doesn't need to be live-fresh.

We do not need `/players/{id}/stats` (the deep career endpoint) for v1. The summary endpoint covers every headline number on every screen. Save it for the Career feed in v2 where we need `best` records and `match_awards`.

### 3.3 Player ID format

The battletag `TimBenniks#2042` becomes `TimBenniks-2042` in URLs (hash replaced with hyphen). For v1, hard-code `TeKrop-2217` — the API author's account, guaranteed to have stable data and friendly behaviour from the rate limiter.

### 3.4 Response shapes (the ones that matter)

**`/players/{id}/summary`** returns:

```ts
{
  username: string
  avatar: string          // headshot URL
  namecard: string | null // wide banner art URL — used in profile header
  title: string | null    // e.g. "Demigod"
  endorsement: { level: number; frame: string } | null
  competitive: {
    pc: { season: number; tank: Rank | null; damage: Rank | null; support: Rank | null; open: Rank | null } | null
    console: { /* same shape */ } | null
  }
}
```

A `Rank` is `{ division: string; tier: number; role_icon: string; rank_icon: string; tier_icon: string }`. Any role can be null if the player hasn't placed.

**`/players/{id}/stats/summary?gamemode=quickplay`** returns three layers:

```ts
{
  general: StatsSummary    // sum across all heroes
  roles: { tank: StatsSummary; damage: StatsSummary; support: StatsSummary }
  heroes: { [heroKey: string]: StatsSummary }
}

type StatsSummary = {
  games_played: number
  games_won: number
  games_lost: number
  time_played: number      // seconds
  winrate: number          // percent, 0–100
  kda: number
  total: { eliminations; assists; deaths; damage; healing }    // integers
  average: { eliminations; assists; deaths; damage; healing }  // floats, per-10-min
}
```

This single endpoint is the entire data source for Home and Hero Detail. Filter by `gamemode` (quickplay, competitive) and optionally `platform` (pc, console).

**`/heroes/{key}`** returns the rich hero object including the `backgrounds` array:

```ts
{
  backgrounds: Array<{
    sizes: string[]   // ["min","xs","sm"] | ["md","lg"] | ["xl+"]
    url: string       // 960_Hero.jpg | 1600_Hero.jpg | 2600_Hero.jpg
  }>
  // plus name, description, role, subrole, location, age, birthday, abilities, story...
}
```

The `backgrounds` are the gorgeous full-body character art from Blizzard's hero pages. **Use these as the hero portraits on cards (960px) and the full-bleed detail header (1600px / 2600px).** They're hosted on `blz-contentstack-images.akamaized.net` — public, CORS-friendly, used by Blizzard's own site.

### 3.5 What can be missing

Build for these from day one, do not bolt on later:

- A player can have no competitive rank for a role this season → `competitive.pc.tank` is `null`.
- A player can be console-only → `competitive.pc` is `null`.
- A hero a player has never touched is simply absent from `stats.heroes` — not present with zeroes.
- A player can have no namecard set → fall back to a neutral gradient.
- A new hero release can have `portrait: null` for a few days — fall back to the role icon.
- A "private" profile returns 403 or a sparse summary. Show a friendly empty state.

---

## 4. Information architecture

```
/                  Home — namecard, role ranks, top heroes this week, career overview, full roster table
/hero/[key]        Hero detail — themed to the hero, full-bleed banner, headline stats, combat signature, personal records, ranking within the user's own roster
/career            Career — placeholder route in v1, scaffolded for v2 milestones feed
```

Bottom tab bar (mobile) / left nav (desktop) cycles between Home / Career / Roster. Roster is the "all heroes, including ones you've never played" browse view — secondary, low priority for v1, can be a simple list.

---

## 5. Visual language

### 5.1 Palette

The dashboard uses a **light surface** as its canvas. This is the most important and most non-obvious choice in the design. Every existing Overwatch stats site is dark; going light is what makes hero art *pop* rather than fight the UI. A cool jade-green from Genji's bodysuit sings against off-white, gets muddy against near-black.

**Base palette:**

| Token | Value | Use |
|-------|-------|-----|
| `surface-canvas` | `#f4f3ee` | Page background, slightly warm off-white |
| `surface-card` | `#ffffff` | Card backgrounds |
| `surface-card-active` | `#fafaf7` | Highlighted row (e.g. featured hero in roster) |
| `text-primary` | `#1a1a1f` | Headings, headline numbers |
| `text-secondary` | `#52525b` | Body copy |
| `text-tertiary` | `#71717a` | Labels, captions |
| `border-default` | `rgba(0,0,0,0.06)` | Card borders |
| `border-strong` | `rgba(0,0,0,0.15)` | Button borders |

**Semantic colours** (for percentile callouts, win/loss indicators):

| Token | Value | Meaning |
|-------|-------|---------|
| `semantic-good` | `#3b6d11` | Top tier, win rate above population median |
| `semantic-mid` | `#a16207` | Middle of pack, neutral |
| `semantic-warn` | `#991b1b` | Bottom tier, well below population |

**Role colours** (used for the per-role border accents and rank pills):

| Role | Colour |
|------|--------|
| Tank | `#f97316` (orange) |
| Damage | `#dc2626` (red) |
| Support | `#65a30d` (green) |

**Per-hero theming.** Every hero gets a primary colour used on their detail screen's banner gradient and on the left-border accent of their roster row. These come from `lib/hero-theme.ts` — a hand-tuned map of hero key → primary colour. See section 7.4 for the full implementation. **This is the single most important file in the project for visual quality.**

### 5.2 Typography

Two families, used deliberately:

- **Sans-serif** (system stack or Inter): all chrome, labels, body copy, buttons.
- **Serif** (system stack or Source Serif Pro): every headline number. This is the *editorial move*. Numbers that matter — time played, win rate, KDA, game records — render in serif. It pulls the dashboard out of the "data-heavy" register Tracker.gg sits in. Numbers feel important rather than just counted.

Hero names are also serif. Player username is serif. Everything else is sans.

**Two weights only:** 400 and 500. Never 600 or 700 — they read heavy and break the editorial register.

**Sizes:** 9–11px for labels (with letter-spacing), 12–14px for body, 18–22px for headline stats, 26–32px for primary numbers on detail screens, 56px for the hero name on the detail banner.

### 5.3 Component grammar

- **Cards** are white with a 0.5px border and `border-radius: 12px`. No shadows except a very subtle one (`0 2px 8px rgba(0,0,0,0.04)`) on cards that overlap a banner — used to lift them off the gradient.
- **Headline numbers** are serif, the unit (h, m, %, k) is smaller and in `text-tertiary`. Format: `47h 12m`, `58%`, `8.9k`.
- **Section headers** are an 11px uppercase label with 0.15em letter-spacing, prefixed by a 3px-wide vertical bar in `text-primary`. Sentence case becomes ALL CAPS only in these labels.
- **Percentile callouts** are 10px with an arrow icon: `↑ Top 18%` (good, green), `↓ Bottom 12%` (warn, red), neutral arrow + amber for middle.
- **Tabs** (Competitive / Quickplay): pill-shaped, active is solid dark, inactive is transparent with a subtle border.
- **Role pills** (D3, P1, G2) use the role colour at a 3px left border, white card body, division text in role colour at 500 weight.

### 5.4 Layout pattern: banner + offset cards

A recurring move across both screens. A coloured banner (namecard on Home, hero background on Detail) provides the visual hook. White stat cards sit *overlapping the bottom edge of the banner by ~32px*, with the subtle drop shadow. This is the social-profile-page pattern — clean, the eye lands where it should, the heavy art has room to breathe.

---

## 6. Screen specs

### 6.1 Home (`/`)

A vertically stacked composition. Reading top to bottom:

**Identity header** (overlaps the namecard banner)
- Namecard image (full width, ~96px tall, taken from `summary.namecard`). If null, fall back to a warm gradient using the player's primary role colour.
- Avatar (72px circle, white ring) + username (serif, 22px) + tag (`#2042`, 11px, tertiary) + title (`Demigod`, italic serif, 12px) + endorsement level.
- Two action buttons top-right: search (placeholder for v1 — opens nothing), settings.

**Role rank stripe** (3 cards in a row, below header)
- One card per role: Tank / Damage / Support.
- Each card: role label + division (`Tank · D3`), serif win rate (`46%`), small WL count (`14W·16L`), KDA below.
- Left border in role colour (3px).
- If a role has no rank this season, show `—` in division and a muted state.

**Most played this week** (3 large hero cards, side by side)
- Aspect ratio 3:4. Full-bleed `960_Hero.jpg` background image with a gradient overlay at the bottom for legibility.
- Top-left badge with role label (white background, semi-transparent).
- Bottom: serif hero name (20px, white), time played + win rate in a row.
- These are the top 3 by time played in the last 7 days. *For v1, since we don't have rolling time-window data from the API, use the all-time top 3 and label the section "Most played" without the "this week".* See section 8.5.
- Tappable. Routes to `/hero/{key}`.

**Career overview** (single white card, 4 stats with vertical dividers)
- Elims / 10min, Damage / 10min, KDA ratio, Win rate.
- Each shows the serif number + a percentile callout below in semantic colour.
- Percentiles come from comparing the user's stats against the `/heroes/stats` global aggregates. See section 8.4 for the percentile logic.
- Header row: `CAREER OVERVIEW` left, `PC · quick play · 19h · 144 matches` right (metadata).

**Your roster** (a table)
- Header row with column labels: Hero / Time / WR / KDA / E/10m.
- Rows: 44px hero portrait thumbnail with left-border accent in hero theme colour, hero name + role, then right-aligned serif stats.
- Sorted by time_played descending.
- Win rate cell: green if above median, red if well below.
- A small pill on the row meeting a threshold (e.g. `BEST WR`) — see section 8.6 for the observation logic.
- Filter buttons above: ALL / TANK / DMG / SUP.
- Show top 6 rows by default + a "Show 28 more heroes →" button.

### 6.2 Hero Detail (`/hero/[key]`)

The screen takes on the hero's identity.

**Breadcrumb** (top)
- `← Roster / Genji`. Tap "Roster" to navigate home.

**Hero banner** (large, full-bleed)
- 280px tall. Background is the hero's `1600_Hero.jpg` from `backgrounds`.
- A diagonal gradient overlay in the hero's theme colour (from `hero-theme.ts`) sits over the image at ~70% opacity, fading to transparent on the right where the character art is.
- Bottom-left: role + subrole label uppercase, serif hero name (56px), italic serif description (12px, ~380px max width).
- Top-right corner: Competitive / Quickplay tab toggle.

**Headline stat trio** (overlapping the banner by ~32px)
- Three white cards: Time played, Win rate, Games.
- Time: `47h 12m` serif + subtitle `3rd most played`.
- Win rate: serif percent (green if good) + percentile callout.
- Games: serif number + `182W · 130L` below.
- Subtle drop shadow lifts these off the banner gradient.

**Combat signature** (one white card, 4 stats with vertical dividers)
- Elims/10min, Damage/10min, Final blows/10min, Deaths/10min.
- Below each: a contextual annotation — `+22% vs your avg`, `Genji median 7.8k`, `Above hero avg`, `Strong duelist`.
- These annotations come from comparing to (a) the user's overall average, (b) the global hero average from `/heroes/stats`, or (c) a small set of canned "playstyle" descriptors based on stat patterns. See section 8.7.

**Best moments** (3 trophy cards)
- Three white cards in a row: most elims single game, best kill streak, best multikill.
- Each: outline icon, serif number, label.
- The personal-best card gets a coloured border + "PERSONAL BEST" caption in the top-right (the leftmost record by default — the highest-value one).
- *Note for v1: these come from `/players/{id}/stats` (the deep endpoint) which we said we don't need. Either fetch it lazily on the detail screen, or hide this section in v1.* See section 8.8 for the recommendation.

**Where Genji sits in your roster** (one card with a bar chart)
- A horizontal bar chart of your top 8 heroes by time played, this hero highlighted in its theme colour.
- A "YOU" label sits above the highlighted bar.
- Below the chart, an editorial sentence in italic serif: `3rd most played · 12% of your total time · highest win rate among your top 5`.
- The sentence is generated from the data — see section 8.6.

### 6.3 Career (`/career`) — placeholder for v1

Stub route. Render a "Coming soon" state. Reserved for the v2 milestones feed.

---

## 7. Implementation

### 7.1 Project structure

```
app/
  layout.tsx                  Root layout, font setup
  page.tsx                    Home (server component)
  hero/[key]/page.tsx         Hero detail (server component)
  career/page.tsx             Placeholder
  globals.css                 Tailwind import + @theme block (the v4 way)

components/
  identity-header.tsx         Namecard + avatar + role pills
  hero-card-large.tsx         The 3:4 hero card for "Most played"
  career-overview.tsx         The 4-stat row with percentiles
  roster-table.tsx            The full sortable roster
  hero-banner.tsx             Hero detail's full-bleed banner
  stat-card.tsx               Reusable headline stat card
  combat-signature.tsx        The 4-stat combat row
  best-moments.tsx            The 3 trophy cards
  roster-context-chart.tsx    "Where X sits in your roster"
  game-mode-tabs.tsx          Competitive / Quickplay toggle (client component)
  section-header.tsx          The 3px bar + uppercase label

lib/
  overfast.ts                 API client with 'use cache' wrappers, types
  hero-theme.ts               Hero key → colour map
  stats-helpers.ts            Percentile calc, formatters, observation logic
  format.ts                   formatTime, formatPercent, formatNumber

types/
  overfast.ts                 TypeScript types matching the API responses

next.config.ts                cacheComponents enabled, image remotePatterns
postcss.config.mjs            @tailwindcss/postcss plugin
```

### 7.2 API client (`lib/overfast.ts`)

Each endpoint wrapper is an `async` function with the `'use cache'` directive, `cacheLife` and `cacheTag` calls at the top of the body, and a typed return.

```ts
import { cacheLife, cacheTag } from 'next/cache'

const BASE_URL = 'https://overfast-api.tekrop.fr'

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
  opts: { gamemode?: 'quickplay' | 'competitive'; platform?: 'pc' | 'console' } = {}
): Promise<PlayerStatsSummary | null> {
  'use cache'
  cacheLife('minutes')
  cacheTag(`player-${playerId}`, 'player-stats')

  const id = normalisePlayerId(playerId)
  const params = new URLSearchParams()
  if (opts.gamemode) params.set('gamemode', opts.gamemode)
  if (opts.platform) params.set('platform', opts.platform)

  const res = await fetch(`${BASE_URL}/players/${id}/stats/summary?${params}`)
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
```

Note: rate-limit retry (429) cannot be done inside a `'use cache'` function — the cache layer doesn't expect retry logic. Handle 429 by returning the last cached response if available, otherwise letting the error bubble to an error boundary that shows a friendly "data may be stale" banner. See section 8.1.

Player ID normalisation: accept `TimBenniks#2042` *or* `TimBenniks-2042`, internally always use the hyphenated form (the API requires it).

**Enable Cache Components in `next.config.ts`:**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'd15f34w2p8l1cc.cloudfront.net' },
      { protocol: 'https', hostname: 'blz-contentstack-images.akamaized.net' },
      { protocol: 'https', hostname: 'images.blz-contentstack.com' },
      { protocol: 'https', hostname: 'static.playoverwatch.com' },
    ],
  },
}

export default nextConfig
```

The `cacheComponents: true` flag is required to use `cacheTag` and the `'use cache'` directive in their full form.

### 7.3 Data fetching pattern

Server components fetch directly. Because the API client functions are themselves cached with `'use cache'`, calling them from page components is cheap on the second-and-later request.

**Important:** in Next 16, `params` is a Promise and must be awaited.

```ts
// app/hero/[key]/page.tsx
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

  if (!hero) notFound()
  // render...
}
```

The Home page does **two parallel fetches**:

```ts
const [summary, stats] = await Promise.all([
  getPlayerSummary(PLAYER_ID),
  getPlayerStatsSummary(PLAYER_ID, { gamemode: 'quickplay' }),
])
```

**Suspense boundaries.** Cache Components encourage mixing static and dynamic content. The static shell (page chrome, section headers) prerenders instantly. Data-bound components should be wrapped in `<Suspense>` so they stream in as the cache resolves:

```tsx
<Suspense fallback={<RosterTableSkeleton />}>
  <RosterTable playerId={PLAYER_ID} />
</Suspense>
```

This is more meaningful in Next 16 than it was before — without it, the whole page waits on the slowest fetch.

**Don't fetch `/heroes/stats` on every page load.** Wrap it in its own cached function with `cacheLife('hours')` and import where needed. It's ~50KB.

### 7.4 Hero theme system (`lib/hero-theme.ts`)

This file is small but critical. One entry per hero:

```ts
export const heroTheme: Record<string, { primary: string; accent: string; gradient: [string, string, string, string] }> = {
  genji:      { primary: '#4d7c0f', accent: '#a3e635', gradient: ['#d4f0a8','#a8d676','#6ba832','#3d6e0f'] },
  reinhardt:  { primary: '#1e3a8a', accent: '#fbbf24', gradient: ['#dbeafe','#93c5fd','#3b82f6','#1e3a8a'] },
  dva:        { primary: '#0369a1', accent: '#f9a8d4', gradient: ['#dbeafe','#bae6fd','#7dd3fc','#0369a1'] },
  // ... one entry for every hero
}

export function getHeroTheme(key: string) {
  return heroTheme[key] ?? heroTheme.default
}
```

**Applying the theme.** Set CSS variables inline on the relevant element, then use them in Tailwind utilities via the arbitrary-value syntax:

```tsx
const theme = getHeroTheme(hero.key)

<div
  style={{ '--hero-primary': theme.primary, '--hero-accent': theme.accent } as CSSProperties}
  className="border-l-[3px] border-[var(--hero-primary)]"
>
  ...
</div>
```

The hero gradient on the detail banner uses the four-stop array directly in a `linear-gradient` inline style — too dynamic to be a utility class.

The `gradient` is the four-stop gradient used on the hero detail banner. The `primary` is the colour used for the left-border accent on roster rows and the "YOU" bar in the context chart. The `accent` is a secondary used sparingly — text on the banner, or the trophy border colour.

**Tune these by eye against the actual Blizzard hero art.** Don't auto-extract from the images — the results are unreliable and the brand colours are well-established already (Genji is jade green, Reinhardt is blue-and-gold, D.Va is sky blue with pink, etc.). Allocate half a day for a designer to set these values; do not skip this step.

A sensible `default` entry uses the role colour from section 5.1.

### 7.5 Image handling

Hostnames are configured in `next.config.ts` (see section 7.2). Use `next/image` everywhere.

For hero card backgrounds: `fill` with `object-cover` and `sizes="(max-width: 768px) 50vw, 33vw"`. For the hero detail banner: `priority` on the 1600px version (it's above the fold and the visual centrepiece).

In Next 16, `next/image` defaults changed — Next now uses local-by-default image optimisation and requires explicit width/height or `fill` mode for remote images. None of our usage breaks, but be aware if you copy old patterns from Next 14/15 tutorials.

### 7.6 Tailwind 4 setup

Tailwind 4 is CSS-first. There is no `tailwind.config.js`. Configuration lives inside the CSS file using the `@theme` directive.

**Install:**

```bash
npm install tailwindcss @tailwindcss/postcss
```

**`postcss.config.mjs`:**

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

**`app/globals.css`:**

```css
@import "tailwindcss";

@theme {
  /* Surface tokens */
  --color-surface-canvas: #f4f3ee;
  --color-surface-card: #ffffff;
  --color-surface-card-active: #fafaf7;

  /* Text tokens */
  --color-text-primary: #1a1a1f;
  --color-text-secondary: #52525b;
  --color-text-tertiary: #71717a;

  /* Border tokens */
  --color-border-default: rgba(0, 0, 0, 0.06);
  --color-border-strong: rgba(0, 0, 0, 0.15);

  /* Semantic tokens */
  --color-semantic-good: #3b6d11;
  --color-semantic-mid: #a16207;
  --color-semantic-warn: #991b1b;

  /* Role tokens */
  --color-role-tank: #f97316;
  --color-role-damage: #dc2626;
  --color-role-support: #65a30d;

  /* Fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Source Serif Pro', Georgia, serif;
}
```

Every token defined in `@theme` becomes both a CSS custom property *and* a Tailwind utility class. So `--color-surface-canvas` is available as `bg-surface-canvas`, `text-surface-canvas`, `border-surface-canvas` automatically.

**Browser support note:** Tailwind 4 targets Safari 16.4+, Chrome 111+, Firefox 128+. If a meaningful share of your players are on older browsers, plan for that — Tailwind 4 uses modern CSS features (cascade layers, `@property`, `color-mix()`) that don't polyfill cleanly. For an Overwatch audience (gamers, mostly on current browsers), this is a non-issue.

**Dark mode:** v4 defaults to media-query-based (`prefers-color-scheme`). We're shipping light-only in v1, so this doesn't matter, but note that if dark mode is added later it'll need a `@custom-variant dark (&:where(.dark, .dark *))` declaration to switch to class-based toggling.

**The hero theme map and Tailwind.** The per-hero colour map in `lib/hero-theme.ts` does *not* go into `@theme` — there are too many heroes for utility classes to make sense. Instead, apply them as inline styles or CSS variables on the elements that need them. See section 7.4 for the data structure.

### 7.7 Responsive behaviour

Single breakpoint at 768px. Below: mobile layout. Above: desktop layout.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Identity header | Stack avatar above pills | Side by side |
| Role rank stripe | 3 cards (already mobile-shaped) | Same, wider cards |
| Most played heroes | Horizontal scroll, 1.5 cards visible | 3 cards in a grid |
| Career overview | 2×2 grid | 4 columns |
| Roster table | Hide KDA + E/10m columns, surface as secondary text in the row | Full table |
| Hero banner | 240px tall, name 40px | 280px tall, name 56px |
| Combat signature | 2×2 grid | 4 columns |
| Best moments | 3 cards (already fits) | Same |
| Context chart | Same — already responsive | Same |

The desktop layout is not a separate design. It's the same layout with wider columns. We don't need a sidebar nav for v1.

### 7.8 Interactivity

Most of the dashboard is static (server components). Client components only where state matters:

- `<GameModeTabs>` — toggle between competitive/quickplay. Pushes a query param to the URL, the server re-renders. No client state.
- `<RoleFilter>` on the roster table — filters the rows. Pure client filter on already-fetched data, no refetch.

That's it for v1. Don't introduce a state library.

---

## 8. The non-obvious bits

### 8.1 Rate limit handling

30 requests/second shared across *all* consumers of the public API. Mitigations, in order of importance:

1. **Cache Components do the heavy lifting.** Every API function is wrapped in `'use cache'` with appropriate `cacheLife`. A revisit within the cache window serves entirely from Next's in-memory cache with zero upstream calls. The `minutes` profile (~5 min stale-while-revalidate) means even refresh-spam from a single user only costs us one upstream call every five minutes.
2. **Single-flight per page.** A page load makes 2–3 parallel requests, never sequential. Don't fetch in a loop. The roster table renders from `stats.heroes` which is already a single response.
3. **No background polling.** No auto-refresh. The user revisits when they want fresher data.
4. **On 429: serve stale cache, show banner.** Don't retry inside the cache function (it confuses the cache layer). Catch in the page, fall back to whatever's cached, surface a subtle banner: *"Data may be a few minutes stale — the OverFast API is busy."* The cache is automatically refilled on the next successful call.
5. **Self-host for production.** The free instance is for prototyping. The API is open-source; if this ships, run our own.

On-demand invalidation via `revalidateTag` is available (we tag each fetch with `player-{id}` and a category like `player-stats`), but for v1 we don't need it — no user action mutates the underlying data. If we ever add a "refresh now" button, that's where `revalidateTag('player-{id}', 'max')` goes.

### 8.2 Empty states

These are not edge cases. Design them as deliberately as the happy path.

| State | Treatment |
|-------|-----------|
| Player has no competitive rank for a role | Show `—` for division, muted card, semantic-mid colour. Don't hide the card; absence is information. |
| Player profile is private | Full-screen state: hero icon, "This profile is private" headline, helper text about how the user can change it in-game, link to Blizzard's instructions. |
| Player not found | Same pattern, different copy. Suggest checking the battletag format (`Name#1234`). |
| A hero has zero data (never played) | On the roster row, render greyscale portrait, "Not yet played" in tertiary text, no stats columns. On the detail screen (if reached via direct URL), render the hero biography + a "you haven't played them" prompt. **Don't 404.** |
| API rate-limited (429) | Show last cached data, a subtle "data may be a few minutes stale" banner. Don't show an error. |
| API down (5xx) | Cached data + a red banner. Retry on next navigation. |
| Player has no namecard | Fall back to a gradient using their primary role colour. |
| New hero, no portrait yet | Use the role icon at large scale on a coloured background. |

### 8.3 Time formatting

The API returns `time_played` in seconds. Format rules:

- `< 60` → `Xs` (rare, only for very low-play heroes)
- `< 3600` → `Xm` (e.g. `42m`)
- `< 36000` (10 hours) → `Xh Ym` (e.g. `4h 51m`)
- `>= 36000` → `Xh` (e.g. `47h`) — drop the minutes once we cross 10 hours, they don't matter visually

On large headline displays, use the unit at smaller size in tertiary colour: `47h 12m` becomes `47<small>h</small> 12<small>m</small>` to give the numbers room.

### 8.4 Percentile logic

The dashboard shows callouts like `Top 18%` and `Bottom 12%`. These are not in the API — we compute them.

For each stat shown with a percentile (`elims/10min`, `damage/10min`, `KDA`, `win rate`):

1. We need a reference distribution. For v1, hard-code a rough distribution from public data sources (Tracker.gg publishes population stats periodically) or use a simple piecewise function.
2. Given the user's value, compute the percentile.
3. Map to a callout:
   - Top 20% → `↑ Top X%` in semantic-good
   - Middle 60% → `Avg X%` in tertiary
   - Bottom 20% → `↓ Bottom X%` in semantic-warn

This is intentionally rough. The point is to give numbers context, not to be statistically rigorous. **A user reading `Top 18%` doesn't need it to be accurate to two decimals — they need it to feel right.** Tune by playing yourself and seeing if the callouts match your gut sense of how good a stat is.

For per-hero percentile callouts (e.g. comparing your Genji damage to "Genji median 7.8k"), use the global `/heroes/stats` data — it gives population pickrate and winrate per hero, and we can publish reasonable median estimates for the per-10 stats.

### 8.5 "Most played this week" — handling the data gap

The API doesn't expose a time-windowed view. `time_played` is always all-time. Options:

1. **Just show all-time top 3, relabel the section "Most played".** Simplest, ships v1.
2. **Snapshot the API daily ourselves, compute week-over-week deltas.** Requires backend state. Out of scope for v1.

**Go with option 1 for v1.** Be honest in the label. The section is still valuable.

### 8.6 The observation system (the little pills and sentences)

Several places surface generated observations:

- `★ BEST WR` pill on the roster row.
- The italic editorial sentence under the context chart: *3rd most played · 12% of your total time · highest win rate among your top 5*.
- The contextual annotations under combat signature stats: *Strong duelist*, *Above hero avg*.

These are computed in `lib/stats-helpers.ts` from the already-fetched data. A simple rule library:

```ts
function observeRoster(stats: PlayerStatsSummary) {
  const observations = []
  const heroes = Object.entries(stats.heroes).sort(([,a], [,b]) => b.time_played - a.time_played)
  const top5 = heroes.slice(0, 5)
  const bestWr = top5.reduce((a, b) => a[1].winrate > b[1].winrate ? a : b)
  observations.push({ key: bestWr[0], pill: 'BEST WR' })
  // ... more rules
  return observations
}
```

Keep this rule-based and inspectable. Don't introduce an LLM or any sort of generation here — these are simple comparisons on a small dataset.

### 8.7 Combat-signature annotations

Same observation pattern, scoped to the hero detail page. Compare each stat against:

1. The user's own all-time average (`stats.general.average`).
2. A canned hero-typical value (from `/heroes/stats` if available, otherwise hard-coded medians per hero).

Then pick the more interesting comparison. Phrases are templated:

- `+X% vs your avg` (when the stat is above the user's general average by >10%)
- `Genji median Xk` (when showing the hero's population reference)
- `Strong duelist` / `High mobility` / `Above hero avg` — a small set of canned phrases keyed off stat patterns (e.g. high final blows + high deaths → "aggressive playstyle")

Keep the templated phrases to a list of ~20. Each phrase has a condition function. The first one that matches wins.

### 8.8 Personal records — fetch lazily or defer?

The "Best moments" trophies (most elims single game, best kill streak, best multikill) come from `/players/{id}/stats` — the deeper endpoint we said we don't need for v1.

**Recommendation:** fetch it on the hero detail page only, lazily. Don't block the page on it. Render the rest of the screen, show skeleton trophy cards, then populate when the second fetch resolves. If the fetch fails or returns no data for the hero, hide the section gracefully.

This keeps Home fast (one API call to summary) and adds depth to Detail without delaying first paint.

---

## 9. Testing notes

- **Test with `TeKrop-2217`.** The API author's account. Stable data, rate-limit-friendly.
- **Test private profile flow** with any battletag where the profile is set to private — try a few candidates.
- **Test the "no competitive rank" state** by switching the gamemode tab to competitive on a player who's only played quickplay. Most public profiles will show partial rank data.
- **Test a newly-released hero** (low playtime, possibly missing background art) once one is out — the empty state for hero detail with sparse data.
- **Snapshot the API responses to fixtures.** Don't run live API calls in tests. Mock the client.

---

## 10. Out of scope for v1, but designed-for

These should not be built, but the structure should accommodate them without rewrites:

- **Player search.** A search modal that hits `/players?name=...`. Wire the search button on Home to a future modal — leave it as a no-op for now.
- **The Career feed.** Milestones, season trajectories, the editorial timeline view. Scaffold the route, leave the content blank.
- **Per-map performance.** `/maps` data + per-hero map preferences (derived from match awards once we tap the deep endpoint). Real differentiator but additive.
- **Multi-player comparison.** Stash two player IDs, render side by side. Useful, additive.
- **Dark mode.** The light surface is the primary identity. If we add dark mode later, it should be a deliberate alt theme — not a token swap. Some elements (the namecard banner, the hero card gradients) carry colour information that doesn't trivially invert.

---

## 11. Open questions for the team

A short list of decisions the spec doesn't lock down:

1. Self-host the OverFast API at launch, or stay on the public instance until traffic warrants? Recommendation: public for v1, self-host if we hit rate limits in production.
2. Which player do we hard-code for the v1 prototype if not `TeKrop-2217`? (Tim's own battletag would be more motivating but may have sparser data depending on play volume.)
3. Do we want to publish this as a public site or keep it personal? Affects analytics, error reporting, hosting.
4. The hero theme map — who owns the colour calls? Recommend a designer spends half a day across all ~40 heroes with the Blizzard hero pages open.

---

## Appendix A: Component implementation order

For the engineer scoping their work, a reasonable order to build in:

1. Project scaffold (`npx create-next-app@latest` for Next 16), Tailwind 4 install + `@tailwindcss/postcss` plugin, font loading, `@theme` block with the palette tokens (section 7.6). Enable `cacheComponents: true` in `next.config.ts`.
2. `lib/overfast.ts` with `getPlayerSummary` and `getPlayerStatsSummary` — verify against the live API.
3. `lib/hero-theme.ts` with default + 6 heroes (Reinhardt, D.Va, Genji, Ana, Tracer, Baptiste). Fill in the rest as you go.
4. `<SectionHeader>`, `<StatCard>`, formatters — the small primitives.
5. Home page: identity header → role rank stripe → most-played hero cards → career overview → roster table. Each section is a separate component.
6. Hero detail page: banner → headline stat trio → combat signature → context chart. Defer best moments.
7. Game mode tabs (the only client interactivity needed for v1).
8. Empty states, error boundaries, the 429 banner.
9. Best moments section (fetches the deep endpoint).
10. Responsive pass — verify every screen at 375px and 1440px.

Estimate: a competent frontend engineer should ship steps 1–7 in five working days, 8–10 in two more. Add a day for the designer-engineer pairing on the theme map.

---

*Spec written 2026-05-15. Update this doc rather than passing changes verbally.*
