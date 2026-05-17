import type { Gamemode } from '@/types/overfast'

export type ViewMode = 'all' | 'quickplay' | 'competitive'

export const VIEW_MODES: ViewMode[] = ['all', 'quickplay', 'competitive']

export function parseViewMode(value: string | undefined | null): ViewMode {
  if (value === 'quickplay' || value === 'competitive') return value
  return 'all'
}

export function viewModeLabel(mode: ViewMode): string {
  if (mode === 'all') return 'all modes'
  if (mode === 'competitive') return 'competitive'
  return 'quick play'
}

export function gamemodesFor(mode: ViewMode): Gamemode[] {
  if (mode === 'all') return ['quickplay', 'competitive']
  return [mode]
}
