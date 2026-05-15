# Turbo Overwatch

A hero-first Overwatch 2 stats dashboard. Built with Next.js 16 (App Router, Cache Components), Tailwind 4, and the [OverFast API](https://overfast-api.tekrop.fr/).

## Features

- **Hero spotlight** — full-bleed banner of your most-played hero with player identity, role pill, and key stats
- **Role ranks** — per-role rank tier icons, win rate, and KDA, with graceful unranked state
- **Most played** — top three heroes as portrait cards
- **Career overview + detail** — headline stats plus a full breakdown of totals and per-10min metrics
- **Per-hero pages** — official portrait, hitpoints, abilities with descriptions, combat signature vs. your career average, hero-specific stats (e.g. self healing, damage amplified), roster context chart, and personal bests
- **Editorial dark design** — Roboto, uppercase headers, full-bleed imagery, bold typography

## Stack

- Next.js 16 with `cacheComponents: true` and `'use cache'` for endpoint wrappers
- React 19.2 Server Components + Suspense streaming
- Tailwind 4 (CSS-first `@theme`)
- TypeScript strict
- OverFast API (no auth, public endpoints)

## Getting started

```bash
npm install
npm run dev
```

The dashboard is hard-coded to a single battletag in [`lib/constants.ts`](lib/constants.ts) — change `PLAYER_ID` to point at your own profile (format: `Name-1234`).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — Next.js lint

## Project structure

```
app/            Next.js routes (home, /hero/[key], error/not-found)
components/    UI components
lib/           API wrappers, formatters, stats helpers, hero theme
types/         OverFast response types
docs/         Spec + phased build notes
```

## Credits

- [OverFast API](https://overfast-api.tekrop.fr/) by TeKrop — wraps the Blizzard career profile pages
- Hero portraits and ability icons © Blizzard Entertainment
