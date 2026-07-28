import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { formatPercent } from '@/lib/format'
import { heroHref, type ViewMode } from '@/lib/view-mode'
import type { GlobalHeroStat, HeroListItem, Role } from '@/types/overfast'

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

export function HeroesMetaStrip({
  stats,
  heroesByKey,
  view,
  globalLabel,
  limit = 10,
}: {
  stats: GlobalHeroStat[]
  heroesByKey: Map<string, HeroListItem>
  view: ViewMode
  globalLabel: string
  limit?: number
}) {
  const top = [...stats]
    .sort((a, b) => b.pickrate - a.pickrate)
    .slice(0, limit)

  return (
    <div>
      <p className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-text-tertiary font-bold mb-4">
        Top pickrate · {globalLabel}
      </p>
      <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0 md:grid md:grid-cols-5 lg:grid-cols-10 md:overflow-visible">
        {top.map((stat, i) => {
          const hero = heroesByKey.get(stat.hero)
          const name = hero?.name ?? prettify(stat.hero)
          const role = hero?.role
          const portrait = getHeroPortrait(stat.hero) ?? hero?.portrait

          return (
            <Link
              key={stat.hero}
              href={heroHref(stat.hero, view, 'global')}
              prefetch
              className="relative min-w-[42%] sm:min-w-[28%] md:min-w-0 snap-start aspect-3/4 rounded-2xl overflow-hidden bg-surface-card border border-border-default group"
            >
              {portrait && (
                <Image
                  src={portrait}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 45vw, 12vw"
                  quality={100}
                  className="object-cover object-[70%_center] transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/35 to-transparent" />

              <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] font-bold text-white/90 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                #{i + 1}
              </span>

              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-3.5 text-white">
                <h3 className="text-[14px] md:text-[15px] font-black uppercase leading-none tracking-tight truncate">
                  {name}
                </h3>
                {role && (
                  <p
                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.18em] font-bold mt-1.5 ${ROLE_TEXT[role]}`}
                  >
                    {ROLE_LABEL[role]}
                  </p>
                )}
                <div className="text-[10px] md:text-[11px] mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 font-bold uppercase tracking-widest text-white/90">
                  <span>{formatPercent(stat.pickrate)} pick</span>
                  <span className="text-white/60">{formatPercent(stat.winrate)} WR</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function prettify(key: string): string {
  return key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
