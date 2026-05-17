import type { Role } from './overfast'

export type HistoryGeneral = {
  time_played: number
  games_played: number
  games_won: number
  winrate: number
  kda: number
  eliminations: number
  assists: number
  deaths: number
  damage: number
  healing: number
}

export type HistoryRoleStat = {
  time_played: number
  games_played: number
  winrate: number
  kda: number
}

export type HistoryHeroStat = {
  time_played: number
  games_played: number
  winrate: number
  kda: number
}

export type HistoryRank = {
  division: string
  tier: number
} | null

export type HistoryModeSnapshot = {
  general: HistoryGeneral
  roles: Record<Role, HistoryRoleStat>
  heroes: Record<string, HistoryHeroStat>
  ranks?: {
    tank: HistoryRank
    damage: HistoryRank
    support: HistoryRank
  }
}

export type DailySnapshot = {
  date: string
  capturedAt: string
  quickplay: HistoryModeSnapshot | null
  competitive: HistoryModeSnapshot | null
}

export type History = {
  v: 1
  playerId: string
  snapshots: DailySnapshot[]
}
