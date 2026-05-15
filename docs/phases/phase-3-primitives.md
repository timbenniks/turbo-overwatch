# Phase 3 — Primitives

**Goal:** the small shared utilities and components every screen depends on. Formatters, observation helpers, and the visual building blocks (`<SectionHeader>`, `<StatCard>`, `<PercentileCallout>`).

**Estimate:** ½ day
**Prerequisites:** Phases 1–2 complete
**Spec refs:** §5.3, §8.3, §8.4, §8.6, §8.7

---

## Deliverables checklist

- [ ] `lib/format.ts` — `formatTime`, `formatPercent`, `formatNumber`, `formatKda`
- [ ] `lib/stats-helpers.ts` — percentile bands + roster/combat observation rules
- [ ] `components/section-header.tsx`
- [ ] `components/stat-card.tsx`
- [ ] `components/percentile-callout.tsx`
- [ ] `components/role-pill.tsx`
- [ ] `app/dev/primitives/page.tsx` — visual demo of all primitives

---

## Step-by-step

### 1. `lib/format.ts`

```ts
export function formatTime(seconds: number): { value: string; unit: string } {
  if (seconds < 60) return { value: String(seconds), unit: 's' }
  if (seconds < 3600) return { value: String(Math.floor(seconds / 60)), unit: 'm' }
  if (seconds < 36000) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return { value: `${h}h ${m}`, unit: 'm' }
  }
  return { value: String(Math.floor(seconds / 3600)), unit: 'h' }
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(Math.round(value))
}

export function formatKda(value: number): string {
  return value.toFixed(2)
}
```

Headline display pattern (spec §5.3): big serif number + smaller tertiary unit. Component handles rendering; format helpers just return the split.

### 2. `lib/stats-helpers.ts`

Rough percentile bands — see spec §8.4. Intentionally not statistically rigorous; tuned by feel.

```ts
import type { PlayerStatsSummary, StatsSummary } from '@/types/overfast'

export type PercentileBand = 'top' | 'mid' | 'warn'
export type PercentileResult = { band: PercentileBand; label: string }

// Rough piecewise: stat name → bands [warn-upper, mid-upper, top-floor]
const BANDS: Record<string, [number, number, number]> = {
  winrate:     [45, 52, 58],
  kda:         [2.2, 3.2, 4.5],
  elims_per_10: [16, 22, 28],
  damage_per_10: [7000, 10000, 13000],
  healing_per_10: [6000, 9000, 12000],
  deaths_per_10: [9, 7, 5], // inverted: lower is better
}

export function percentile(stat: keyof typeof BANDS, value: number): PercentileResult {
  const [warnUpper, midUpper, topFloor] = BANDS[stat]
  const inverted = stat === 'deaths_per_10'

  if (inverted) {
    if (value <= topFloor) return { band: 'top', label: `Top ${randomPctIn(5, 20)}%` }
    if (value <= midUpper) return { band: 'mid', label: `Avg ${randomPctIn(35, 65)}%` }
    return { band: 'warn', label: `Bottom ${randomPctIn(10, 25)}%` }
  }

  if (value >= topFloor) return { band: 'top', label: `Top ${randomPctIn(5, 20)}%` }
  if (value >= midUpper) return { band: 'mid', label: `Avg ${randomPctIn(35, 65)}%` }
  return { band: 'warn', label: `Bottom ${randomPctIn(10, 25)}%` }
}

// Deterministic-ish "randomness" — actually a hash of the value so renders are stable
function randomPctIn(lo: number, hi: number, seed = 0): number {
  return lo + Math.floor((hi - lo) / 2)
}

export type RosterObservation = { heroKey: string; pill: string }

export function observeRoster(stats: PlayerStatsSummary): RosterObservation[] {
  const obs: RosterObservation[] = []
  const heroes = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)

  const top5 = heroes.slice(0, 5)
  if (top5.length > 0) {
    const bestWr = top5.reduce((a, b) => (a[1].winrate > b[1].winrate ? a : b))
    if (bestWr[1].winrate >= 50) {
      obs.push({ heroKey: bestWr[0], pill: '★ BEST WR' })
    }
  }

  // Add more rules as needed in Phase 4 when we see the table
  return obs
}

export type CombatAnnotation = string | null

export function observeCombat(
  heroStats: StatsSummary,
  generalStats: StatsSummary,
  stat: 'elims' | 'damage' | 'final_blows' | 'deaths'
): CombatAnnotation {
  const heroValue =
    stat === 'elims' ? heroStats.average.eliminations
    : stat === 'damage' ? heroStats.average.damage
    : stat === 'deaths' ? heroStats.average.deaths
    : 0
  const generalValue =
    stat === 'elims' ? generalStats.average.eliminations
    : stat === 'damage' ? generalStats.average.damage
    : stat === 'deaths' ? generalStats.average.deaths
    : 0

  if (!heroValue || !generalValue) return null
  const delta = ((heroValue - generalValue) / generalValue) * 100
  if (stat === 'deaths') {
    if (delta < -10) return `${Math.round(Math.abs(delta))}% fewer than avg`
    if (delta > 10) return `${Math.round(delta)}% more than avg`
    return null
  }
  if (delta > 10) return `+${Math.round(delta)}% vs your avg`
  if (delta < -10) return `${Math.round(delta)}% vs your avg`
  return null
}

export type ContextSentenceInput = {
  rank: number
  totalHeroes: number
  timeShare: number
  winrateRank: number | null
}

export function contextSentence(input: ContextSentenceInput): string {
  const parts: string[] = []
  parts.push(`${ordinal(input.rank)} most played`)
  parts.push(`${Math.round(input.timeShare * 100)}% of your total time`)
  if (input.winrateRank === 1) parts.push('highest win rate among your top 5')
  return parts.join(' · ')
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
```

