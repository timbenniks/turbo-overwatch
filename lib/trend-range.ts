export type TrendRange = '14' | '30' | '90' | 'all'

export const TREND_RANGES: Array<{ key: TrendRange; label: string }> = [
  { key: '14', label: '14d' },
  { key: '30', label: '30d' },
  { key: '90', label: '90d' },
  { key: 'all', label: 'All' },
]

export const DEFAULT_TREND_RANGE: TrendRange = '30'

export function parseTrendRange(value: string | undefined | null): TrendRange {
  if (value === '14' || value === '90' || value === 'all') return value
  return DEFAULT_TREND_RANGE
}

// ponytail: 3650 stands in for "all" — history starts in 2026 and grows one
// snapshot a day, so a decade of headroom is cheaper than a real unbounded path.
export function rangeToDays(range: TrendRange): number {
  return range === 'all' ? 3650 : Number(range)
}
