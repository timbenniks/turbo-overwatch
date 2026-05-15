import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  getPlayerStatsSummary,
  getHero,
  getHeroList,
} from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { getHeroTheme } from '@/lib/hero-theme'
import { getHeroPortrait } from '@/lib/hero-assets'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeroBanner } from '@/components/hero-banner'
import { HeroIdentityCard } from '@/components/hero-identity-card'
import { HeroAbilities } from '@/components/hero-abilities'
import { HeroSpecificStats } from '@/components/hero-specific-stats'
import { HeadlineStatTrio } from '@/components/headline-stat-trio'
import { CombatSignature } from '@/components/combat-signature'
import { RosterContextChart } from '@/components/roster-context-chart'
import { SectionHeader } from '@/components/section-header'
import { BestMoments } from '@/components/best-moments'
import { BestMomentsSkeleton, CareerDetailSkeleton } from '@/components/skeletons'
import { Crosshair, ListTree } from '@/components/icons'
import type { Gamemode } from '@/types/overfast'

export default function HeroDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  return (
    <main className="w-full pb-32 md:pb-16">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function HeroContent({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { key } = await params
  const { mode } = await searchParams
  const gamemode: Gamemode = mode === 'competitive' ? 'competitive' : 'quickplay'

  const [stats, hero, heroList] = await Promise.all([
    getPlayerStatsSummary(PLAYER_ID, { gamemode }),
    getHero(key),
    getHeroList(),
  ])

  if (!hero && !getHeroPortrait(key)) notFound()

  const heroNames: Record<string, string> = {}
  for (const h of heroList) heroNames[h.key] = h.name

  const theme = getHeroTheme(key, hero?.role)
  const heroStats = stats?.heroes[key] ?? null
  const generalStats = stats?.general ?? null
  const displayName = hero?.name ?? heroNames[key] ?? key.replace(/-/g, ' ')

  return (
    <>
      <div className="relative">
        <Breadcrumb heroName={displayName} />
        <HeroBanner heroKey={key} hero={hero} gamemode={gamemode} />
      </div>

      <div className="px-4 md:px-16 -mt-10 md:-mt-12 relative z-10 max-w-400 mx-auto">
        {heroStats ? (
          <HeadlineStatTrio
            heroKey={key}
            heroStats={heroStats}
            allHeroes={stats!.heroes}
          />
        ) : (
          <NeverPlayedNotice heroName={displayName} />
        )}
      </div>

      <div className="px-4 md:px-16 mt-10 md:mt-16 space-y-10 md:space-y-16 max-w-400 mx-auto">
        {hero && <HeroIdentityCard hero={hero} />}

        {hero && hero.abilities && hero.abilities.length > 0 && (
          <HeroAbilities abilities={hero.abilities} />
        )}

        {heroStats && generalStats && stats && (
          <>
            <section>
              <SectionHeader icon={<Crosshair size={22} />}>Combat signature</SectionHeader>
              <CombatSignature heroStats={heroStats} generalStats={generalStats} />
            </section>

            <Suspense fallback={<CareerDetailSkeleton />}>
              <HeroSpecificStats heroKey={key} gamemode={gamemode} />
            </Suspense>

            <section>
              <SectionHeader icon={<ListTree size={22} />}>
                {displayName} in your roster
              </SectionHeader>
              <RosterContextChart
                heroKey={key}
                stats={stats}
                theme={theme}
                heroNames={heroNames}
              />
            </section>

            <Suspense fallback={<BestMomentsSkeleton />}>
              <BestMoments heroKey={key} gamemode={gamemode} />
            </Suspense>
          </>
        )}
      </div>
    </>
  )
}

function NeverPlayedNotice({ heroName }: { heroName: string }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-2xl p-8 text-center">
      <p className="text-[18px] md:text-[28px] uppercase font-black tracking-tight">
        You haven&apos;t played {heroName} yet.
      </p>
      <p className="text-text-secondary text-[13px] mt-3 uppercase tracking-widest font-bold">
        Once you have some games on this hero, this page will show your performance.
      </p>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <>
      <div className="w-full h-[70vh] min-h-130 bg-surface-card animate-pulse" />
      <div className="px-4 md:px-16 -mt-10 md:-mt-12 relative z-10 max-w-400 mx-auto">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-surface-card border border-border-default rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="px-4 md:px-16 mt-16 space-y-16 max-w-400 mx-auto">
        <div className="h-32 bg-surface-card border border-border-default rounded-2xl animate-pulse" />
        <div className="h-96 bg-surface-card border border-border-default rounded-2xl animate-pulse" />
      </div>
    </>
  )
}
