'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { formatHours, formatPercent } from '@/lib/format'
import { heroHref, type ViewMode } from '@/lib/view-mode'
import type { GlobalHeroStat, HeroListItem, Role, StatsSummary } from '@/types/overfast'

type Filter = 'all' | Role

const FILTERS: Filter[] = ['all', 'tank', 'damage', 'support']

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
}

const ROLE_LABEL: Record<Role, string> = {
  tank: 'Tank',
  damage: 'Damage',
  support: 'Support',
}

const ROLE_TEXT: Record<Role, string> = {
  tank: 'text-role-tank',
  damage: 'text-role-damage',
  support: 'text-role-support',
}

export function HeroesBrowser({
  heroes,
  playerHeroes,
  globalByKey,
  view,
}: {
  heroes: HeroListItem[]
  playerHeroes: Record<string, StatsSummary>
  globalByKey: Record<string, GlobalHeroStat>
  view: ViewMode
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return heroes
      .filter((h) => (filter === 'all' ? true : h.role === filter))
      .filter((h) => (q ? h.name.toLowerCase().includes(q) || h.key.includes(q) : true))
      .sort((a, b) => {
        const aTime = playerHeroes[a.key]?.time_played ?? 0
        const bTime = playerHeroes[b.key]?.time_played ?? 0
        if (bTime !== aTime) return bTime - aTime
        return a.name.localeCompare(b.name)
      })
  }, [heroes, filter, query, playerHeroes])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-5 md:mb-6">
        <div className="flex gap-2 text-[12px] uppercase tracking-[0.2em] font-bold flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
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
        <label className="sm:ml-auto relative block w-full sm:w-64">
          <span className="sr-only">Search heroes</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search heroes"
            className="w-full bg-surface-card border border-border-default rounded-full px-4 py-2 text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-[14px] text-text-tertiary text-center uppercase tracking-widest font-bold border border-border-default rounded-2xl bg-surface-card">
          No heroes match.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {filtered.map((hero) => {
            const portrait = getHeroPortrait(hero.key) ?? hero.portrait
            const yours = playerHeroes[hero.key]
            const global = globalByKey[hero.key]

            return (
              <Link
                key={hero.key}
                href={heroHref(hero.key, view, 'global')}
                prefetch
                className="relative aspect-3/4 rounded-2xl overflow-hidden bg-surface-card border border-border-default group"
              >
                {portrait && (
                  <Image
                    src={portrait}
                    alt={hero.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    quality={100}
                    className="object-cover object-[70%_center] transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent" />

                {global && (
                  <span className="absolute top-3 right-3 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-bold text-white/90 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                    {formatPercent(global.pickrate)} pick
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                  <h3 className="text-[15px] md:text-[18px] font-black uppercase leading-none tracking-tight truncate">
                    {hero.name}
                  </h3>
                  <p
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.18em] font-bold mt-1.5 ${ROLE_TEXT[hero.role]}`}
                  >
                    {ROLE_LABEL[hero.role]}
                  </p>
                  <p className="text-[10px] md:text-[11px] mt-2 font-bold uppercase tracking-widest text-white/75">
                    {yours ? formatHours(yours.time_played) : 'Unplayed'}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
