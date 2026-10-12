import PptxGenJS from 'pptxgenjs'
import { BULLET_INDENT, LINE_FACTOR, MARGIN, PARA_AFTER, SLIDE_H, SLIDE_W, TITLE_BLOCK, TITLE_BOX_H, TITLE_GAP, TITLE_SCALE } from './layout'

export interface PptxSettings {
  fontFamily: string
  fontSize: number
  textColor: string
  bgColor: string
  lineHeight: number
  align: 'left' | 'center' | 'right' | 'justify'
  boldTitle: boolean
  boldAllText: boolean
}

export interface PptxSlide {
  title: string
  bodyLines: string[]
  centered?: boolean
}

const hex = (c: string) => c.replace('#', '').toUpperCase()

/** Génère un .pptx (une diapositive par bloc de texte) et le renvoie en base64. */
export async function buildPptxBase64(slides: PptxSlide[], s: PptxSettings): Promise<string> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in (16:9)
  pptx.title = 'Text2Slide'

  const align = s.align === 'justify' ? 'justify' : s.align
  const width = SLIDE_W / 72
  const height = SLIDE_H / 72
  const margin = MARGIN / 72

  for (const slide of slides) {
    const sl = pptx.addSlide()
    sl.background = { color: hex(s.bgColor) }

    const bodyRuns = slide.bodyLines.map((line, i) => {
      const isBullet = /^[-*•]\s+/.test(line)
      const clean = line.replace(/^[-*•]\s+/, '')
      return {
        text: clean,
        options: {
          breakLine: i < slide.bodyLines.length - 1,
          fontSize: s.fontSize,
          bold: s.boldAllText,
          bullet: isBullet ? { indent: BULLET_INDENT } : false,
          paraSpaceAfter: i < slide.bodyLines.length - 1 ? PARA_AFTER : 0,
          lineSpacingMultiple: s.lineHeight * LINE_FACTOR
        }
      }
    })

    if (slide.centered) {
      const runs = [
        ...(slide.title ? [{
          text: slide.title,
          options: {
            fontSize: Math.round(s.fontSize * TITLE_SCALE),
            bold: s.boldTitle || s.boldAllText,
            breakLine: true,
            paraSpaceAfter: TITLE_GAP
          }
        }] : []),
        ...bodyRuns
      ]
      if (runs.length) {
        sl.addText(runs, {
          x: margin, y: margin, w: width - margin * 2, h: height - margin * 2,
          fontFace: s.fontFamily,
          color: hex(s.textColor),
          align, valign: 'middle', margin: 0
        })
      }
    } else {
      let top = margin
      if (slide.title) {
        sl.addText(slide.title, {
          x: margin, y: top, w: width - margin * 2, h: TITLE_BOX_H / 72,
          fontFace: s.fontFamily,
          fontSize: Math.round(s.fontSize * TITLE_SCALE),
          bold: s.boldTitle || s.boldAllText,
          color: hex(s.textColor),
          align, valign: 'middle', margin: 0
        })
        top += TITLE_BLOCK / 72
      }

      if (bodyRuns.length) {
        sl.addText(bodyRuns, {
          x: margin, y: top, w: width - margin * 2, h: height - top - margin,
          fontFace: s.fontFamily,
          color: hex(s.textColor),
          align, valign: 'top', margin: 0
        })
      }
    }
  }

  return (await pptx.write({ outputType: 'base64' })) as string
}

/** Texte au format "plan" : coller dans PowerPoint > Affichage > Plan (ou dans le volet des miniatures)
 *  crée une diapositive par bloc (titre = 1re ligne, le reste en retrait). */
export function buildOutlineText(slides: PptxSlide[], useTitle: boolean): string {
  return slides
    .map(sl => {
      const lines = sl.title ? [sl.title, ...sl.bodyLines] : useTitle ? sl.bodyLines : [...sl.bodyLines]
      const [first, ...rest] = lines
      const body = rest.map(l => '\t' + l.replace(/^[-*•]\s+/, ''))
      return [first ?? '', ...body].join('\r\n')
    })
    .join('\r\n')
}
