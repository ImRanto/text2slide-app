export interface NormalizeOptions {
  linesPerSlide: 1 | 2 | 3
  keepExistingBreaks: boolean
}

export function normalizeText(text: string, opts: NormalizeOptions): string {
  const { linesPerSlide, keepExistingBreaks } = opts

  // 1. Clean line endings and BOM
  const cleanedText = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  const rawLines = cleanedText.split('\n')

  // Helper to clean line and test if it is a separator
  const processLine = (line: string) => {
    const trimmed = line.replace(/^[ \t]+|[ \t]+$/g, '').replace(/[ \t]+/g, ' ')
    const isSeparator = trimmed === '' || /^-{3,}$/.test(trimmed)
    return { trimmed, isSeparator }
  }

  const processedLines = rawLines.map(processLine)

  const slides: string[] = []

  if (keepExistingBreaks) {
    // Group lines into blocks separated by separators
    let currentBlock: string[] = []

    const flushBlock = () => {
      if (currentBlock.length === 0) return
      for (let i = 0; i < currentBlock.length; i += linesPerSlide) {
        slides.push(currentBlock.slice(i, i + linesPerSlide).join('\n'))
      }
      currentBlock = []
    }

    for (const item of processedLines) {
      if (item.isSeparator) {
        flushBlock()
      } else {
        currentBlock.push(item.trimmed)
      }
    }
    flushBlock()
  } else {
    // Ignore all separators, collect all non-separator lines
    const allLines: string[] = []
    for (const item of processedLines) {
      if (!item.isSeparator) {
        allLines.push(item.trimmed)
      }
    }
    for (let i = 0; i < allLines.length; i += linesPerSlide) {
      slides.push(allLines.slice(i, i + linesPerSlide).join('\n'))
    }
  }

  return slides.join('\n\n')
}
