import { getPlayerStatsDeepForView, type DeepStat } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import { Trophy } from '@/components/icons'
import type { ViewMode } from '@/lib/view-mode'

export async function BestMoments({
  heroKey,
  view,
}: {
  heroKey: string
  view: ViewMode
}) {
  const deep = await getPlayerStatsDeepForView(PLAYER_ID, view, { hero: heroKey })
  const categories = deep?.[heroKey] ?? []
  const best = categories.find((c) => c.category === 'best')?.stats ?? []

  const elims = findStat(best, ['eliminations_most_in_game', 'eliminations_most_in_life'])
  const streak = findStat(best, ['kill_streak_best'])
  const multikill = findStat(best, ['multikill_best'])
  const damage = findStat(best, ['all_damage_done_most_in_game'])

  const cards = [
    { label: 'Most elims in a game', stat: elims },
    { label: 'Best kill streak', stat: streak },
    { label: 'Best multikill', stat: multikill },
    { label: 'Most damage in a game', stat: damage },
  ].filter((c): c is { label: string; stat: DeepStat } => c.stat !== null)

  if (cards.length === 0) return null
  const shown = cards.slice(0, 3)

  return (
    <section>
      <SectionHeader icon={<Trophy size={22} />}>Best moments</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {shown.map((c, i) => (
          <div
            key={c.label}
            className={`bg-surface-card border-2 rounded-2xl p-5 md:p-6 relative ${
              i === 0 ? 'border-text-primary' : 'border-border-default'
            }`}
          >
            {i === 0 && (
              <span className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.2em] text-text-primary font-black">
                Personal best
              </span>
            )}
            <div className="text-[32px] md:text-[52px] font-black leading-none tracking-tight">
              {formatStatValue(c.stat.value)}
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-text-tertiary mt-4 font-bold">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function findStat(stats: DeepStat[], keys: string[]): DeepStat | null {
  for (const k of keys) {
    const found = stats.find((s) => s.key === k)
    if (found) return found
  }
  return null
}

function formatStatValue(value: string | number): string {
  if (typeof value === 'number' && value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return String(value)
}
