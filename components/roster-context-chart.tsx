import { contextSentence } from '@/lib/stats-helpers'
import { formatTime } from '@/lib/format'
import type { PlayerStatsSummary } from '@/types/overfast'
import type { HeroTheme } from '@/lib/hero-theme'

export function RosterContextChart({
  heroKey,
  stats,
  theme,
  heroNames,
}: {
  heroKey: string
  stats: PlayerStatsSummary
  theme: HeroTheme
  heroNames: Record<string, string>
}) {
  const sorted = Object.entries(stats.heroes).sort(
    ([, a], [, b]) => b.time_played - a.time_played
  )
  const top8 = sorted.slice(0, 8)
  const includesCurrent = top8.some(([k]) => k === heroKey)
  const currentEntry = stats.heroes[heroKey]
    ? [heroKey, stats.heroes[heroKey]] as const
    : null
  const display = includesCurrent || !currentEntry ? top8 : [...top8.slice(0, 7), currentEntry]

  const maxTime = top8[0]?.[1].time_played ?? 1
  const rank = sorted.findIndex(([k]) => k === heroKey) + 1
  const totalTime = sorted.reduce((acc, [, s]) => acc + s.time_played, 0)
  const heroTime = currentEntry ? currentEntry[1].time_played : 0

  const top5 = sorted.slice(0, 5)
  const inTop5 = top5.some(([k]) => k === heroKey)
  const isBestWrInTop5 =
    inTop5 &&
    currentEntry !== null &&
    top5.every(([k, s]) => k === heroKey || s.winrate <= currentEntry[1].winrate)
  const winrateRank = isBestWrInTop5 ? 1 : null

  return (
    <div>
      <div className="bg-surface-card border border-border-default rounded-2xl p-6 space-y-4">
        {display.map(([key, s]) => {
          const pct = (s.time_played / maxTime) * 100
          const isCurrent = key === heroKey
          const time = formatTime(s.time_played)
          const name = heroNames[key] ?? key.replace(/-/g, ' ')

          return (
            <div key={key} className="relative">
              {isCurrent && (
                <span className="absolute -top-3 left-0 text-[10px] tracking-[0.25em] uppercase text-text-primary font-black">
                  YOU
                </span>
              )}
              <div className="flex items-center gap-4 text-[14px]">
                <span className="w-32 uppercase text-text-secondary truncate font-bold tracking-tight">{name}</span>
                <div className="flex-1 h-7 bg-surface-card-active rounded-md overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      background: isCurrent ? theme.primary : 'var(--color-border-strong)',
                    }}
                  />
                </div>
                <span className="w-20 text-right font-black text-[16px]">
                  {time.value}
                  <span className="text-text-tertiary text-[12px] ml-0.5">{time.unit}</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {rank > 0 && (
        <p className="mt-4 text-[14px] text-text-secondary uppercase tracking-widest font-bold">
          {contextSentence({
            rank,
            totalHeroes: sorted.length,
            timeShare: heroTime / totalTime,
            winrateRank,
          })}
        </p>
      )}
    </div>
  )
}
