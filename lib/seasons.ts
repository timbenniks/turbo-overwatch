// Season segmentation of the snapshot history.
//
// OverFast has no per-season stats endpoint — /players/{id}/stats/summary takes
// only gamemode and platform — so competitive career stats are lifetime and
// cannot be split by season after the fact. The season number on the summary is
// the only per-season datum, which is why the snapshot records it: the boundary
// is knowable only from the day it moved.
//
// Overwatch 2 seasons run roughly nine weeks and start with a soft rank reset
// that places you one to two divisions below where you finished. A boundary is
// therefore a genuine discontinuity, not a climb or a fall, and nothing should
// draw a continuous line across one.

export type SeasonSnapshot = { date: string; season?: number | null }

export type SeasonSegment = {
  season: number
  /** First snapshot date observed in this season. */
  from: string
  /** Last snapshot date observed in this season. */
  to: string
  days: number
  /** False when the season was already underway before tracking began, so
   *  "since" is the start of tracking rather than the real season start. */
  startObserved: boolean
}

/**
 * Group consecutive snapshots into season segments. Snapshots with no season
 * (taken before it was recorded, or with no competitive data) attach to the
 * following season as unknown-start padding rather than forming a segment.
 */
export function seasonSegments(snapshots: SeasonSnapshot[]): SeasonSegment[] {
  const out: SeasonSegment[] = []
  let pendingUnknown = 0

  for (const snap of snapshots) {
    const season = typeof snap.season === 'number' ? snap.season : null
    if (season === null) {
      pendingUnknown++
      continue
    }
    const last = out[out.length - 1]
    if (last && last.season === season) {
      last.to = snap.date
      last.days++
      continue
    }
    out.push({
      season,
      from: snap.date,
      to: snap.date,
      days: 1,
      // If unrecorded days precede the first sighting of this season, we can't
      // claim to have seen the season begin.
      startObserved: out.length > 0 && pendingUnknown === 0,
    })
    pendingUnknown = 0
  }

  return out
}

/**
 * The dates on which the season number changed — i.e. the first day of each
 * season after the first observed one. These are the only honest places to
 * break a rank line.
 */
export function seasonBoundaries(snapshots: SeasonSnapshot[]): string[] {
  return seasonSegments(snapshots)
    .slice(1)
    .map((s) => s.from)
}

/**
 * Map each date to a segment index that advances only on an observed boundary.
 * Charts use this to draw one line per segment: a break appears exactly where a
 * season change was recorded, and nowhere else. Dates from before seasons were
 * recorded stay joined to the run that follows them, because a break there
 * would assert a rollover nobody saw.
 */
export function segmentIndices(dates: string[], boundaries: string[]): number[] {
  const set = new Set(boundaries)
  let segment = 0
  return dates.map((date) => {
    if (set.has(date)) segment++
    return segment
  })
}

export function currentSeason(snapshots: SeasonSnapshot[]): SeasonSegment | null {
  const segments = seasonSegments(snapshots)
  return segments[segments.length - 1] ?? null
}
