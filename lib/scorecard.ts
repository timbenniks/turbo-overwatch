// Window aggregation for the "Form" scorecard.
//
// Every rate here sums its numerator and denominator across the window before
// dividing. Averaging daily rates instead would let a one-game day outvote a
// twelve-game day — the same trap rollingRate avoids in lib/rolling.ts.

export type WindowInput = {
  games_played: number
  wins: number
  time_played: number
  eliminations: number
  assists: number
  deaths: number
  damage: number
}

export type WindowTotals = {
  games: number
  wins: number
  time: number
  eliminations: number
  assists: number
  deaths: number
  damage: number
}

export type MetricKey = 'winrate' | 'kda' | 'elimsPer10' | 'damagePer10'

export function sumWindow(days: WindowInput[]): WindowTotals {
  return days.reduce<WindowTotals>(
    (a, d) => ({
      games: a.games + d.games_played,
      wins: a.wins + d.wins,
      time: a.time + d.time_played,
      eliminations: a.eliminations + d.eliminations,
      assists: a.assists + d.assists,
      deaths: a.deaths + d.deaths,
      damage: a.damage + d.damage,
    }),
    { games: 0, wins: 0, time: 0, eliminations: 0, assists: 0, deaths: 0, damage: 0 }
  )
}

// null, never 0, when the window has nothing to divide by — a window with no
// games has no winrate, and rendering it as 0% would be a lie.
export function metric(totals: WindowTotals, key: MetricKey): number | null {
  switch (key) {
    case 'winrate':
      return totals.games > 0 ? (totals.wins / totals.games) * 100 : null
    case 'kda':
      if (totals.games === 0) return null
      return totals.deaths > 0
        ? (totals.eliminations + totals.assists) / totals.deaths
        : totals.eliminations + totals.assists
    case 'elimsPer10':
      return totals.time > 0 ? totals.eliminations / (totals.time / 600) : null
    case 'damagePer10':
      return totals.time > 0 ? totals.damage / (totals.time / 600) : null
  }
}

/**
 * Split a chronological series into the trailing `days` and the `days` before
 * it. Fewer points than a full pair of windows just yields shorter windows.
 */
export function splitWindows<T>(series: T[], days: number): { recent: T[]; previous: T[] } {
  // Clamp the cut point: a negative end index would count back from the end and
  // hand the same days to both windows.
  const cut = Math.max(0, series.length - days)
  return {
    recent: series.slice(cut),
    previous: series.slice(Math.max(0, cut - days), cut),
  }
}

export type Metric = {
  key: MetricKey
  recent: number | null
  previous: number | null
  delta: number | null
  spark: (number | null)[]
}

export function buildMetric(
  key: MetricKey,
  recent: WindowInput[],
  previous: WindowInput[],
  spark: (number | null)[]
): Metric {
  const r = metric(sumWindow(recent), key)
  const p = metric(sumWindow(previous), key)
  return {
    key,
    recent: r,
    previous: p,
    delta: r !== null && p !== null ? r - p : null,
    spark,
  }
}
