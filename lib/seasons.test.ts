import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  seasonSegments,
  seasonBoundaries,
  currentSeason,
  segmentIndices,
} from './seasons.ts'

const d = (date: string, season?: number | null) => ({ date, season })

test('groups consecutive days into one segment per season', () => {
  const segs = seasonSegments([
    d('2026-07-01', 21),
    d('2026-07-02', 21),
    d('2026-07-03', 22),
    d('2026-07-04', 22),
  ])
  assert.deepEqual(
    segs.map((s) => [s.season, s.from, s.to, s.days]),
    [
      [21, '2026-07-01', '2026-07-02', 2],
      [22, '2026-07-03', '2026-07-04', 2],
    ]
  )
})

test('the first observed season never claims an observed start', () => {
  // Tracking began mid-season; we have no idea when season 21 actually started.
  const [first, second] = seasonSegments([d('2026-07-01', 21), d('2026-07-02', 22)])
  assert.equal(first.startObserved, false)
  assert.equal(second.startObserved, true)
})

test('unrecorded days before a season mean its start was not observed', () => {
  // The gap could hide the real boundary, so don't claim to have seen it.
  const segs = seasonSegments([d('2026-07-01', 21), d('2026-07-02', null), d('2026-07-03', 22)])
  assert.equal(segs[1].season, 22)
  assert.equal(segs[1].startObserved, false)
})

test('snapshots with no season at all produce no segments', () => {
  assert.deepEqual(seasonSegments([d('2026-07-01'), d('2026-07-02', null)]), [])
  assert.deepEqual(seasonBoundaries([d('2026-07-01')]), [])
  assert.equal(currentSeason([d('2026-07-01')]), null)
})

test('boundaries are the first day of each season after the first', () => {
  const snaps = [d('2026-05-01', 20), d('2026-06-01', 21), d('2026-07-01', 22)]
  assert.deepEqual(seasonBoundaries(snaps), ['2026-06-01', '2026-07-01'])
})

test('a single season has no boundaries to draw', () => {
  assert.deepEqual(seasonBoundaries([d('2026-07-01', 22), d('2026-07-02', 22)]), [])
})

test('currentSeason is the last segment', () => {
  const cur = currentSeason([d('2026-06-01', 21), d('2026-07-01', 22), d('2026-07-02', 22)])
  assert.equal(cur?.season, 22)
  assert.equal(cur?.days, 2)
  assert.equal(cur?.from, '2026-07-01')
})

test('handles an empty history', () => {
  assert.deepEqual(seasonSegments([]), [])
  assert.equal(currentSeason([]), null)
})

test('segmentIndices advances only on a boundary date', () => {
  const dates = ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02']
  assert.deepEqual(segmentIndices(dates, ['2026-07-01']), [0, 0, 1, 1])
})

test('segmentIndices keeps untagged history joined to what follows', () => {
  // No boundary observed means one continuous line, not a break at the point
  // where season recording happened to begin.
  const dates = ['2026-07-24', '2026-07-25', '2026-07-26']
  assert.deepEqual(segmentIndices(dates, []), [0, 0, 0])
})

test('segmentIndices handles back-to-back boundaries', () => {
  const dates = ['2026-07-01', '2026-07-02', '2026-07-03']
  assert.deepEqual(segmentIndices(dates, ['2026-07-02', '2026-07-03']), [0, 1, 2])
})

test('a full rollover splits the series and marks the boundary', () => {
  // The case that only happens every nine weeks: season 22 -> 23.
  const snaps = [
    d('2026-07-25', 22),
    d('2026-07-26', 22),
    d('2026-07-27', 23),
    d('2026-07-28', 23),
  ]
  const boundaries = seasonBoundaries(snaps)
  assert.deepEqual(boundaries, ['2026-07-27'])
  assert.deepEqual(
    segmentIndices(snaps.map((s) => s.date), boundaries),
    [0, 0, 1, 1]
  )
  const cur = currentSeason(snaps)
  assert.equal(cur?.season, 23)
  assert.equal(cur?.startObserved, true)
  assert.equal(cur?.days, 2)
})
