import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getPlayerStatsBreakdown,
  selectStatsForView,
  getHero,
  getHeroList,
  getGlobalHeroStats,
} from '@/lib/overfast'
import { getHeroicEmote } from '@/lib/fandom'
import { PLAYER_ID } from '@/lib/constants'
import { parseStatsScope, parseViewMode } from '@/lib/view-mode'
import type { StatsScope, ViewMode } from '@/lib/view-mode'
import { getHeroTheme } from '@/lib/hero-theme'
import { getHeroPortrait } from '@/lib/hero-assets'
import { HeroBanner } from '@/components/hero-banner'
import { Breadcrumb } from '@/components/breadcrumb'
import { HeroIdentityCard } from '@/components/hero-identity-card'
import { HeroAbilities } from '@/components/hero-abilities'
import { HeroPerks } from '@/components/hero-perks'
import { HeroHeroicEmote } from '@/components/hero-heroic-emote'
import { HeroStory } from '@/components/hero-story'
import { HeroSpecificStats } from '@/components/hero-specific-stats'
import { HeadlineStatTrio } from '@/components/headline-stat-trio'
import { GlobalHeadlineStatTrio } from '@/components/global-headline-stat-trio'
import { StatsScopeToggle } from '@/components/stats-scope-toggle'
import { CombatSignature } from '@/components/combat-signature'
import { RosterContextChart } from '@/components/roster-context-chart'
import { SectionHeader } from '@/components/section-header'
import { BestMoments } from '@/components/best-moments'
import { HeroTrend } from '@/components/hero-trend'
import {
  BestMomentsSkeleton,
  CareerDetailSkeleton,
  ChartGridSkeleton,
} from '@/components/skeletons'
import { Crosshair, ListTree } from '@/components/icons'
import { Reveal } from '@/components/reveal'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>
}): Promise<Metadata> {
  const { key } = await params
  const hero = await getHero(key)
  const name = hero?.name ?? key.replace(/-/g, ' ')
  const title = `${name} · Overwatch dashboard`
  const description = hero?.description
    ? `${name} — ${hero.role}. ${hero.description}`
    : `${name} stats, abilities and history.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: hero?.portrait ? [{ url: hero.portrait }] : undefined,
    },
  }
}

export default function HeroDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>
  searchParams: Promise<{ mode?: string; stats?: string }>
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
  searchParams: Promise<{ mode?: string; stats?: string }>
}) {
  const { key } = await params
  const { mode, stats: statsParam } = await searchParams
  const view: ViewMode = parseViewMode(mode)
  const scope: StatsScope = parseStatsScope(statsParam)
  const showMine = scope === 'mine'

  // Global stats are reported per gamemode; 'all' has no global equivalent, so
  // it borrows quick play and the label says so.
  const globalMode = view === 'competitive' ? 'competitive' : 'quickplay'
  const globalLabel = `PC ${globalMode === 'competitive' ? 'competitive' : 'quick play'} · Europe`
  const [breakdown, hero, heroList, globalStats] = await Promise.all([
    getPlayerStatsBreakdown(PLAYER_ID),
    getHero(key),
    getHeroList(),
    getGlobalHeroStats({ gamemode: globalMode }),
  ])
  const globalWinrate = globalStats.find((h) => h.hero === key)?.winrate ?? null
  const stats = selectStatsForView(breakdown, view)

  if (!hero && !getHeroPortrait(key)) notFound()

  const heroNames: Record<string, string> = {}
  for (const h of heroList) heroNames[h.key] = h.name

  const theme = getHeroTheme(key, hero?.role)
  const heroStats = stats?.heroes[key] ?? null
  const generalStats = stats?.general ?? null
  const displayName = hero?.name ?? heroNames[key] ?? key.replace(/-/g, ' ')
  const heroicEmote = await getHeroicEmote(displayName)

  return (
    // Mode accent for the hero page too, so navigating in from a mode keeps its
    // identity. See globals.css.
    <div data-mode={view}>
      {/* Positioned container so the breadcrumb anchors to the banner rather
          than the document, where it would sit behind the sticky header. */}
      <div className="relative">
        <HeroBanner heroKey={key} hero={hero} />
        <Breadcrumb heroName={displayName} view={view} />
      </div>

      <div className="px-4 md:px-16 -mt-10 md:-mt-12 relative z-10 max-w-400 mx-auto space-y-4">
        <div className="flex justify-end">
          <Suspense fallback={null}>
            <StatsScopeToggle current={scope} />
          </Suspense>
        </div>

        {showMine ? (
          heroStats ? (
            <HeadlineStatTrio
              heroKey={key}
              heroStats={heroStats}
              allHeroes={stats!.heroes}
              globalWinrate={globalWinrate}
              globalLabel={`vs global ${globalMode === 'competitive' ? 'comp' : 'QP'}`}
            />
          ) : (
            <NeverPlayedNotice heroName={displayName} />
          )
        ) : (
          <GlobalHeadlineStatTrio
            heroKey={key}
            globalStats={globalStats}
            globalLabel={globalLabel}
          />
        )}
      </div>

      <div className="px-4 md:px-16 mt-10 md:mt-16 space-y-10 md:space-y-16 max-w-400 mx-auto">
        {hero && (
          <Reveal>
            <HeroIdentityCard hero={hero} />
          </Reveal>
        )}

        {hero && hero.abilities && hero.abilities.length > 0 && (
          <Reveal delay={60}>
            <HeroAbilities abilities={hero.abilities} />
          </Reveal>
        )}

        {heroicEmote && (
          <Reveal delay={60}>
            <HeroHeroicEmote emote={heroicEmote} heroName={displayName} />
          </Reveal>
        )}

        {hero?.perks && (
          <Reveal delay={60}>
            <HeroPerks perks={hero.perks} />
          </Reveal>
        )}

        {showMine && heroStats && generalStats && stats && (
          <>
            <Reveal as="section" delay={60}>
              <SectionHeader icon={<Crosshair size={22} />}>Combat signature</SectionHeader>
              <CombatSignature heroStats={heroStats} generalStats={generalStats} />
            </Reveal>

            <Reveal delay={60}>
              <Suspense fallback={<CareerDetailSkeleton />}>
                <HeroSpecificStats heroKey={key} view={view} />
              </Suspense>
            </Reveal>

            <Reveal delay={60}>
              <Suspense fallback={<ChartGridSkeleton />}>
                <HeroTrend heroKey={key} heroName={displayName} view={view} />
              </Suspense>
            </Reveal>

            <Reveal as="section" delay={60}>
              <SectionHeader icon={<ListTree size={22} />}>
                {displayName} in your roster
              </SectionHeader>
              <RosterContextChart
                heroKey={key}
                stats={stats}
                theme={theme}
                heroNames={heroNames}
              />
            </Reveal>

            <Reveal delay={60}>
              <Suspense fallback={<BestMomentsSkeleton />}>
                <BestMoments heroKey={key} view={view} />
              </Suspense>
            </Reveal>
          </>
        )}

        {hero?.story && (
          <Reveal delay={60}>
            <HeroStory story={hero.story} heroName={displayName} />
          </Reveal>
        )}
      </div>
    </div>
  )
}

function NeverPlayedNotice({ heroName }: { heroName: string }) {
  return (
    <div className="bg-surface-card border border-border-default rounded-2xl p-8 text-center">
      <p className="text-[18px] md:text-[28px] uppercase font-black tracking-tight">
        You haven&apos;t played {heroName} yet.
      </p>
      <p className="text-text-secondary text-[13px] mt-3 uppercase tracking-widest font-bold">
        Switch to Global for pick and win rates, or play some games to unlock your stats.
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
