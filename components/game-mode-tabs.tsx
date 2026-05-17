'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { ViewMode } from '@/lib/view-mode'

const MODES: Array<{ key: ViewMode; label: string; short: string }> = [
  { key: 'all', label: 'All', short: 'All' },
  { key: 'quickplay', label: 'Quickplay', short: 'QP' },
  { key: 'competitive', label: 'Competitive', short: 'Ranked' },
]

export function GameModeTabs({
  current,
  basePath,
  variant = 'light',
  size = 'md',
}: {
  current: ViewMode
  basePath?: string
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md'
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const target = basePath ?? pathname

  function hrefFor(mode: ViewMode) {
    const p = new URLSearchParams(params.toString())
    if (mode === 'all') p.delete('mode')
    else p.set('mode', mode)
    const qs = p.toString()
    return qs ? `${target}?${qs}` : target
  }

  const containerCls =
    variant === 'dark'
      ? 'bg-black/40 backdrop-blur-sm'
      : 'bg-surface-card border border-border-default'
  const activeCls =
    variant === 'dark'
      ? 'bg-white/90 text-text-primary'
      : 'bg-text-primary text-surface-canvas'
  const inactiveCls =
    variant === 'dark'
      ? 'text-white/80 hover:text-white'
      : 'text-text-tertiary hover:text-text-secondary'
  const sizing = size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-3 md:px-4 py-1.5 text-[10px] md:text-[11px]'

  return (
    <div
      className={`inline-flex rounded-full p-1 uppercase tracking-[0.15em] ${containerCls}`}
    >
      {MODES.map((m) => (
        <Link
          key={m.key}
          href={hrefFor(m.key)}
          className={`${sizing} rounded-full transition-colors ${
            current === m.key ? activeCls : inactiveCls
          }`}
        >
          {size === 'sm' ? (
            m.short
          ) : (
            <>
              <span className="md:hidden">{m.short}</span>
              <span className="hidden md:inline">{m.label}</span>
            </>
          )}
        </Link>
      ))}
    </div>
  )
}
