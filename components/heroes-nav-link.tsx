'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { heroesHref, parseViewMode } from '@/lib/view-mode'

export function HeroesNavLink() {
  const pathname = usePathname()
  const params = useSearchParams()
  const view = parseViewMode(params.get('mode'))
  const active = pathname === '/heroes' || pathname.startsWith('/heroes/')

  return (
    <Link
      href={heroesHref(view)}
      className={`text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold transition-colors ${
        active
          ? 'text-text-primary'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      Heroes
    </Link>
  )
}
