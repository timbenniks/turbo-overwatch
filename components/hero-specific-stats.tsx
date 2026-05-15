import { getPlayerStatsDeep } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import { Star } from '@/components/icons'
import { formatNumber } from '@/lib/format'
import type { Gamemode } from '@/types/overfast'

const EXCLUDED_SUFFIXES = [
  '_most_in_game',
  '_best_in_game',
  '_avg_per_10_min',
  '_most_in_life',
]

export async function HeroSpecificStats({
  heroKey,
  gamemode,
}: {
  heroKey: string
  gamemode: Gamemode
}) {
  const deep = await getPlayerStatsDeep(PLAYER_ID, { gamemode, hero: heroKey })
  const categories = deep?.[heroKey] ?? []
  const hs = categories.find((c) => c.category === 'hero_specific')?.stats ?? []

  const primary = hs.filter((s) => !EXCLUDED_SUFFIXES.some((suf) => s.key.endsWith(suf)))
  if (primary.length === 0) return null

  return (
    <section>
      <SectionHeader icon={<Star size={22} />}>Hero specific</SectionHeader>

      <div className="bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border-default">
        {primary.map((s) => (
          <div key={s.key} className="p-4 md:p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold leading-tight min-h-7">
              {s.label}
            </div>
            <div className="text-[22px] md:text-[32px] font-black mt-2 leading-none tracking-tight">
              {formatValue(s.key, s.value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function formatValue(key: string, value: string | number): string {
  if (typeof value === 'string') return value
  if (key.endsWith('_accuracy') || key.endsWith('_scoped_accuracy')) {
    return `${Math.round(value)}%`
  }
  return formatNumber(value)
}
