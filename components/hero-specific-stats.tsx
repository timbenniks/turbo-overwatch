import { getPlayerStatsDeepForView } from '@/lib/overfast'
import { PLAYER_ID } from '@/lib/constants'
import { SectionHeader } from '@/components/section-header'
import { StatTable, type StatRow } from '@/components/stats/stat-table'
import { Star } from '@/components/icons'
import { formatNumber, formatPercent, formatRate, formatTime } from '@/lib/format'
import type { ViewMode } from '@/lib/view-mode'

// The API ships a total and an `_avg_per_10_min` rate for most hero-specific
// stats. The old grid showed only the totals, one cell each, 17 across — which
// is both the least useful half of the data and the hardest to scan. A two
// column table keeps the rate, which is what makes a total comparable.

const RECORD_SUFFIXES = ['_most_in_game', '_best_in_game', '_most_in_life', '_best']
const RATE_SUFFIX = '_avg_per_10_min'

export async function HeroSpecificStats({
  heroKey,
  view,
}: {
  heroKey: string
  view: ViewMode
}) {
  const deep = await getPlayerStatsDeepForView(PLAYER_ID, view, { hero: heroKey })
  const categories = deep?.[heroKey] ?? []
  const hs = categories.find((c) => c.category === 'hero_specific')?.stats ?? []
  if (hs.length === 0) return null

  const rates = new Map<string, number>()
  for (const s of hs) {
    if (s.key.endsWith(RATE_SUFFIX) && typeof s.value === 'number') {
      rates.set(s.key.slice(0, -RATE_SUFFIX.length), s.value)
    }
  }

  const seen = new Set<string>()
  const rows: StatRow[] = []
  for (const s of hs) {
    if (s.key.endsWith(RATE_SUFFIX)) continue
    if (RECORD_SUFFIXES.some((suf) => s.key.endsWith(suf))) continue
    if (seen.has(s.key)) continue
    seen.add(s.key)
    const rate = rates.get(s.key)
    rows.push({
      label: s.label,
      value: formatValue(s.key, s.value),
      // A rate is meaningless on a stat that is already a percentage.
      secondary:
        rate !== undefined && !isPercent(s.key) ? `${formatRate(rate)} / 10m` : undefined,
    })
  }

  if (rows.length === 0) return null

  return (
    <section>
      <SectionHeader icon={<Star size={22} />}>Hero specific</SectionHeader>
      <StatTable
        summary="Hero specific stats"
        groups={[{ label: 'Career', rows }]}
        secondaryHeading="Per 10 min"
        defaultOpen
      />
    </section>
  )
}

function isPercent(key: string): boolean {
  return key.includes('accuracy')
}

function formatValue(key: string, value: string | number): string {
  if (typeof value === 'string') return value
  if (isPercent(key)) return formatPercent(value)
  if (key.includes('time')) {
    const t = formatTime(value)
    return `${t.value}${t.unit}`
  }
  return formatNumber(value)
}
