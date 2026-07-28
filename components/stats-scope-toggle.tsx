'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import type { StatsScope } from '@/lib/view-mode'

const SCOPES: Array<{ key: StatsScope; label: string }> = [
  { key: 'mine', label: 'Mine' },
  { key: 'global', label: 'Global' },
]

export function StatsScopeToggle({
  current,
  size = 'md',
}: {
  current: StatsScope
  size?: 'sm' | 'md'
}) {
  const pathname = usePathname()
  const params = useSearchParams()

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<StatsScope, HTMLAnchorElement | null>>({
    mine: null,
    global: null,
  })
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const active = itemRefs.current[current]
    if (!container || !active) return
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    setIndicator({ x: aRect.left - cRect.left, w: aRect.width })
  }, [current, size])

  function hrefFor(scope: StatsScope) {
    const p = new URLSearchParams(params.toString())
    if (scope === 'mine') p.delete('stats')
    else p.set('stats', scope)
    const qs = p.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const sizing =
    size === 'sm'
      ? 'px-3 py-1 text-[10px]'
      : 'px-3 md:px-4 py-1.5 text-[10px] md:text-[11px]'

  return (
    <div
      ref={containerRef}
      className="relative inline-flex rounded-full p-1 uppercase tracking-[0.15em] bg-surface-card border border-border-default"
      role="tablist"
      aria-label="Stats scope"
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-text-primary transition-[transform,width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{
            transform: `translateX(${indicator.x}px)`,
            width: indicator.w,
            left: 0,
          }}
        />
      )}
      {SCOPES.map((s) => {
        const active = current === s.key
        return (
          <Link
            key={s.key}
            ref={(el) => {
              itemRefs.current[s.key] = el
            }}
            href={hrefFor(s.key)}
            role="tab"
            aria-selected={active}
            className={`relative z-10 ${sizing} rounded-full transition-colors duration-300 ${
              active
                ? 'text-surface-canvas'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {s.label}
          </Link>
        )
      })}
    </div>
  )
}
