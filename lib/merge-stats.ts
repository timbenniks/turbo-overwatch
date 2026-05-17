import type {
  PlayerStatsSummary,
  StatsSummary,
  StatTotals,
} from '@/types/overfast'
import type { DeepCategory, DeepStat, PlayerStatsDeep } from '@/lib/overfast'

const EMPTY_TOTALS: StatTotals = {
  eliminations: 0,
  assists: 0,
  deaths: 0,
  damage: 0,
  healing: 0,
}

function emptyStatsSummary(): StatsSummary {
  return {
    games_played: 0,
    games_won: 0,
    games_lost: 0,
    time_played: 0,
    winrate: 0,
    kda: 0,
    total: { ...EMPTY_TOTALS },
    average: { ...EMPTY_TOTALS },
  }
}

function sumTotals(a: StatTotals, b: StatTotals): StatTotals {
  return {
    eliminations: a.eliminations + b.eliminations,
    assists: a.assists + b.assists,
    deaths: a.deaths + b.deaths,
    damage: a.damage + b.damage,
    healing: a.healing + b.healing,
  }
}

function recompute(s: StatsSummary): StatsSummary {
  const played = s.games_played
  const winrate = played > 0 ? (s.games_won / played) * 100 : 0
  const kda = s.total.deaths > 0
    ? (s.total.eliminations + s.total.assists) / s.total.deaths
    : s.total.eliminations + s.total.assists
  const tenMinUnits = s.time_played > 0 ? s.time_played / 600 : 0
  const average: StatTotals = tenMinUnits > 0
    ? {
        eliminations: s.total.eliminations / tenMinUnits,
        assists: s.total.assists / tenMinUnits,
        deaths: s.total.deaths / tenMinUnits,
        damage: s.total.damage / tenMinUnits,
        healing: s.total.healing / tenMinUnits,
      }
    : { ...EMPTY_TOTALS }
  return { ...s, winrate, kda, average }
}

function mergeStatsSummary(a: StatsSummary, b: StatsSummary): StatsSummary {
  const merged: StatsSummary = {
    games_played: a.games_played + b.games_played,
    games_won: a.games_won + b.games_won,
    games_lost: a.games_lost + b.games_lost,
    time_played: a.time_played + b.time_played,
    winrate: 0,
    kda: 0,
    total: sumTotals(a.total, b.total),
    average: { ...EMPTY_TOTALS },
  }
  return recompute(merged)
}

export function mergeSummary(
  a: PlayerStatsSummary | null,
  b: PlayerStatsSummary | null
): PlayerStatsSummary | null {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a

  const heroKeys = new Set([...Object.keys(a.heroes), ...Object.keys(b.heroes)])
  const heroes: Record<string, StatsSummary> = {}
  for (const k of heroKeys) {
    heroes[k] = mergeStatsSummary(
      a.heroes[k] ?? emptyStatsSummary(),
      b.heroes[k] ?? emptyStatsSummary()
    )
  }

  return {
    general: mergeStatsSummary(
      a.general ?? emptyStatsSummary(),
      b.general ?? emptyStatsSummary()
    ),
    roles: {
      tank: mergeStatsSummary(
        a.roles?.tank ?? emptyStatsSummary(),
        b.roles?.tank ?? emptyStatsSummary()
      ),
      damage: mergeStatsSummary(
        a.roles?.damage ?? emptyStatsSummary(),
        b.roles?.damage ?? emptyStatsSummary()
      ),
      support: mergeStatsSummary(
        a.roles?.support ?? emptyStatsSummary(),
        b.roles?.support ?? emptyStatsSummary()
      ),
    },
    heroes,
  }
}

// ---------- Deep stat merge ----------

const MAX_SUFFIXES = ['_most_in_game', '_most_in_life', '_best_in_game', '_best']
const AVG_SUFFIXES = ['_avg_per_10_min']
const ACCURACY_SUFFIXES = ['_accuracy', '_scoped_accuracy', '_critical_hit_accuracy']

function isMaxKey(key: string): boolean {
  return MAX_SUFFIXES.some((s) => key.endsWith(s))
}
function isAvgKey(key: string): boolean {
  return AVG_SUFFIXES.some((s) => key.endsWith(s))
}
function isAccuracyKey(key: string): boolean {
  return ACCURACY_SUFFIXES.some((s) => key.endsWith(s))
}

type WeightedStat = {
  key: string
  label: string
  value: string | number
}

function mergeStatValues(
  a: DeepStat | undefined,
  b: DeepStat | undefined,
  weightA: number,
  weightB: number
): WeightedStat | null {
  const present = a ?? b
  if (!present) return null
  if (!a) return { key: present.key, label: present.label, value: present.value }
  if (!b) return { key: a.key, label: a.label, value: a.value }

  // Non-numeric → prefer first non-empty
  if (typeof a.value !== 'number' || typeof b.value !== 'number') {
    return {
      key: a.key,
      label: a.label,
      value: a.value !== '' && a.value != null ? a.value : b.value,
    }
  }

  if (isMaxKey(a.key)) {
    return { key: a.key, label: a.label, value: Math.max(a.value, b.value) }
  }

  if (isAvgKey(a.key) || isAccuracyKey(a.key)) {
    const totalWeight = weightA + weightB
    if (totalWeight === 0) {
      return { key: a.key, label: a.label, value: (a.value + b.value) / 2 }
    }
    const weighted = (a.value * weightA + b.value * weightB) / totalWeight
    return { key: a.key, label: a.label, value: weighted }
  }

  // Default: sum
  return { key: a.key, label: a.label, value: a.value + b.value }
}

function mergeCategories(
  a: DeepCategory[],
  b: DeepCategory[],
  weightA: number,
  weightB: number
): DeepCategory[] {
  const catNames = new Set([
    ...a.map((c) => c.category),
    ...b.map((c) => c.category),
  ])
  const merged: DeepCategory[] = []
  for (const cat of catNames) {
    const ca = a.find((c) => c.category === cat)
    const cb = b.find((c) => c.category === cat)
    const keys = new Set([
      ...(ca?.stats.map((s) => s.key) ?? []),
      ...(cb?.stats.map((s) => s.key) ?? []),
    ])
    const stats: DeepStat[] = []
    for (const key of keys) {
      const sa = ca?.stats.find((s) => s.key === key)
      const sb = cb?.stats.find((s) => s.key === key)
      const m = mergeStatValues(sa, sb, weightA, weightB)
      if (m) stats.push(m)
    }
    const label = ca?.label ?? cb?.label ?? cat
    merged.push({ category: (ca?.category ?? cb?.category)!, label, stats })
  }
  return merged
}

export function mergeDeep(
  a: { deep: PlayerStatsDeep | null; timePlayed: number },
  b: { deep: PlayerStatsDeep | null; timePlayed: number }
): PlayerStatsDeep | null {
  if (!a.deep && !b.deep) return null
  if (!a.deep) return b.deep
  if (!b.deep) return a.deep

  const heroKeys = new Set([...Object.keys(a.deep), ...Object.keys(b.deep)])
  const out: PlayerStatsDeep = {}
  for (const hk of heroKeys) {
    const ca = a.deep[hk] ?? []
    const cb = b.deep[hk] ?? []
    out[hk] = mergeCategories(ca, cb, a.timePlayed, b.timePlayed)
  }
  return out
}
