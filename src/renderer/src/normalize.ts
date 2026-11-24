import { parseBlocks } from './parseLyrics'

export interface NormalizeOptions {
  linesPerSlide: 1 | 2 | 3
  keepExistingBreaks: boolean
}

/**
 * Re-groups the lyrics into slides of `linesPerSlide` lines, separated by a blank line.
 * Section markers (`1-`, `[Refrain]`…), `Titre:` lines, the title area before the first
 * marker and forced breaks (`/`) are explicit and therefore always preserved:
 * a marker / title line stays attached to the first slide of its section and does not
 * count as a lyric line.
 */
export function normalizeText(text: string, opts: NormalizeOptions): string {
  const { linesPerSlide, keepExistingBreaks } = opts
  const blocks = parseBlocks(text, { keepBreaks: keepExistingBreaks })
  const slides: string[] = []

  for (const block of blocks) {
    // Title area before the first marker: kept as a single slide.
    if (block.kind === 'preamble' && block.titleRaw.length === 0) {
      slides.push(block.lines.join('\n'))
      continue
    }

    const lead = [...(block.marker ? [block.marker.raw] : []), ...block.titleRaw]

    if (block.lines.length === 0) {
      slides.push(lead.join('\n'))
      continue
    }

    for (let i = 0; i < block.lines.length; i += linesPerSlide) {
      const chunk = block.lines.slice(i, i + linesPerSlide)
      slides.push((i === 0 ? [...lead, ...chunk] : chunk).join('\n'))
    }
  }

  return slides.join('\n\n')
}
