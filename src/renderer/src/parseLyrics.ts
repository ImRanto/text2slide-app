/**
 * Shared parser for lyrics-style text.
 *
 * Supported syntax (in addition to blank lines and `---`):
 *  - Section markers, alone or before text on their line, each one starts a new slide:
 *      `1-`  `1 -`  `1.`  `1)`  `[Verset 1]`  `1 - [Verset 1]`  `Verset 1`  `Refrain:`
 *    Any text following a marker on the same line becomes the first content line.
 *  - A trailing `/` at the end of a line ends the slide after that line
 *    (a line containing only `/` is a pure slide break).
 *  - Everything before the first section marker is the title.
 *  - `Titre:` (also `Title:`, `Chant:`, `Cantique:`, `Hymne:`) in front of a line
 *    explicitly marks that line as a title.
 */

export interface SectionMarker {
  /** Marker line as typed (whitespace normalised), used when re-writing the text. */
  raw: string
  /** Label shown on the slide. */
  display: string
}

export interface ParsedBlock {
  kind: 'preamble' | 'section' | 'plain'
  marker?: SectionMarker
  /** Lines explicitly marked with a `Titre:` prefix, as typed. */
  titleRaw: string[]
  /** Same lines, prefix removed. */
  titleLines: string[]
  lines: string[]
}

export interface ParseOptions {
  /** When false, blank lines and `---` do not split blocks (they are ignored). */
  keepBreaks: boolean
}

export interface ParsedSlide {
  title: string
  bodyLines: string[]
  raw: string
  section?: string
}

export interface SlideOptions {
  useFirstLineAsTitle: boolean
  showSectionLabels: boolean
}

const SECTION_WORDS =
  'verset|couplet|strophe|refrain|fiv|fiverenana|pont|bridge|chorus|verse|intro|outro|coda|interlude|pr[ée]-?\\s?refrain|pre-?\\s?chorus'

const NUMBERED = /^(\d{1,2})\s*([-–—.)])$/
const NUMBERED_BRACKET = /^(\d{1,2})\s*[-–—.)]\s*\[\s*([^\]]+?)\s*\]$/
const BRACKET = /^\[\s*([^\]]+?)\s*\]$/
const WORD = new RegExp(`^((?:${SECTION_WORDS})(?:\\s*\\d{1,2})?)\\s*[:\\-–—]?$`, 'i')
const TITLE_PREFIX = /^(?:titre|title|chant|cantique|hymne)\s*:\s*(\S.*)$/i

export function matchMarker(line: string): SectionMarker | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  let m = NUMBERED_BRACKET.exec(trimmed)
  if (m) return { raw: trimmed, display: `${m[1]} - ${m[2]}` }

  m = NUMBERED.exec(trimmed)
  if (m) {
    const sep = m[2]
    const display = sep === '.' || sep === ')' ? `${m[1]}${sep}` : `${m[1]} -`
    return { raw: trimmed, display }
  }

  m = BRACKET.exec(trimmed)
  if (m) return { raw: trimmed, display: m[1] }

  m = WORD.exec(trimmed)
  if (m) return { raw: trimmed, display: m[1].trim() }

  return null
}

function splitMarkerWithText(line: string): { marker: SectionMarker; text: string } | null {
  let split: { marker: SectionMarker; text: string } | null = null
  for (let i = 1; i < line.length; i++) {
    if (line[i] !== ' ' && line[i] !== '\t') continue

    const marker = matchMarker(line.slice(0, i).trimEnd())
    if (marker) split = { marker, text: line.slice(i).trimStart() }
  }

  if (
    split &&
    /^\d{1,2}\s*[-–—.)]\s+\S/.test(split.text) &&
    /^\d{1,2}\s*[-–—.)]$/.test(split.marker.raw)
  ) {
    return null
  }

  return split
}

type Token =
  | { t: 'blank' }
  | { t: 'sep' }
  | { t: 'break' }
  | { t: 'marker'; marker: SectionMarker }
  | { t: 'text'; raw: string; text: string; isTitle: boolean; endsSlide: boolean }