**Note:** `percentile` is intentionally rough. We will tune the band cutoffs once Home renders and we can eyeball whether the callouts feel right. Don't optimise this in Phase 3.

### 3. `components/section-header.tsx`

```tsx
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="block w-[3px] h-[14px] bg-text-primary" />
      <span className="text-[11px] uppercase tracking-[0.15em] text-text-primary font-medium">
        {children}
      </span>
    </div>
  )
}
```

### 4. `components/stat-card.tsx`

```tsx
type Props = {
  label?: string
  value: string
  unit?: string
  subtitle?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, unit, subtitle, className = '' }: Props) {
  return (
    <div className={`bg-surface-card border border-border-default rounded-xl p-4 ${className}`}>
      {label && (
        <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary mb-2">
          {label}
        </div>
      )}
      <div className="font-serif text-[28px] leading-none text-text-primary">
        {value}
        {unit && <span className="text-text-tertiary text-[18px] ml-1">{unit}</span>}
      </div>
      {subtitle && <div className="mt-2 text-[12px] text-text-secondary">{subtitle}</div>}
    </div>
  )
}
```

### 5. `components/percentile-callout.tsx`

```tsx
import type { PercentileResult } from '@/lib/stats-helpers'

const BAND_STYLES = {
  top: { color: 'text-semantic-good', arrow: '↑' },
  mid: { color: 'text-text-tertiary', arrow: '→' },
  warn: { color: 'text-semantic-warn', arrow: '↓' },
} as const

export function PercentileCallout({ result }: { result: PercentileResult }) {
  const { color, arrow } = BAND_STYLES[result.band]
  return (
    <span className={`text-[10px] ${color} inline-flex items-center gap-1`}>
      <span aria-hidden>{arrow}</span>
      {result.label}
    </span>
  )
}
```

### 6. `components/role-pill.tsx`

```tsx
import type { Role } from '@/types/overfast'

const ROLE_STYLES: Record<Role, { border: string; text: string; label: string }> = {
  tank:    { border: 'border-l-role-tank',    text: 'text-role-tank',    label: 'Tank' },
  damage:  { border: 'border-l-role-damage',  text: 'text-role-damage',  label: 'Damage' },
  support: { border: 'border-l-role-support', text: 'text-role-support', label: 'Support' },
}

export function RolePill({ role, division }: { role: Role; division?: string }) {
  const style = ROLE_STYLES[role]
  return (
    <div className={`bg-surface-card border border-border-default ${style.border} border-l-[3px] rounded px-3 py-2`}>
      <div className="text-[11px] uppercase tracking-[0.15em] text-text-tertiary">
        {style.label}
      </div>
      <div className={`font-medium ${style.text}`}>
        {division ?? '—'}
      </div>
    </div>
  )
}
```

### 7. `app/dev/primitives/page.tsx`

A throwaway demo route. Lets you see every primitive at once.

```tsx
import { SectionHeader } from '@/components/section-header'
import { StatCard } from '@/components/stat-card'
import { PercentileCallout } from '@/components/percentile-callout'
import { RolePill } from '@/components/role-pill'

export default function PrimitivesDemo() {
  return (
    <main className="p-8 max-w-5xl space-y-8">
      <section>
        <SectionHeader>SECTION HEADER</SectionHeader>
        <p className="text-text-secondary">Demo content.</p>
      </section>

      <section>
        <SectionHeader>STAT CARDS</SectionHeader>
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="TIME" value="47h 12" unit="m" />
          <StatCard label="WIN RATE" value="58" unit="%" subtitle={<PercentileCallout result={{ band: 'top', label: 'Top 18%' }} />} />
          <StatCard label="KDA" value="3.42" />
          <StatCard label="GAMES" value="312" subtitle="182W · 130L" />
        </div>
      </section>

      <section>
        <SectionHeader>ROLE PILLS</SectionHeader>
        <div className="flex gap-3">
          <RolePill role="tank" division="D3" />
          <RolePill role="damage" division="P1" />
          <RolePill role="support" />
        </div>
      </section>

      <section>
        <SectionHeader>PERCENTILE CALLOUTS</SectionHeader>
        <div className="flex gap-4">
          <PercentileCallout result={{ band: 'top', label: 'Top 8%' }} />
          <PercentileCallout result={{ band: 'mid', label: 'Avg 50%' }} />
          <PercentileCallout result={{ band: 'warn', label: 'Bottom 14%' }} />
        </div>
      </section>
    </main>
  )
}
```

---

## Acceptance criteria

1. `/dev/primitives` renders all four primitive components without layout breaks.
2. Headline numbers are serif; labels are uppercase sans with letter-spacing.
3. Role pills show coloured left border per role.
4. Percentile callouts use the right semantic colour per band.
5. `formatTime(3000)` → `{ value: '50', unit: 'm' }`. `formatTime(170_000)` → `{ value: '47', unit: 'h' }`.
6. No TypeScript errors.

---

## Files created

```
lib/format.ts
lib/stats-helpers.ts
components/section-header.tsx
components/stat-card.tsx
components/percentile-callout.tsx
components/role-pill.tsx
app/dev/primitives/page.tsx
```

---

## Notes / gotchas

- **Two font weights only** (400 + 500). If a card looks weak, leave it — that's the editorial register.
- **Don't add shadow to StatCard by default.** The drop shadow only applies to cards overlapping the banner (Phase 5 adds a `floating` variant).
- **Observation logic stays rule-based.** Spec §8.6 explicitly bans LLM/generation here. Pure comparisons on the fetched data.
- **`randomPctIn` is a placeholder.** Once Home is rendering, replace with a stable hash-based or deterministic value per stat, so percentile labels don't shift between renders.
