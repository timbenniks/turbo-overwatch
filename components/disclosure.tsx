import type { ReactNode } from 'react'

/**
 * Native <details> in the app's chrome: no JavaScript, keyboard accessible, and
 * findable by in-page search. Shared so the stat tables and the story chapters
 * can't drift apart.
 */
export function Disclosure({
  summary,
  /** Shown next to the label, e.g. a row count — never hide how much is inside. */
  badge,
  defaultOpen = false,
  children,
}: {
  summary: string
  badge?: string | number
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group bg-surface-card border border-border-default rounded-2xl"
    >
      <summary className="flex items-center gap-2 p-4 md:p-5 cursor-pointer list-none text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-bold text-text-secondary hover:text-text-primary transition-colors">
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 group-open:rotate-90"
        >
          ▸
        </span>
        {summary}
        {badge !== undefined && <span className="text-text-tertiary">({badge})</span>}
      </summary>

      <div className="px-4 md:px-5 pb-4 md:pb-5">{children}</div>
    </details>
  )
}
