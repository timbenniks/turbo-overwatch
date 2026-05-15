'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Gamemode } from '@/types/overfast'

const MODES: Array<{ key: Gamemode; label: string; short: string }> = [
  { key: 'quickplay', label: 'Quickplay', short: 'QP' },
  { key: 'competitive', label: 'Competitive', short: 'CP' },
]

export function GameModeTabs({
  current,
  basePath,
  variant = 'light',
  size = 'md',
}: {
  current: Gamemode
  basePath?: string
  variant?: 'light' | 'dark'
  size?: 'sm' | 'md'
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const target = basePath ?? pathname

  function hrefFor(mode: Gamemode) {
    const p = new URLSearchParams(params.toString())
    if (mode === 'quickplay') p.delete('mode')
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
  const sizing = size === 'sm' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-[11px]'

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
          {size === 'sm' ? m.short : m.label}
        </Link>
      ))}
    </div>
  )
}
