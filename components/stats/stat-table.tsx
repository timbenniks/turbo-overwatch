import { Disclosure } from '@/components/disclosure'

export type StatRow = {
  label: string
  value: string
  /** The derived figure that gives the total meaning — "12.5 / match", "463 / 10m". */
  secondary?: string
}

export type StatGroup = {
  label: string
  rows: StatRow[]
}

/**
 * The long tail of numbers, collapsed behind a native <details> so it costs no
 * JavaScript and stays keyboard- and search-accessible. The count goes in the
 * summary so nothing is silently hidden.
 */
export function StatTable({
  summary,
  groups,
  secondaryHeading,
  defaultOpen = false,
}: {
  summary: string
  groups: StatGroup[]
  secondaryHeading?: string
  /** Open on load where the table is the point of the section, not its long tail. */
  defaultOpen?: boolean
}) {
  const total = groups.reduce((a, g) => a + g.rows.length, 0)
  if (total === 0) return null

  return (
    <Disclosure summary={summary} badge={total} defaultOpen={defaultOpen}>
      <div className="space-y-5">
        {groups
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <div key={g.label}>
              <div className="flex items-baseline justify-between gap-4 pb-1.5 border-b border-border-default">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">
                  {g.label}
                </span>
                {/* Only where the group actually has a secondary column —
                    games-per-match is meaningless, so that group has none. */}
                {secondaryHeading && g.rows.some((r) => r.secondary) && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold w-24 md:w-32 text-right shrink-0">
                    {secondaryHeading}
                  </span>
                )}
              </div>
              <div className="divide-y divide-border-default">
                {g.rows.map((r) => (
                  <div key={r.label} className="flex items-baseline gap-3 py-2">
                    <span className="text-[12px] md:text-[13px] uppercase tracking-wide text-text-secondary font-bold truncate">
                      {r.label}
                    </span>
                    <span className="flex-1 border-b border-dotted border-border-default translate-y-[-3px]" />
                    {/* tabular-nums here: these are columns that must align. */}
                    <span className="text-[13px] md:text-[15px] font-black tabular-nums shrink-0">
                      {r.value}
                    </span>
                    <span className="w-16 md:w-28 text-right text-[11px] md:text-[12px] uppercase tracking-widest text-text-tertiary font-bold tabular-nums shrink-0">
                      {r.secondary ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </Disclosure>
  )
}
