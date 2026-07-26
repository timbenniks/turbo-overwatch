import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRankScore, formatDayLabel, formatHours } from './format.ts'

// Encoding (see rankToScore in lib/history.ts): divisionIndex * 5 + (6 - tier),
// so each division owns five consecutive scores, tier 5 lowest.
test('formatRankScore covers both ends of a division', () => {
  assert.equal(formatRankScore(1), 'BRO5')
  assert.equal(formatRankScore(4), 'BRO2')
  assert.equal(formatRankScore(5), 'BRO1') // top of bronze, not "SIL6"
  assert.equal(formatRankScore(6), 'SIL5')
  assert.equal(formatRankScore(10), 'SIL1')
  // Champion is a single tier: no division number to print.
  assert.equal(formatRankScore(36), 'CHAMP')
  assert.equal(formatRankScore(40), 'CHAMP')
})

test('formatRankScore rejects out-of-range scores', () => {
  assert.equal(formatRankScore(0), '')
  assert.equal(formatRankScore(-3), '')
  assert.equal(formatRankScore(999), '')
})

test('formatDayLabel reads the month from the ISO string, not a local Date', () => {
  assert.equal(formatDayLabel('2026-05-18'), 'May 18')
  assert.equal(formatDayLabel('2026-01-01'), 'Jan 1')
})

test('formatHours keeps one decimal only below 10h', () => {
  assert.equal(formatHours(1800), '0.5h')
  assert.equal(formatHours(36000), '10h')
})
