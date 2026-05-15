# Phase 1 — Foundation

**Goal:** a Next.js 16 app that boots, with Tailwind 4 design tokens wired through to utility classes, and Cache Components enabled.

**Estimate:** ½ day
**Prerequisites:** none
**Spec refs:** §7.1, §7.2, §7.6

---

## Deliverables checklist

- [ ] Next 16 scaffold (App Router, TypeScript, no src/ dir)
- [ ] Tailwind 4 + `@tailwindcss/postcss` installed
- [ ] `postcss.config.mjs` configured
- [ ] `app/globals.css` with `@import "tailwindcss"` and the full `@theme` block
- [ ] `next.config.ts` with `cacheComponents: true` + image `remotePatterns`
- [ ] Inter + Source Serif Pro loaded via `next/font/google`
- [ ] Smoke-test route confirming tokens compile to utilities
- [ ] `.gitignore` standard + `node_modules/`, `.next/`, `.env.local`

---

## Step-by-step

### 1. Scaffold

```bash
cd c:/Projects/turbo-overwatch
npx create-next-app@latest . --typescript --app --tailwind=false --eslint --no-src-dir --import-alias "@/*"
```

Note: we say `--tailwind=false` because create-next-app installs Tailwind 3. We add Tailwind 4 ourselves below.

If `.` is rejected because the directory contains `docs/`, scaffold into a temp dir and move contents.

### 2. Install Tailwind 4

```bash
npm install tailwindcss @tailwindcss/postcss
```

### 3. `postcss.config.mjs`

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

Delete any `tailwind.config.js` / `tailwind.config.ts` create-next-app may have left behind. Tailwind 4 is CSS-first.

### 4. `next.config.ts`

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

### 5. `app/globals.css`

Replace the file create-next-app generated with:

```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-surface-canvas: #f4f3ee;
  --color-surface-card: #ffffff;
  --color-surface-card-active: #fafaf7;

  /* Text */
  --color-text-primary: #1a1a1f;
  --color-text-secondary: #52525b;
  --color-text-tertiary: #71717a;

  /* Borders */
  --color-border-default: rgba(0, 0, 0, 0.06);
  --color-border-strong: rgba(0, 0, 0, 0.15);

  /* Semantic */
  --color-semantic-good: #3b6d11;
  --color-semantic-mid: #a16207;
  --color-semantic-warn: #991b1b;

  /* Roles */
  --color-role-tank: #f97316;
  --color-role-damage: #dc2626;
  --color-role-support: #65a30d;

  /* Fonts */
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-serif: var(--font-source-serif), Georgia, serif;
}

html, body {
  background: var(--color-surface-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
```

### 6. Fonts in `app/layout.tsx`

```tsx
import { Inter, Source_Serif_4 } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500'],
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

Two weights only — 400/500. Per spec §5.2, never 600/700.

### 7. Smoke test — `app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="font-serif text-[32px]">Token smoke test</h1>
      <p className="text-text-secondary">If you can read this in serif on a warm off-white background, tokens are wired.</p>
      <div className="flex gap-2">
        <span className="bg-role-tank text-white px-3 py-1 rounded">Tank</span>
        <span className="bg-role-damage text-white px-3 py-1 rounded">Damage</span>
        <span className="bg-role-support text-white px-3 py-1 rounded">Support</span>
      </div>
      <div className="text-semantic-good">↑ Top 18%</div>
      <div className="text-semantic-warn">↓ Bottom 12%</div>
    </main>
  )
}
```

### 8. Verify

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- Warm off-white background
- Serif headline
- Three coloured role pills
- Green and red percentile callouts

---

## Acceptance criteria

1. `npm run dev` boots with no warnings (other than experimental flag notices).
2. The smoke-test page renders all listed tokens correctly.
3. `next.config.ts` has `cacheComponents: true` and the four image hostnames.
4. A test `<Image>` from `blz-contentstack-images.akamaized.net/.../2600_Genji.jpg` loads without `next.config` errors (try this with one of the URLs from `docs/hero_assets.json`).

---

## Files created

```
app/layout.tsx
app/page.tsx
app/globals.css
next.config.ts
postcss.config.mjs
package.json
tsconfig.json
.gitignore
```

---

## Notes / gotchas

- Next 16 requires Node 20.9+. Check `node --version` before scaffold.
- `cacheComponents: true` is required to use `'use cache'` and `cacheTag()` in Phase 2.
- If Inter loading fails offline, fall back to `system-ui` — the design works either way.
- Don't commit `.next/` or `node_modules/`.
