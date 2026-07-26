import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sumWindow, metric, splitWindows, buildMetric } from './scorecard.ts'

const day = (o: Partial<Parameters<typeof sumWindow>[0][number]> = {}) => ({
  games_played: 0,
  wins: 0,
  time_played: 0,
  eliminations: 0,
  assists: 0,
  deaths: 0,
  damage: 0,
  ...o,
})

test('winrate weights by games, not by day', () => {
  // Day 1: 1 game won. Day 2: 9 games, none won. Mean of daily rates = 50%.
  const days = [
    day({ games_played: 1, wins: 1 }),
    day({ games_played: 9, wins: 0 }),
  ]
  assert.equal(metric(sumWindow(days), 'winrate'), 10)
})

test('a window with no games has no winrate or kda', () => {
  const totals = sumWindow([day(), day()])
  assert.equal(metric(totals, 'winrate'), null)
  assert.equal(metric(totals, 'kda'), null)
})

test('a window with no time has no per-10 rates', () => {
  const totals = sumWindow([day({ games_played: 2, eliminations: 20, damage: 5000 })])
  assert.equal(metric(totals, 'elimsPer10'), null)
  assert.equal(metric(totals, 'damagePer10'), null)
})

test('per-10 rates are per 600 seconds', () => {
  const totals = sumWindow([day({ games_played: 1, time_played: 1200, eliminations: 20, damage: 10000 })])
  assert.equal(metric(totals, 'elimsPer10'), 10)
  assert.equal(metric(totals, 'damagePer10'), 5000)
})

test('kda falls back to raw score when there are no deaths', () => {
  const totals = sumWindow([day({ games_played: 1, eliminations: 4, assists: 2, deaths: 0 })])
  assert.equal(metric(totals, 'kda'), 6)
})

test('splitWindows takes the trailing window and the one before it', () => {
  const series = [1, 2, 3, 4, 5, 6, 7]
  assert.deepEqual(splitWindows(series, 3), { recent: [5, 6, 7], previous: [2, 3, 4] })
})

test('splitWindows degrades when there is less than two full windows', () => {
  assert.deepEqual(splitWindows([1, 2], 3), { recent: [1, 2], previous: [] })
  assert.deepEqual(splitWindows([], 3), { recent: [], previous: [] })
})

test('buildMetric has no delta when either window is empty', () => {
  const played = [day({ games_played: 2, wins: 1 })]
  assert.equal(buildMetric('winrate', played, [], []).delta, null)
  assert.equal(buildMetric('winrate', [], played, []).delta, null)
  const both = buildMetric('winrate', played, [day({ games_played: 4, wins: 1 })], [])
  assert.equal(both.delta, 25) // 50% now vs 25% before
})
