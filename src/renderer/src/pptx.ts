import PptxGenJS from 'pptxgenjs'

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
}

const hex = (c: string) => c.replace('#', '').toUpperCase()

/** Génère un .pptx (une diapositive par bloc de texte) et le renvoie en base64. */
export async function buildPptxBase64(slides: PptxSlide[], s: PptxSettings): Promise<string> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5 in (16:9)
  pptx.title = 'Text2Slide'

  const align = s.align === 'justify' ? 'justify' : s.align
  const W = 13.33
  const MARGIN = 0.7

  for (const slide of slides) {
    const sl = pptx.addSlide()
    sl.background = { color: hex(s.bgColor) }

    let top = MARGIN
    if (slide.title) {
      sl.addText(slide.title, {
        x: MARGIN, y: top, w: W - MARGIN * 2, h: 1.1,
        fontFace: s.fontFamily,
        fontSize: Math.round(s.fontSize * 1.35),
        bold: s.boldTitle || s.boldAllText,
        color: hex(s.textColor),
        align, valign: 'middle', margin: 0, fit: 'shrink'
      })
      top += 1.3
    }

    const runs = slide.bodyLines.map((line, i) => {
      const isBullet = /^[-*•]\s+/.test(line)
      const clean = line.replace(/^[-*•]\s+/, '')
      return {
        text: clean,
        options: {
          breakLine: i < slide.bodyLines.length - 1,
          bullet: isBullet ? true : false,
          paraSpaceAfter: 8
        }
      }
    })

    if (runs.length) {
      sl.addText(runs as any, {
        x: MARGIN, y: top, w: W - MARGIN * 2, h: 7.5 - top - MARGIN,
        fontFace: s.fontFamily,
        fontSize: s.fontSize,
        bold: s.boldAllText,
        color: hex(s.textColor),
        align, valign: 'top', margin: 0,
        lineSpacingMultiple: s.lineHeight,
        fit: 'shrink'
      })
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
