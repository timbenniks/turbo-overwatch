import { Suspense } from 'react'
import {
  getHeroList,
  getGlobalHeroStats,
  getPlayerStatsBreakdown,
  selectStatsForView,
} from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { parseViewMode } from '@/lib/view-mode'
import type { ViewMode } from '@/lib/view-mode'
import { SectionHeader } from '@/components/section-header'
import { Reveal } from '@/components/reveal'
import { HeroesMetaStrip } from '@/components/heroes-meta-strip'
import { HeroesBrowser } from '@/components/heroes-browser'
import { Star, ListTree } from '@/components/icons'
import type { GlobalHeroStat, HeroListItem } from '@/types/overfast'

export default function HeroesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  return (
    <main className="w-full pb-32 md:pb-16">
      <Suspense fallback={<HeroesSkeleton />}>
        <HeroesContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function HeroesContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const view: ViewMode = parseViewMode(mode)

  // Global meta is per-gamemode; 'all' has no endpoint, so borrow quick play
  // (same convention as the hero detail page).
  const globalMode = view === 'competitive' ? 'competitive' : 'quickplay'
  const globalLabel =
    view === 'competitive'
      ? 'PC competitive · Europe'
      : view === 'quickplay'
        ? 'PC quick play · Europe'
        : 'PC quick play · Europe (all-modes view)'

  const [heroList, globalStats, breakdown] = await Promise.all([
    getHeroList(),
    getGlobalHeroStats({ gamemode: globalMode }),
    getPlayerStatsBreakdown(PLAYER_ID),
  ])
  const stats = selectStatsForView(breakdown, view)
  const playerHeroes = stats?.heroes ?? {}

  const heroesByKey = new Map<string, HeroListItem>()
  for (const h of heroList) heroesByKey.set(h.key, h)

  const globalByKey: Record<string, GlobalHeroStat> = {}
  for (const g of globalStats) globalByKey[g.hero] = g

  return (
    <div data-mode={view} className="px-4 md:px-16 pt-8 md:pt-12 max-w-400 mx-auto space-y-10 md:space-y-16">
      <Reveal>
        <header className="space-y-3 max-w-2xl">
          <p className="text-[11px] md:text-[12px] uppercase tracking-[0.25em] text-text-tertiary font-bold">
            Heroes
          </p>
          <h1 className="text-[36px] md:text-[64px] font-black uppercase leading-[0.9] tracking-tight">
            The roster
          </h1>
          <p className="text-text-secondary text-[14px] md:text-[16px] leading-relaxed">
            Global pick rates, every playable hero, and how much you&apos;ve played each one.
          </p>
        </header>
      </Reveal>

      <Reveal as="section" delay={40}>
        <SectionHeader icon={<Star size={22} />}>Most played globally</SectionHeader>
        <HeroesMetaStrip
          stats={globalStats}
          heroesByKey={heroesByKey}
          view={view}
          globalLabel={globalLabel}
        />
      </Reveal>

      <Reveal as="section" delay={60}>
        <SectionHeader icon={<ListTree size={22} />}>Browse heroes</SectionHeader>
        <HeroesBrowser
          heroes={heroList}
          playerHeroes={playerHeroes}
          globalByKey={globalByKey}
          view={view}
        />
      </Reveal>
    </div>
  )
}

function HeroesSkeleton() {
  return (
    <div className="px-4 md:px-16 pt-8 md:pt-12 max-w-400 mx-auto space-y-10 md:space-y-16">
      <div className="space-y-3">
        <div className="h-3 w-24 bg-surface-card animate-pulse rounded" />
        <div className="h-14 w-64 bg-surface-card animate-pulse rounded" />
        <div className="h-4 w-full max-w-md bg-surface-card animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-3/4 bg-surface-card border border-border-default rounded-2xl animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-3/4 bg-surface-card border border-border-default rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