function tokenize(text: string): Token[] {
  const cleaned = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  return cleaned.split('\n').flatMap((rawLine): Token[] => {
    const trimmed = rawLine.replace(/^[ \t]+|[ \t]+$/g, '').replace(/[ \t]+/g, ' ')
    if (trimmed === '') return [{ t: 'blank' }]
    if (/^-{3,}$/.test(trimmed)) return [{ t: 'sep' }]

    const marker = matchMarker(trimmed)
    if (marker) return [{ t: 'marker', marker }]

    const markedText = splitMarkerWithText(trimmed)
    if (markedText) return [{ t: 'marker', marker: markedText.marker }, textToken(markedText.text)]

    return [textToken(trimmed)]
  })
}

function textToken(raw: string): Token {
  let content = raw
  let endsSlide = false
  if (content.endsWith('/') && !content.endsWith('//')) {
    content = content.slice(0, -1).trimEnd()
    endsSlide = true
    if (content === '') return { t: 'break' }
  }

  const title = TITLE_PREFIX.exec(content)
  if (title) return { t: 'text', raw: content, text: title[1].trim(), isTitle: true, endsSlide }
  return { t: 'text', raw: content, text: content, isTitle: false, endsSlide }
}

export function parseBlocks(text: string, opts: ParseOptions): ParsedBlock[] {
  const tokens = tokenize(text)
  const sectionsMode = tokens.some(t => t.t === 'marker')
  const blocks: ParsedBlock[] = []
  let cur: ParsedBlock | null = null
  let seenMarker = false

  const flush = () => {
    if (cur && (cur.lines.length || cur.titleLines.length || cur.marker)) blocks.push(cur)
    cur = null
  }

  for (const tok of tokens) {
    switch (tok.t) {
      case 'blank':
        // The preamble (title area) is not split by blank lines.
        if (!opts.keepBreaks || (sectionsMode && !seenMarker)) break
        flush()
        break
      case 'sep':
        if (opts.keepBreaks) flush()
        break
      case 'break':
        flush()
        break
      case 'marker':
        flush()
        seenMarker = true
        cur = { kind: 'section', marker: tok.marker, titleRaw: [], titleLines: [], lines: [] }
        break
      case 'text': {
        if (tok.isTitle && cur && (cur.lines.length > 0 || cur.marker)) flush()
        if (!cur) {
          cur = {
            kind: sectionsMode && !seenMarker ? 'preamble' : 'plain',
            titleRaw: [],
            titleLines: [],
            lines: []
          }
        }
        if (tok.isTitle) {
          cur.titleRaw.push(tok.raw)
          cur.titleLines.push(tok.text)
        } else {
          cur.lines.push(tok.text)
        }
        if (tok.endsSlide) flush()
        break
      }
    }
  }
  flush()
  return blocks
}

/** Builds the list of slides shown in the preview / exported. */
export function buildSlides(text: string, opts: SlideOptions): ParsedSlide[] {
  if (!text.trim()) return []

  const blocks = parseBlocks(text, { keepBreaks: true })
  const sectionsMode = blocks.some(b => b.kind === 'section')
  const slides: ParsedSlide[] = []

  for (const b of blocks) {
    const raw = [...(b.marker ? [b.marker.raw] : []), ...b.titleRaw, ...b.lines].join('\n')

    if (b.titleLines.length > 0) {
      slides.push({ title: b.titleLines.join('\n'), bodyLines: b.lines, raw })
    } else if (b.kind === 'preamble') {
      slides.push({ title: b.lines.join('\n'), bodyLines: [], raw })
    } else if (b.kind === 'section' && b.marker) {
      const showLabel = opts.showSectionLabels
      if (!showLabel && b.lines.length === 0) continue
      const bodyLines = showLabel
        ? b.lines.length > 0
          ? [`${b.marker.display} ${b.lines[0]}`, ...b.lines.slice(1)]
          : [b.marker.display]
        : b.lines
      slides.push({
        title: '',
        bodyLines,
        raw,
        section: b.marker.display
      })
    } else {
      let title = ''
      let bodyLines = b.lines
      // The "first line = title" heuristic only applies to text without section markers.
      if (
        !sectionsMode &&
        opts.useFirstLineAsTitle &&
        bodyLines.length > 0 &&
        bodyLines[0].length < 60 &&
        !bodyLines[0].endsWith('.')
      ) {
        title = bodyLines[0]
        bodyLines = bodyLines.slice(1)
      }
      slides.push({ title, bodyLines, raw })
    }
  }

  return slides
}
