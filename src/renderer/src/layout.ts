export const SLIDE_W = 960
export const SLIDE_H = 540
export type SlideFormat = '16:9' | '4:3'

export function getSlideDimensions(format: SlideFormat): { width: number; height: number } {
  return { width: format === '4:3' ? 720 : SLIDE_W, height: SLIDE_H }
}

export const MIN_FONT_SIZE = 10
export const MAX_FONT_SIZE = 48

export const MARGIN = 50.4
export const TITLE_BOX_H = 79.2
export const TITLE_BLOCK = 93.6
export const TITLE_GAP = 16
export const TITLE_SCALE = 1.35
export const PARA_AFTER = 8
export const BULLET_INDENT = 27
export const LINE_FACTOR = 1.2
const AUTO_CENTER_RATIO = 0.4

export type VAlign = 'auto' | 'top' | 'middle'
export type OverflowLevel = 'ok' | 'warn' | 'over'

export interface LayoutSlide {
  title: string
  bodyLines: string[]
}

export interface LayoutSettings {
  fontFamily: string
  fontSize: number
  lineHeight: number
  boldTitle: boolean
  boldAllText: boolean
  vAlign: VAlign
  slideFormat: SlideFormat
}

export interface SlideLayout {
  centered: boolean
  level: OverflowLevel
  reason: 'body' | 'title' | null
  excessLines: number
}

const BULLET_PATTERN = /^[-*•]\s+/

export function findMaxFit(
  fits: (size: number) => boolean,
  min = MIN_FONT_SIZE,
  max = MAX_FONT_SIZE
): { size: number; fitsAtMin: boolean } {
  if (fits(max)) {
    return { size: max, fitsAtMin: true }
  }
  if (!fits(min)) {
    return { size: min, fitsAtMin: false }
  }

  let low = min
  let high = max
  let best = min

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (fits(mid)) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  let size = best
  while (size > min && !fits(size)) {
    size--
  }
  if (size < max && fits(size + 1)) {
    size = size + 1
  }

  return { size, fitsAtMin: fits(size) }
}

function createMeasureContainer(settings: LayoutSettings): HTMLDivElement {
  const { width } = getSlideDimensions(settings.slideFormat)
  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    visibility: 'hidden',
    width: `${width - 2 * MARGIN}px`,
    fontFamily: `'${settings.fontFamily}', sans-serif`,
    overflowWrap: 'break-word'
  })
  document.body.appendChild(container)
  return container
}

export function measureOne(
  slide: LayoutSlide,
  fontSize: number,
  container: HTMLDivElement,
  settings: LayoutSettings
): SlideLayout {
  const { height } = getSlideDimensions(settings.slideFormat)
  const safeH = height - 2 * MARGIN

  container.replaceChildren()

  const title = slide.title ? document.createElement('div') : null
  if (title) {
    title.textContent = slide.title
    Object.assign(title.style, {
      width: '100%',
      fontSize: `${fontSize * TITLE_SCALE}px`,
      lineHeight: String(LINE_FACTOR),
      fontWeight: settings.boldTitle || settings.boldAllText ? '700' : '400',
      overflowWrap: 'break-word'
    })
    container.appendChild(title)
  }
  const titleH = title?.offsetHeight ?? 0

  const body = document.createElement('div')
  Object.assign(body.style, {
    width: '100%',
    fontSize: `${fontSize}px`,
    lineHeight: String(settings.lineHeight * LINE_FACTOR),
    fontWeight: settings.boldAllText ? '700' : '400',
    overflowWrap: 'break-word'
  })

  slide.bodyLines.forEach((line, index) => {
    const paragraph = document.createElement('div')
    const isBullet = BULLET_PATTERN.test(line)
    paragraph.textContent = isBullet ? line.replace(BULLET_PATTERN, '') : line
    Object.assign(paragraph.style, {
      width: '100%',
      boxSizing: 'border-box',
      paddingLeft: isBullet ? `${BULLET_INDENT}px` : '0',
      marginBottom: index < slide.bodyLines.length - 1 ? `${PARA_AFTER}px` : '0',
      overflowWrap: 'break-word'
    })
    body.appendChild(paragraph)
  })
  container.appendChild(body)
  const bodyH = body.offsetHeight

  const blockH = titleH + (titleH && bodyH ? TITLE_GAP : 0) + bodyH
  const centered = settings.vAlign === 'middle' ||
    (settings.vAlign === 'auto' && blockH <= safeH * AUTO_CENTER_RATIO)
  const lineStep = fontSize * LINE_FACTOR * settings.lineHeight
  let level: OverflowLevel = 'ok'
  let reason: SlideLayout['reason'] = null
  let excessLines = 0

  if (centered) {
    if (blockH > height) {
      level = 'over'
      reason = 'body'
      excessLines = Math.ceil((blockH - height) / lineStep)
    } else if (blockH > safeH) {
      level = 'warn'
      reason = 'body'
    }
  } else {
    const top = MARGIN + (titleH ? TITLE_BLOCK : 0)
    const bottom = top + bodyH
    if (bottom > height) {
      level = 'over'
      reason = 'body'
      excessLines = Math.ceil((bottom - height) / lineStep)
    } else if (bottom > height - MARGIN) {
      level = 'warn'
      reason = 'body'
    } else if (titleH > TITLE_BOX_H) {
      level = 'warn'
      reason = 'title'
    }
  }

  return { centered, level, reason, excessLines }
}

export function measureSlides(slides: LayoutSlide[], settings: LayoutSettings, sizes?: number[]): SlideLayout[] {
  const container = createMeasureContainer(settings)
  try {
    return slides.map((slide, i) => {
      const fontSize = sizes && sizes[i] !== undefined ? sizes[i] : settings.fontSize
      return measureOne(slide, fontSize, container, settings)
    })
  } finally {
    container.remove()
  }
}

export function fitSlideSizes(slides: LayoutSlide[], settings: LayoutSettings): number[] {
  const container = createMeasureContainer(settings)
  try {
    return slides.map(slide => {
      const { size } = findMaxFit(
        size => measureOne(slide, size, container, settings).level === 'ok',
        MIN_FONT_SIZE,
        MAX_FONT_SIZE
      )
      return size
    })
  } finally {
    container.remove()
  }
}
