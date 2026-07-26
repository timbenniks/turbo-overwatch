import Link from 'next/link'
import { homeHref, type ViewMode } from '@/lib/view-mode'

/**
 * The only way back from a hero page other than the header logo. Keeps the
 * current mode, so returning to the dashboard doesn't silently switch you from
 * Competitive to All.
 */
export function Breadcrumb({ heroName, view }: { heroName: string; view: ViewMode }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="absolute top-6 left-4 md:top-8 md:left-16 z-10 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-bold"
    >
      <Link
        href={homeHref(view)}
        className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full press-tactile"
      >
        <span aria-hidden>←</span>
        Roster
      </Link>
      {/* Announced for screen readers; visually the hero name is already the
          page's giant heading right below. */}
      <span className="sr-only">, current page: {heroName}</span>
    </nav>
  )
}
