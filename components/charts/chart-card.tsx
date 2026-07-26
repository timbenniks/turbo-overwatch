import type { ReactNode } from 'react'

export type LegendItem = { label: string; color: string }

export function ChartCard({
  title,
  subtitle,
  legend,
  footnote,
  className,
  children,
}: {
  title: string
  subtitle: string
  legend?: LegendItem[]
  footnote?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`bg-surface-card border border-border-default rounded-2xl p-4 md:p-6 flex flex-col ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 mb-4 md:mb-5">
        <div>
          <div className="text-[11px] md:text-[12px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
            {subtitle}
          </div>
          <div className="text-[18px] md:text-[22px] uppercase font-black tracking-tight leading-none mt-1">
            {title}
          </div>
        </div>
        {/* A legend is always present for 2+ series, so identity is never
            carried by color alone. */}
        {legend && legend.length > 1 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {legend.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-secondary font-bold"
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1">{children}</div>

      {footnote && (
        <p className="mt-4 text-[10px] md:text-[11px] uppercase tracking-widest text-text-tertiary font-bold">
          {footnote}
        </p>
      )}
    </div>
  )
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-center">
      <p className="text-text-tertiary uppercase tracking-widest text-[11px] font-bold max-w-70">
        {message}
      </p>
    </div>
  )
}
