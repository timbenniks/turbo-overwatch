import type { Role } from '@/types/overfast'

export type HeroTheme = {
  primary: string
  accent: string
  gradient: [string, string, string, string]
}

const themes: Record<string, HeroTheme> = {
  default: {
    primary: '#52525b',
    accent: '#a1a1aa',
    gradient: ['#e4e4e7', '#a1a1aa', '#52525b', '#27272a'],
  },

  // Damage
  genji: {
    primary: '#4d7c0f',
    accent: '#a3e635',
    gradient: ['#d4f0a8', '#a8d676', '#6ba832', '#3d6e0f'],
  },
  tracer: {
    primary: '#c2410c',
    accent: '#fdba74',
    gradient: ['#ffedd5', '#fed7aa', '#f97316', '#c2410c'],
  },
  'soldier-76': {
    primary: '#1d4ed8',
    accent: '#fbbf24',
    gradient: ['#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
  },
  widowmaker: {
    primary: '#6d28d9',
    accent: '#c4b5fd',
    gradient: ['#ede9fe', '#c4b5fd', '#7c3aed', '#4c1d95'],
  },
  hanzo: {
    primary: '#a16207',
    accent: '#fde68a',
    gradient: ['#fef3c7', '#fcd34d', '#d97706', '#78350f'],
  },
  mei: {
    primary: '#0e7490',
    accent: '#a5f3fc',
    gradient: ['#ecfeff', '#a5f3fc', '#22d3ee', '#0e7490'],
  },
  pharah: {
    primary: '#1d4ed8',
    accent: '#fb923c',
    gradient: ['#dbeafe', '#93c5fd', '#2563eb', '#1e3a8a'],
  },
  ashe: {
    primary: '#374151',
    accent: '#dc2626',
    gradient: ['#f3f4f6', '#9ca3af', '#4b5563', '#1f2937'],
  },
  sojourn: {
    primary: '#b91c1c',
    accent: '#fca5a5',
    gradient: ['#fee2e2', '#fca5a5', '#ef4444', '#7f1d1d'],
  },
  cassidy: {
    primary: '#92400e',
    accent: '#fcd34d',
    gradient: ['#fef3c7', '#fcd34d', '#b45309', '#78350f'],
  },
  echo: {
    primary: '#a16207',
    accent: '#fef08a',
    gradient: ['#fef9c3', '#fde047', '#eab308', '#854d0e'],
  },

  // Tank
  reinhardt: {
    primary: '#1e3a8a',
    accent: '#fbbf24',
    gradient: ['#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
  },
  dva: {
    primary: '#0369a1',
    accent: '#f9a8d4',
    gradient: ['#dbeafe', '#bae6fd', '#7dd3fc', '#0369a1'],
  },
  zarya: {
    primary: '#be185d',
    accent: '#f9a8d4',
    gradient: ['#fce7f3', '#f9a8d4', '#ec4899', '#9d174d'],
  },
  winston: {
    primary: '#1e40af',
    accent: '#fef08a',
    gradient: ['#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
  },
  sigma: {
    primary: '#4c1d95',
    accent: '#a78bfa',
    gradient: ['#ede9fe', '#c4b5fd', '#8b5cf6', '#4c1d95'],
  },
  'junker-queen': {
    primary: '#a16207',
    accent: '#fde047',
    gradient: ['#fef3c7', '#fcd34d', '#d97706', '#713f12'],
  },
  ramattra: {
    primary: '#5b21b6',
    accent: '#67e8f9',
    gradient: ['#cffafe', '#67e8f9', '#7c3aed', '#4c1d95'],
  },
  doomfist: {
    primary: '#9a3412',
    accent: '#fb923c',
    gradient: ['#ffedd5', '#fdba74', '#ea580c', '#7c2d12'],
  },
  orisa: {
    primary: '#a16207',
    accent: '#fde68a',
    gradient: ['#fef3c7', '#fcd34d', '#ca8a04', '#713f12'],
  },

  // Support
  ana: {
    primary: '#78350f',
    accent: '#fde68a',
    gradient: ['#fef3c7', '#fcd34d', '#b45309', '#78350f'],
  },
  baptiste: {
    primary: '#0e7490',
    accent: '#67e8f9',
    gradient: ['#cffafe', '#67e8f9', '#0891b2', '#155e75'],
  },
  mercy: {
    primary: '#a16207',
    accent: '#fef3c7',
    gradient: ['#fefce8', '#fef08a', '#eab308', '#854d0e'],
  },
  moira: {
    primary: '#6d28d9',
    accent: '#fcd34d',
    gradient: ['#ede9fe', '#c4b5fd', '#7c3aed', '#3b0764'],
  },
  lucio: {
    primary: '#15803d',
    accent: '#86efac',
    gradient: ['#dcfce7', '#86efac', '#22c55e', '#14532d'],
  },
  kiriko: {
    primary: '#b91c1c',
    accent: '#fca5a5',
    gradient: ['#fee2e2', '#fca5a5', '#dc2626', '#7f1d1d'],
  },
  illari: {
    primary: '#b45309',
    accent: '#fde047',
    gradient: ['#fef9c3', '#fde047', '#eab308', '#78350f'],
  },
  zenyatta: {
    primary: '#a16207',
    accent: '#fde68a',
    gradient: ['#fef9c3', '#fde047', '#eab308', '#713f12'],
  },
  lifeweaver: {
    primary: '#be185d',
    accent: '#f9a8d4',
    gradient: ['#fce7f3', '#f9a8d4', '#ec4899', '#831843'],
  },
  juno: {
    primary: '#0369a1',
    accent: '#fbcfe8',
    gradient: ['#e0f2fe', '#bae6fd', '#0ea5e9', '#0c4a6e'],
  },
}

const roleFallback: Record<Role, HeroTheme> = {
  tank: {
    primary: '#c2410c',
    accent: '#fdba74',
    gradient: ['#fff7ed', '#fed7aa', '#f97316', '#9a3412'],
  },
  damage: {
    primary: '#b91c1c',
    accent: '#fca5a5',
    gradient: ['#fef2f2', '#fecaca', '#ef4444', '#7f1d1d'],
  },
  support: {
    primary: '#4d7c0f',
    accent: '#bef264',
    gradient: ['#f7fee7', '#d9f99d', '#84cc16', '#365314'],
  },
}

export function getHeroTheme(key: string, role?: Role): HeroTheme {
  if (themes[key]) return themes[key]
  if (role) return roleFallback[role]
  return themes.default
}
