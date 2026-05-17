'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { getHeroTheme } from '@/lib/hero-theme'
import { observeRoster } from '@/lib/stats-helpers'
import { formatTime, formatPercent } from '@/lib/format'
import type { PlayerStatsSummary, Role } from '@/types/overfast'

type Filter = 'all' | Role

const FILTERS: Filter[] = ['all', 'tank', 'damage', 'support']

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
}

export function RosterTable({
  stats,
  heroRoles,
  heroNames,
}: {
  stats: PlayerStatsSummary
  heroRoles: Record<string, Role>
  heroNames: Record<string, string>
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [showAll, setShowAll] = useState(false)

  const observations = observeRoster(stats)
  const obsMap = new Map(observations.map((o) => [o.heroKey, o.pill]))

  const sorted = Object.entries(stats.heroes)
    .filter(([key]) => filter === 'all' || heroRoles[key] === filter)
    .sort(([, a], [, b]) => b.time_played - a.time_played)

  const rows = showAll ? sorted : sorted.slice(0, 6)

  return (
    <div>
      <div className="flex gap-2 mb-4 text-[12px] uppercase tracking-[0.2em] font-bold">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f)
              setShowAll(false)
            }}
            className={`px-4 py-2 rounded-full border transition-colors ${
              filter === f
                ? 'bg-text-primary text-surface-canvas border-text-primary'
                : 'border-border-default text-text-tertiary hover:text-text-secondary hover:border-border-strong'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_70px_70px] md:grid-cols-[56px_1fr_100px_100px_100px_100px] gap-3 md:gap-4 px-3 md:px-5 py-3 text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-text-tertiary font-bold border-b border-border-default">
          <span />
          <span>Hero</span>
          <span className="text-right">Time</span>
          <span className="text-right">WR</span>
          <span className="text-right hidden md:block">KDA</span>
          <span className="text-right hidden md:block">E/10m</span>
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-[14px] text-text-tertiary text-center uppercase tracking-widest font-bold">
            No heroes played in this role.
          </div>
        ) : (
          rows.map(([key, heroStats]) => {
            const theme = getHeroTheme(key, heroRoles[key])
            const time = formatTime(heroStats.time_played)
            const portrait = getHeroPortrait(key)
            const pill = obsMap.get(key)
            const name = heroNames[key] ?? key.replace(/-/g, ' ')

            return (
              <Link
                href={`/hero/${key}`}
                key={key}
                prefetch
                className="press-tactile grid grid-cols-[40px_1fr_70px_70px] md:grid-cols-[56px_1fr_100px_100px_100px_100px] gap-3 md:gap-4 px-3 md:px-5 py-4 items-center border-b border-border-default last:border-b-0 hover:bg-surface-card-active"
                style={{ borderLeft: `4px solid ${theme.primary}` }}
              >
                <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden bg-border-default">
                  {portrait && (
                    <Image src={portrait} alt="" fill sizes="44px" quality={100} className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="uppercase text-[13px] md:text-[18px] font-black tracking-tight leading-none truncate">
                    {name}
                  </div>
                  {pill && (
                    <div className="text-[9px] md:text-[10px] text-semantic-good mt-1.5 uppercase tracking-[0.2em] font-bold">
                      {pill}
                    </div>
                  )}
                </div>
                <div className="text-right font-black text-[14px] md:text-[18px]">
                  {time.value}
                  <span className="text-text-tertiary text-[11px] md:text-[12px] ml-0.5 font-bold">{time.unit}</span>
                </div>
                <div
                  className={`text-right font-black text-[14px] md:text-[18px] ${
                    heroStats.winrate >= 50 ? 'text-semantic-good' : 'text-semantic-warn'
                  }`}
                >
                  {formatPercent(heroStats.winrate)}
                </div>
                <div className="text-right font-black text-[18px] hidden md:block">
                  {heroStats.kda.toFixed(2)}
                </div>
                <div className="text-right font-black text-[18px] hidden md:block">
                  {heroStats.average.eliminations.toFixed(1)}
                </div>
              </Link>
            )
          })
        )}
      </div>

      {!showAll && sorted.length > 6 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-[13px] text-text-secondary hover:text-text-primary uppercase tracking-[0.2em] font-bold"
        >
          Show {sorted.length - 6} more heroes →
        </button>
      )}
    </div>
  )
}
