import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSlides, matchMarker } from './parseLyrics'
import { normalizeText } from './normalize'

const on = { useFirstLineAsTitle: false, showSectionLabels: true }
const off = { useFirstLineAsTitle: false, showSectionLabels: false }

test('matchMarker: recognises numbered, bracketed and word markers', () => {
  assert.equal(matchMarker('1-')?.display, '1 -')
  assert.equal(matchMarker('2 -')?.display, '2 -')
  assert.equal(matchMarker('3.')?.display, '3.')
  assert.equal(matchMarker('4)')?.display, '4)')
  assert.equal(matchMarker('[Verset 1]')?.display, 'Verset 1')
  assert.equal(matchMarker('1 - [Verset 1]')?.display, '1 - Verset 1')
  assert.equal(matchMarker('Refrain:')?.display, 'Refrain')
  assert.equal(matchMarker('Verset 2')?.display, 'Verset 2')
})

test('matchMarker: does not treat lyric lines as markers', () => {
  assert.equal(matchMarker('1 - 2 - 3 soleil'), null)
  assert.equal(matchMarker('1- Première ligne'), null)
  assert.equal(matchMarker('Je chante le refrain'), null)
  assert.equal(matchMarker('- item'), null)
  assert.deepEqual(buildSlides('1 - 2 - 3 soleil', on).map(slide => slide.bodyLines), [['1 - 2 - 3 soleil']])
})

test('sections: each marker starts a slide and its label is displayed by default', () => {
  const slides = buildSlides('1-\nligne a\nligne b\n2-\nligne c', on)
  assert.equal(slides.length, 2)
  assert.deepEqual(slides[0].bodyLines, ['1 -', 'ligne a', 'ligne b'])
  assert.deepEqual(slides[1].bodyLines, ['2 -', 'ligne c'])
})

test('sections: marker prefixes are separated from same-line text', () => {
  const slides = buildSlides('1. première ligne\n2- deuxième ligne\n[Verset 1] troisième ligne\nRefrain: quatrième ligne\n1 - [Verset 2] cinquième ligne', on)
  assert.deepEqual(slides.map(slide => slide.bodyLines), [
    ['1.', 'première ligne'],
    ['2 -', 'deuxième ligne'],
    ['Verset 1', 'troisième ligne'],
    ['Refrain', 'quatrième ligne'],
    ['1 - Verset 2', 'cinquième ligne']
  ])
})

test('sections: label can be hidden', () => {
  const slides = buildSlides('1-\nligne a\n2-\nligne c', off)
  assert.deepEqual(slides.map(s => s.bodyLines), [['ligne a'], ['ligne c']])
})

test('title: everything before the first marker is the title', () => {
  const slides = buildSlides('Mon chant\nAuteur X\n\n1-\nligne a', on)
  assert.equal(slides.length, 2)
  assert.equal(slides[0].title, 'Mon chant\nAuteur X')
  assert.deepEqual(slides[0].bodyLines, [])
  assert.deepEqual(slides[1].bodyLines, ['1 -', 'ligne a'])
})

test('title: Titre: prefix marks only that line as title', () => {
  const slides = buildSlides('Titre: Mon chant\nligne a\nligne b', on)
  assert.equal(slides.length, 1)
  assert.equal(slides[0].title, 'Mon chant')
  assert.deepEqual(slides[0].bodyLines, ['ligne a', 'ligne b'])
})

test('title: Titre: after lyrics starts a new slide', () => {
  const slides = buildSlides('ligne a\nTitre: Chant 2\nligne b', on)
  assert.equal(slides.length, 2)
  assert.equal(slides[1].title, 'Chant 2')
})

test('slash: trailing / ends the slide and is removed', () => {
  const slides = buildSlides('ligne a/\nligne b\nligne c', on)
  assert.deepEqual(slides.map(s => s.bodyLines), [['ligne a'], ['ligne b', 'ligne c']])
})

test('slash: a line containing only / is a slide break; et/ou is untouched', () => {
  const slides = buildSlides('pain et/ou vin\n/\nligne b', on)
  assert.deepEqual(slides.map(s => s.bodyLines), [['pain et/ou vin'], ['ligne b']])
})

test('legacy: text without markers behaves as before', () => {
  const slides = buildSlides('Titre court\nligne a\n\nautre\nbloc', { useFirstLineAsTitle: true, showSectionLabels: true })
  assert.equal(slides.length, 2)
  assert.equal(slides[0].title, 'Titre court')
  assert.deepEqual(slides[0].bodyLines, ['ligne a'])
  assert.equal(slides[1].title, 'autre')
})

test('sections mode: first-line-as-title heuristic is not applied', () => {
  const slides = buildSlides('1-\nligne a\nligne b', { useFirstLineAsTitle: true, showSectionLabels: true })
  assert.equal(slides[0].title, '')
})

test('normalize: legacy grouping unchanged', () => {
  const out = normalizeText('a\nb\nc\nd\ne', { linesPerSlide: 2, keepExistingBreaks: true })
  assert.equal(out, 'a\nb\n\nc\nd\n\ne')
})

test('normalize: marker is kept with its first chunk and does not count as a line', () => {
  const out = normalizeText('Mon chant\n\n1-\na\nb\nc\n2-\nd', { linesPerSlide: 2, keepExistingBreaks: true })
  assert.equal(out, 'Mon chant\n\n1-\na\nb\n\nc\n\n2-\nd')
})

test('normalize: moves same-line marker text onto a new line', () => {
  const out = normalizeText('1. première ligne\n2- deuxième ligne\n[Verset 1] troisième ligne\nRefrain: quatrième ligne', {
    linesPerSlide: 2,
    keepExistingBreaks: true
  })
  assert.equal(out, '1.\npremière ligne\n\n2-\ndeuxième ligne\n\n[Verset 1]\ntroisième ligne\n\nRefrain:\nquatrième ligne')
})

test('normalize: slash becomes a slide boundary, also when existing breaks are ignored', () => {
  const out = normalizeText('a/\nb\n\nc\nd', { linesPerSlide: 3, keepExistingBreaks: false })
  assert.equal(out, 'a\n\nb\nc\nd')
})

test('normalize: is idempotent and re-parses to the same slides', () => {
  const src = 'Mon chant\n1 -\na\nb\nc\nd/\ne\n[Refrain]\nf\ng'
  const once = normalizeText(src, { linesPerSlide: 2, keepExistingBreaks: true })
  const twice = normalizeText(once, { linesPerSlide: 2, keepExistingBreaks: true })
  assert.equal(twice, once)
  assert.deepEqual(
    buildSlides(once, on).map(s => s.bodyLines),
    buildSlides(once, on).map(s => s.bodyLines)
  )
})
