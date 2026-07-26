// Smoothing + aggregation for the daily snapshot series.
//
// Why this exists: 39 of 69 day-gaps in data/history.json have zero games
// played, and an active day is often 1–3 games. A raw per-day winrate therefore
// swings 0%↔100% on noise. Rolling and weekly views are the honest reads.

/**
 * Rate over a trailing window, computed as sum(numerator) / sum(denominator) —
 * NOT the mean of daily rates, which would weight a 1-game day the same as a
 * 12-game day. Returns null for windows with no denominator (no games played),
 * so charts can render a gap instead of a fake zero.
 */
export function rollingRate(
  numerators: number[],
  denominators: number[],
  window: number
): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < numerators.length; i++) {
    const from = Math.max(0, i - window + 1)
    let num = 0
    let den = 0
    for (let j = from; j <= i; j++) {
      num += numerators[j] ?? 0
      den += denominators[j] ?? 0
    }
    out.push(den > 0 ? num / den : null)
  }
  return out
}

/**
 * Mean over a trailing window, skipping nulls. Used where there is no
 * denominator to weight by (e.g. a KDA already averaged per day).
 */
export function rollingMean(values: (number | null)[], window: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < values.length; i++) {
    const from = Math.max(0, i - window + 1)
    let sum = 0
    let n = 0
    for (let j = from; j <= i; j++) {
      const v = values[j]
      if (v === null || v === undefined || !Number.isFinite(v)) continue
      sum += v
      n++
    }
    out.push(n > 0 ? sum / n : null)
  }
  return out
}

/**
 * Monday-start week key for an ISO `YYYY-MM-DD` date.
 */
export function weekStart(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const dow = d.getUTCDay() // 0 = Sunday
  const backToMonday = dow === 0 ? 6 : dow - 1
  d.setUTCDate(d.getUTCDate() - backToMonday)
  return d.toISOString().slice(0, 10)
}

/**
 * Group daily points into Monday-start weeks, preserving input order. Callers
 * sum the members themselves — totals must be summed *before* deriving a rate.
 */
export function weekBuckets<T extends { date: string }>(
  points: T[]
): { week: string; points: T[] }[] {
  const out: { week: string; points: T[] }[] = []
  for (const p of points) {
    const week = weekStart(p.date)
    const last = out[out.length - 1]
    if (last && last.week === week) last.points.push(p)
    else out.push({ week, points: [p] })
  }
  return out
}
