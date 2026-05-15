import Link from 'next/link'
import Image from 'next/image'
import { getHeroPortrait } from '@/lib/hero-assets'
import { getHeroTheme } from '@/lib/hero-theme'
import { formatTime, formatPercent } from '@/lib/format'
import type { PlayerStatsSummary, PlayerSummary, Role } from '@/types/overfast'

export function HeroSpotlight({
  summary,
  stats,
  heroRoles,
  heroNames,
}: {
  summary: PlayerSummary
  stats: PlayerStatsSummary
  heroRoles: Record<string, Role>
  heroNames: Record<string, string>
}) {
  const sorted = Object.entries(stats.heroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played
  )
  const top = sorted[0]
  if (!top) return null

  const [key, heroStats] = top
  const role = heroRoles[key]
  const theme = getHeroTheme(key, role)
  const portrait = getHeroPortrait(key)
  const name = heroNames[key] ?? key.replace(/-/g, ' ')
  const time = formatTime(heroStats.time_played)
  const [username, tag] = summary.username.split('#')

  return (
    <section className="relative w-full h-[85vh] min-h-160 overflow-hidden">
      {portrait && (
        <Image
          src={portrait}
          alt={name}
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover object-[70%_20%] md:object-[center_20%]"
        />
      )}
      <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-surface-canvas via-surface-canvas/70 to-transparent" />

      <div className="relative z-10 px-6 md:px-16 pt-6 md:pt-8 flex items-center gap-4">
        <Image
          src={summary.avatar}
          alt={`${username} avatar`}
          width={96}
          height={96}
          quality={100}
          className="rounded-full ring-2 ring-white/20 w-14 h-14 md:w-16 md:h-16"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-[22px] md:text-[28px] leading-none font-black uppercase tracking-tight text-white truncate">
              {username}
            </h2>
            {tag && (
              <span className="text-[12px] md:text-[14px] text-white/60 font-bold">
                #{tag}
              </span>
            )}
          </div>
          {summary.title && (
            <p className="text-[10px] md:text-[12px] uppercase tracking-[0.2em] text-white/70 font-bold mt-1 truncate">
              {summary.title}
            </p>
          )}
        </div>
        {summary.endorsement && (
          <div className="flex items-center gap-2 text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-white/80 font-bold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={summary.endorsement.frame} alt="" width={36} height={36} />
            <span className="hidden md:inline">Lvl {summary.endorsement.level}</span>
          </div>
        )}
      </div>

      <div className="relative h-full flex flex-col justify-end px-6 md:px-16 pb-16 md:pb-24 -mt-22 md:-mt-28">
        <div className="flex items-center gap-3 mb-6">
          <span
            className="text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-bold px-3 py-1.5 rounded-full"
            style={{ background: theme.primary, color: '#07070a' }}
          >
            Most played
          </span>
          {role && (
            <span className="text-[11px] md:text-[12px] uppercase tracking-[0.25em] font-bold text-white/90">
              {role}
            </span>
          )}
        </div>

        <h1 className="text-[64px] md:text-[160px] leading-[0.85] font-black uppercase tracking-tighter text-white">
          {name}
        </h1>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
          <Stat label="Time" value={time.value} unit={time.unit} />
          <Stat label="Win rate" value={formatPercent(heroStats.winrate)} />
          <Stat label="KDA" value={heroStats.kda.toFixed(2)} />
          <Stat label="Games" value={String(heroStats.games_played)} />
        </div>

        <Link
          href={`/hero/${key}`}
          className="mt-10 inline-flex items-center gap-2 self-start px-6 py-3 bg-white text-surface-canvas font-bold uppercase tracking-[0.15em] text-[13px] rounded-full hover:bg-text-secondary transition-colors"
        >
          View full breakdown →
        </Link>
      </div>
    </section>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/70 font-bold mb-1">
        {label}
      </div>
      <div className="text-[40px] md:text-[56px] font-black leading-none text-white">
        {value}
        {unit && <span className="text-white/60 text-[24px] md:text-[32px] ml-1">{unit}</span>}
      </div>
    </div>
  )
}
