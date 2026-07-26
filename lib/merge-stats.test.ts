import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeDeep } from './merge-stats.ts'

// Weights are time played per gamemode: 3h quickplay, 1h competitive.
const QP_TIME = 10_800
const CP_TIME = 3_600

function deep(stats: { key: string; value: number }[]) {
  return {
    'all-heroes': [
      {
        category: 'combat' as const,
        label: 'Combat',
        stats: stats.map((s) => ({ ...s, label: s.key })),
      },
    ],
  }
}

function merged(key: string, qp: number, cp: number): number {
  const out = mergeDeep(
    { deep: deep([{ key, value: qp }]), timePlayed: QP_TIME },
    { deep: deep([{ key, value: cp }]), timePlayed: CP_TIME }
  )
  const value = out?.['all-heroes'][0].stats[0].value
  assert.equal(typeof value, 'number')
  return value as number
}

test('percentages are time-weighted, not summed', () => {
  // 12% of quickplay + 13% of competitive is not 25% of anything.
  assert.equal(merged('of_match_on_fire', 12, 16), 13)
  assert.equal(merged('win_percentage', 40, 60), 45)
})

test('accuracy is time-weighted', () => {
  assert.equal(merged('weapon_accuracy', 30, 50), 35)
})

test('per-10 averages are time-weighted', () => {
  assert.equal(merged('eliminations_avg_per_10_min', 16, 8), 14)
})

test('records take the better of the two', () => {
  assert.equal(merged('eliminations_most_in_game', 34, 41), 41)
  assert.equal(merged('kill_streak_best', 21, 9), 21)
})

test('plain totals sum', () => {
  assert.equal(merged('eliminations', 3558, 844), 4402)
})
