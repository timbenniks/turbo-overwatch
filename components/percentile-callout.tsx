import type { PercentileResult } from '@/lib/stats-helpers'

const BAND_STYLES = {
  top: { color: 'text-semantic-good', arrow: '↑' },
  mid: { color: 'text-text-tertiary', arrow: '→' },
  warn: { color: 'text-semantic-warn', arrow: '↓' },
} as const

export function PercentileCallout({ result }: { result: PercentileResult }) {
  const { color, arrow } = BAND_STYLES[result.band]
  return (
    <span className={`text-[11px] uppercase tracking-widest font-bold ${color} inline-flex items-center gap-1`}>
      <span aria-hidden>{arrow}</span>
      {result.label}
    </span>
  )
}
