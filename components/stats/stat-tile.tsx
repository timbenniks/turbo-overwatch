import type { ReactNode } from 'react'

// Stat tile: label · value · optional delta · optional sparkline · optional note.
// Server component throughout — the sparkline is inline SVG, so a tile ships no
// JavaScript.

const VALUE_SIZE = {
  lg: 'text-[30px] md:text-[48px]',
  md: 'text-[26px] md:text-[40px]',
  sm: 'text-[20px] md:text-[28px]',
} as const

const UNIT_SIZE = {
  lg: 'text-[18px] md:text-[28px]',
  md: 'text-[15px] md:text-[22px]',
  sm: 'text-[12px] md:text-[16px]',
} as const

export type StatTileProps = {
  label: string
  /** Already formatted. Pass null for "no data" rather than a zero. */
  value: string | null
  unit?: string
  size?: keyof typeof VALUE_SIZE
  /** Signed change against a named period. Omitted when there's nothing to compare. */
  delta?: { value: number; format: (v: number) => string; period: string; higherIsBetter?: boolean }
  /** Rolling series, oldest first. Nulls render as gaps. */
  spark?: (number | null)[]
  /** The comparison or derivation that gives the number meaning. */
  note?: ReactNode
  className?: string
}

export function StatTile({
  label,
  value,
  unit,
  size = 'md',
  delta,
  spark,
  note,
  className = '',
}: StatTileProps) {
  return (
    <div className={`p-4 md:p-6 ${className}`}>
      <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-text-tertiary font-bold leading-tight">
        {label}
      </div>

      <div className="flex items-end justify-between gap-3 mt-2">
        {/* Proportional figures on purpose: tabular-nums makes large standalone
            numbers look loose. Columns get tabular-nums, tiles don't. */}
        <div className={`${VALUE_SIZE[size]} font-black leading-none tracking-tight`}>
          {value ?? <span className="text-text-tertiary">—</span>}
          {value !== null && unit && (
            <span className={`text-text-tertiary ${UNIT_SIZE[size]} ml-0.5`}>{unit}</span>
          )}
        </div>
        {spark && spark.some((v) => v !== null) && <Sparkline values={spark} />}
      </div>

      {delta && <Delta {...delta} />}

      {note && (
        <div className="mt-2.5 text-[10px] md:text-[11px] uppercase tracking-widest text-text-secondary font-bold">
          {note}
        </div>
      )}
    </div>
  )
}

function Delta({
  value,
  format,
  period,
  higherIsBetter = true,
}: NonNullable<StatTileProps['delta']>) {
  const flat = Math.abs(value) < 1e-9
  const good = higherIsBetter ? value > 0 : value < 0
  const color = flat
    ? 'text-text-tertiary'
    : good
      ? 'text-semantic-good'
      : 'text-semantic-warn'
  const arrow = flat ? '→' : value > 0 ? '↑' : '↓'

  return (
    <div className="mt-2.5 flex items-baseline gap-1.5 text-[10px] md:text-[11px] uppercase tracking-widest font-bold">
      <span className={color}>
        <span aria-hidden>{arrow}</span> {format(Math.abs(value))}
      </span>
      {/* The period is always named — a bare arrow says nothing about what
          the number is being compared to. */}
      <span className="text-text-tertiary">{period}</span>
    </div>
  )
}

// Trend shape only: no axes, no labels, and deliberately no tooltip. The number
// beside it is the value; this is just the direction it came from.
export function Sparkline({
  values,
  width = 88,
  height = 30,
}: {
  values: (number | null)[]
  width?: number
  height?: number
}) {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length < 2) return null

  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : 0

  // Break the path at gaps instead of interpolating across days with no games.
  const segments: string[] = []
  let current: string[] = []
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
      return
    }
    const x = i * step
    const y = height - ((v - min) / range) * height
    current.push(`${current.length === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  })
  if (current.length > 1) segments.push(current.join(' '))

  const lastIndex = values.reduce<number>((acc, v, i) => (v !== null ? i : acc), -1)
  const lastValue = lastIndex >= 0 ? (values[lastIndex] as number) : 0

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--color-chart-muted)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {lastIndex >= 0 && (
        <circle
          cx={lastIndex * step}
          cy={height - ((lastValue - min) / range) * height}
          r={2.5}
          fill="var(--color-text-primary)"
        />
      )}
    </svg>
  )
}

/** Card wrapper for a row of tiles, divided like the rest of the app. */
export function StatTileRow({
  children,
  cols = 4,
}: {
  children: ReactNode
  cols?: 3 | 4
}) {
  const grid = cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'
  return (
    <div
      className={`bg-surface-card border border-border-default rounded-2xl grid grid-cols-2 ${grid} divide-x divide-y md:divide-y-0 divide-border-default`}
    >
      {children}
    </div>
  )
}
