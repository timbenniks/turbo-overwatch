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

/**
 * Link to a hero while keeping the current mode. Without this, browsing in
 * Competitive and clicking a hero silently drops you back into All — the stats
 * change under you with no indication why.
 */
export function heroHref(heroKey: string, mode: ViewMode): string {
  return mode === 'all' ? `/hero/${heroKey}` : `/hero/${heroKey}?mode=${mode}`
}

/** The inverse: back to the dashboard in the mode you were reading. */
export function homeHref(mode: ViewMode): string {
  return mode === 'all' ? '/' : `/?mode=${mode}`
}

export function gamemodesFor(mode: ViewMode): Gamemode[] {
  if (mode === 'all') return ['quickplay', 'competitive']
  return [mode]
}
