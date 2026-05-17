'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
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

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<ViewMode, HTMLAnchorElement | null>>({
    all: null,
    quickplay: null,
    competitive: null,
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
  const indicatorCls =
    variant === 'dark' ? 'bg-white/90' : 'bg-text-primary'
  const activeText =
    variant === 'dark' ? 'text-text-primary' : 'text-surface-canvas'
  const inactiveText =
    variant === 'dark'
      ? 'text-white/80 hover:text-white'
      : 'text-text-tertiary hover:text-text-secondary'
  const sizing =
    size === 'sm'
      ? 'px-3 py-1 text-[10px]'
      : 'px-3 md:px-4 py-1.5 text-[10px] md:text-[11px]'

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex rounded-full p-1 uppercase tracking-[0.15em] ${containerCls}`}
    >
      {indicator && (
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 rounded-full ${indicatorCls} transition-[transform,width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform`}
          style={{
            transform: `translateX(${indicator.x}px)`,
            width: indicator.w,
            left: 0,
          }}
        />
      )}
      {MODES.map((m) => {
        const active = current === m.key
        return (
          <Link
            key={m.key}
            ref={(el) => {
              itemRefs.current[m.key] = el
            }}
            href={hrefFor(m.key)}
            className={`relative z-10 ${sizing} rounded-full transition-colors duration-300 ${
              active ? activeText : inactiveText
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
        )
      })}
    </div>
  )
}
