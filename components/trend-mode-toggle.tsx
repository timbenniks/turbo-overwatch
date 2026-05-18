'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'
import type { TrendMode } from '@/lib/trend-mode'

const MODES: Array<{ key: TrendMode; label: string }> = [
  { key: 'cumulative', label: 'Career total' },
  { key: 'delta', label: 'Per day' },
]

export function TrendModeToggle({ current }: { current: TrendMode }) {
  const pathname = usePathname()
  const params = useSearchParams()

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Record<TrendMode, HTMLAnchorElement | null>>({
    cumulative: null,
    delta: null,
  })
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const active = itemRefs.current[current]
    if (!container || !active) return
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    setIndicator({ x: aRect.left - cRect.left, w: aRect.width })
  }, [current])

  function hrefFor(mode: TrendMode) {
    const p = new URLSearchParams(params.toString())
    if (mode === 'cumulative') p.delete('trend')
    else p.set('trend', mode)
    const qs = p.toString()
    return qs ? `${pathname}?${qs}#trends` : `${pathname}#trends`
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex rounded-full p-1 uppercase tracking-[0.15em] bg-surface-card border border-border-default"
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-text-primary transition-[transform,width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w, left: 0 }}
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
            scroll={false}
            className={`relative z-10 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] rounded-full transition-colors duration-300 font-bold ${
              active ? 'text-surface-canvas' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {m.label}
          </Link>
        )
      })}
    </div>
  )
}
