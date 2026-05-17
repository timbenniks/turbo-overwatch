'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PrefetchHeroes({ heroKeys }: { heroKeys: string[] }) {
  const router = useRouter()

  useEffect(() => {
    if (heroKeys.length === 0) return

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }

    const schedule = win.requestIdleCallback
      ? (cb: () => void) => win.requestIdleCallback!(cb, { timeout: 2000 })
      : (cb: () => void) => window.setTimeout(cb, 200)

    const cancel = win.cancelIdleCallback
      ? (h: number) => win.cancelIdleCallback!(h)
      : (h: number) => window.clearTimeout(h)

    const handles: number[] = heroKeys.map((key) =>
      schedule(() => router.prefetch(`/hero/${key}`)),
    )

    return () => handles.forEach(cancel)
  }, [heroKeys, router])

  return null
}
