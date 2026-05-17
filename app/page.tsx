import { Suspense } from 'react'
import {
  getPlayerSummary,
  getPlayerStatsBreakdown,
  selectStatsForView,
  getHeroList,
} from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { parseViewMode } from '@/lib/view-mode'
import type { ViewMode } from '@/lib/view-mode'
import { HeroSpotlight } from '@/components/hero-spotlight'
import { RoleRankStripe } from '@/components/role-rank-stripe'
import { MostPlayed } from '@/components/most-played'
import { CareerOverview } from '@/components/career-overview'
import { CareerDetail } from '@/components/career-detail'
import { RosterTable } from '@/components/roster-table'
import { SectionHeader } from '@/components/section-header'
import { CareerDetailSkeleton } from '@/components/skeletons'
import { Shield, Star, Target, ListTree } from '@/components/icons'
import { Reveal } from '@/components/reveal'
import { PrefetchHeroes } from '@/components/prefetch-heroes'
import type { Role } from '@/types/overfast'

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  return (
    <main className="w-full pb-32 md:pb-16">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const view: ViewMode = parseViewMode(mode)

  const [summary, breakdown, heroList] = await Promise.all([
    getPlayerSummary(PLAYER_ID),
    getPlayerStatsBreakdown(PLAYER_ID),
    getHeroList(),
  ])
  const stats = selectStatsForView(breakdown, view)

  if (!summary || !stats) {
    return <PlayerNotFound />
  }

  const heroRoles: Record<string, Role> = {}
  const heroNames: Record<string, string> = {}
  for (const h of heroList) {
    heroRoles[h.key] = h.role
    heroNames[h.key] = h.name
  }
  const heroNamesMap = new Map(Object.entries(heroNames))

  const playedHeroKeys = Object.keys(stats.heroes)

  return (
    <>
      <PrefetchHeroes heroKeys={playedHeroKeys} />
      <HeroSpotlight
        stats={stats}
        view={view}
        heroRoles={heroRoles}
        heroNames={heroNames}
      />

      <div className="px-4 md:px-16 space-y-10 md:space-y-16 mt-8 md:mt-12 max-w-400 mx-auto">
        <Reveal as="section">
          <SectionHeader icon={<Shield size={22} />}>Role ranks</SectionHeader>
          <RoleRankStripe
            summary={summary}
            stats={stats}
            view={view}
            breakdown={breakdown}
          />
        </Reveal>

        <Reveal as="section" delay={60}>
          <SectionHeader icon={<Star size={22} />}>Most played</SectionHeader>
          <MostPlayed stats={stats} heroNames={heroNamesMap} />
        </Reveal>

        <Reveal as="section" delay={60}>
          <SectionHeader icon={<Target size={22} />}>Career overview</SectionHeader>
          <CareerOverview stats={stats} view={view} breakdown={breakdown} />
        </Reveal>

        <Reveal delay={60}>
          <Suspense fallback={<CareerDetailSkeleton />}>
            <CareerDetail view={view} />
          </Suspense>
        </Reveal>

        <Reveal as="section" delay={60}>
          <SectionHeader icon={<ListTree size={22} />}>Your roster</SectionHeader>
          <RosterTable stats={stats} heroRoles={heroRoles} heroNames={heroNames} />
        </Reveal>
      </div>
    </>
  )
}

function PlayerNotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="text-[40px] leading-none font-black uppercase">Player not found.</h1>
      <p className="text-text-secondary mt-4">
        Check the battletag — names are case-sensitive and should be in{' '}
        <code className="font-mono text-[12px] bg-surface-card-active px-1.5 py-0.5 rounded">
          Name#1234
        </code>{' '}
        form.
      </p>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <>
      <div className="w-full h-[85vh] min-h-160 bg-surface-card animate-pulse" />
      <div className="px-4 md:px-16 mt-8 space-y-10 md:space-y-16 max-w-400 mx-auto">
        <SkeletonGrid cols={3} h={120} />
        <SkeletonGrid cols={3} h={320} />
        <SkeletonGrid cols={4} h={120} />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-card border border-border-default rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </>
  )
}

function SkeletonGrid({ cols, h }: { cols: number; h: number }) {
  return (
    <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-card border border-border-default rounded-xl animate-pulse"
          style={{ height: h }}
        />
      ))}
    </div>
  )
}
