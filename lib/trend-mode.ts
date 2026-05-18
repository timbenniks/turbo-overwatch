export type TrendMode = 'cumulative' | 'delta'

export function parseTrendMode(value: string | undefined | null): TrendMode {
  return value === 'delta' ? 'delta' : 'cumulative'
}
