'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLayoutEffect, useRef, useState } from 'react'

export type SegmentedItem<T extends string> = { key: T; label: string }

// Segmented control backed by a search param, with a sliding active indicator.
// Generalised out of the old TrendModeToggle so the range filter reuses it.
export function SegmentedNav<T extends string>({
  items,
  current,
  param,
  defaultKey,
  hash,
  label,
}: {
  items: SegmentedItem<T>[]
  current: T
  param: string
  /** Omitted from the URL when selected, keeping the default link clean. */
  defaultKey: T
  hash?: string
  label: string
}) {
  const pathname = usePathname()
  const params = useSearchParams()

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<T, HTMLAnchorElement | null>>(new Map())
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const active = itemRefs.current.get(current)
    if (!container || !active) return
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    setIndicator({ x: aRect.left - cRect.left, w: aRect.width })
  }, [current, items])

  function hrefFor(key: T) {
    const p = new URLSearchParams(params.toString())
    if (key === defaultKey) p.delete(param)
    else p.set(param, key)
    const qs = p.toString()
    const suffix = hash ? `#${hash}` : ''
    return qs ? `${pathname}?${qs}${suffix}` : `${pathname}${suffix}`
  }

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={label}
      className="relative inline-flex rounded-full p-1 uppercase tracking-[0.15em] bg-surface-card border border-border-default"
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full transition-[transform,width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{
            transform: `translateX(${indicator.x}px)`,
            width: indicator.w,
            left: 0,
            background: 'var(--color-accent)',
          }}
        />
      )}
      {items.map((m) => {
        const active = current === m.key
        return (
          <Link
            key={m.key}
            ref={(el) => {
              itemRefs.current.set(m.key, el)
            }}
            href={hrefFor(m.key)}
            scroll={false}
            aria-current={active ? 'true' : undefined}
            className={`relative z-10 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] rounded-full transition-colors duration-300 font-bold ${
              active ? 'text-[var(--color-accent-ink)]' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {m.label}
          </Link>
        )
      })}
    </div>
  )
}
