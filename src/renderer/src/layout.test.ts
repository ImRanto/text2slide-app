import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMaxFit, MIN_FONT_SIZE, MAX_FONT_SIZE } from './layout'

test('findMaxFit: MAX_FONT_SIZE is 100', () => {
  assert.equal(MAX_FONT_SIZE, 100)
  assert.equal(MIN_FONT_SIZE, 10)
})

test('findMaxFit: returns max when fits at max size', () => {
  const result = findMaxFit(() => true, 10, 100)
  assert.deepEqual(result, { size: 100, fitsAtMin: true })
})

test('findMaxFit: returns min with fitsAtMin false when even min does not fit', () => {
  const result = findMaxFit(() => false, 10, 100)
  assert.deepEqual(result, { size: 10, fitsAtMin: false })
})

test('findMaxFit: finds exact upper bound via binary search (threshold = 35)', () => {
  const result = findMaxFit(size => size <= 35, 10, 100)
  assert.deepEqual(result, { size: 35, fitsAtMin: true })
})

test('findMaxFit: finds boundary at min (threshold = 10)', () => {
  const result = findMaxFit(size => size <= 10, 10, 100)
  assert.deepEqual(result, { size: 10, fitsAtMin: true })
})

test('findMaxFit: finds boundary at max (threshold = 100)', () => {
  const result = findMaxFit(size => size <= 100, 10, 100)
  assert.deepEqual(result, { size: 100, fitsAtMin: true })
})

test('findMaxFit: custom min and max bounds', () => {
  const result = findMaxFit(size => size <= 42, 12, 72)
  assert.deepEqual(result, { size: 42, fitsAtMin: true })
})
