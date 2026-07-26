import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rollingRate, rollingMean, weekStart, weekBuckets } from './rolling.ts'

test('rollingRate weights by denominator, not by day', () => {
  // Day 1: 1 game, won. Day 2: 9 games, 0 won. Naive mean of daily rates = 50%.
  const wins = [1, 0]
  const games = [1, 9]
  assert.deepEqual(rollingRate(wins, games, 7), [1, 0.1])
})

test('rollingRate returns null when the window has no games', () => {
  assert.deepEqual(rollingRate([0, 0], [0, 0], 7), [null, null])
})

test('rollingRate window is trailing and clamped at the start', () => {
  const r = rollingRate([1, 1, 0, 0], [1, 1, 1, 1], 2)
  assert.deepEqual(r, [1, 1, 0.5, 0])
})

test('rollingRate handles an empty series', () => {
  assert.deepEqual(rollingRate([], [], 7), [])
})

test('rollingMean skips nulls and non-finite values', () => {
  assert.deepEqual(rollingMean([2, null, 4], 3), [2, 2, 3])
  assert.deepEqual(rollingMean([null, null], 3), [null, null])
  assert.deepEqual(rollingMean([Infinity, 2], 2), [null, 2])
})

test('weekStart snaps to the preceding Monday, Sunday included', () => {
  assert.equal(weekStart('2026-07-20'), '2026-07-20') // Monday
  assert.equal(weekStart('2026-07-25'), '2026-07-20') // Saturday
  assert.equal(weekStart('2026-07-26'), '2026-07-20') // Sunday — same week
  assert.equal(weekStart('2026-07-27'), '2026-07-27') // next Monday
})

test('weekBuckets groups consecutive days and preserves order', () => {
  const buckets = weekBuckets([
    { date: '2026-07-19' }, // Sunday, week of Jul 13
    { date: '2026-07-20' },
    { date: '2026-07-26' },
    { date: '2026-07-27' },
  ])
  assert.deepEqual(
    buckets.map((b) => [b.week, b.points.length]),
    [
      ['2026-07-13', 1],
      ['2026-07-20', 2],
      ['2026-07-27', 1],
    ]
  )
})

test('weekBuckets handles an empty series', () => {
  assert.deepEqual(weekBuckets([]), [])
})
