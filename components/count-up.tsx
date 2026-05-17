'use client'

import { useEffect, useRef, useState } from 'react'

export function CountUp({
  value,
  decimals = 0,
  duration = 1100,
  suffix = '',
  prefix = '',
}: {
  value: number
  decimals?: number
  duration?: number
  suffix?: string
  prefix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(value)
      return
    }
    const el = ref.current
    if (!el) return

    let raf = 0
    let started = false

    const start = () => {
      if (started) return
      started = true
      const begin = performance.now()
      const from = 0
      const to = value
      const tick = (now: number) => {
        const t = Math.min(1, (now - begin) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(from + (to - from) * eased)
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            start()
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
