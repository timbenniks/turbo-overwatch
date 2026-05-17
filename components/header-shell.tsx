'use client'

import { useEffect, useState } from 'react'

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out ${
        scrolled
          ? 'bg-surface-canvas/85 backdrop-blur-xl border-border-default'
          : 'bg-surface-canvas/40 backdrop-blur-md border-transparent'
      }`}
    >
      {children}
    </header>
  )
}
