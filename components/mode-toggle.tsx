'use client'

import { useSearchParams } from 'next/navigation'
import { GameModeTabs } from '@/components/game-mode-tabs'
import { parseViewMode } from '@/lib/view-mode'

export function ModeToggle() {
  const params = useSearchParams()
  const view = parseViewMode(params.get('mode'))
  return <GameModeTabs current={view} size="md" />
}
