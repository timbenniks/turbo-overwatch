import Link from 'next/link'

export type BarRow = {
  key: string
  label: string
  value: number
  valueLabel: string
  note?: string
  href?: string
  color?: string
}

// Ranked horizontal bars. A list of 5–8 named magnitudes needs no plotting
// library — a flex row with a filled div is the same chart with no JS.
export function BarRows({ rows }: { rows: BarRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <div className="space-y-3 md:space-y-4">
      {rows.map((r) => {
        const bar = (
          <div className="flex items-center gap-2 md:gap-4 text-[12px] md:text-[14px]">
            <span className="w-20 md:w-32 uppercase text-text-secondary truncate font-bold tracking-tight">
              {r.label}
            </span>
            <div className="flex-1 h-5 md:h-7 bg-surface-card-active rounded-md overflow-hidden">
              <div
                className="h-full rounded-md"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  background: r.color ?? 'var(--color-accent)',
                }}
              />
            </div>
            <span className="w-14 md:w-24 text-right font-black text-[13px] md:text-[16px] tabular-nums">
              {r.valueLabel}
            </span>
            {r.note && (
              <span className="hidden md:block w-20 text-right text-[11px] uppercase tracking-widest text-text-tertiary font-bold">
                {r.note}
              </span>
            )}
          </div>
        )

        return r.href ? (
          <Link key={r.key} href={r.href} prefetch className="block group">
            {bar}
          </Link>
        ) : (
          <div key={r.key}>{bar}</div>
        )
      })}
    </div>
  )
}
