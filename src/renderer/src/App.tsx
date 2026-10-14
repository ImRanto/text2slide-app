import { buildPptxBase64, buildOutlineText } from './pptx'
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BULLET_INDENT, getSlideDimensions, LINE_FACTOR, MARGIN, PARA_AFTER, TITLE_BOX_H, TITLE_GAP, TITLE_SCALE, measureSlides, type SlideFormat, type VAlign } from './layout'
import { normalizeText } from './normalize'

interface StyleSettings {
  fontFamily: string
  fontSize: number
  textColor: string
  bgColor: string
  lineHeight: number
  align: 'left' | 'center' | 'right' | 'justify'
  vAlign: VAlign
  slideFormat: SlideFormat
  useFirstLineAsTitle: boolean
  boldTitle: boolean
  boldAllText: boolean
  linesPerSlide: 1 | 2 | 3
  keepExistingBreaks: boolean
}

interface UpdateState {
  status?: string
  progress?: any
  info?: any
  error?: string
}

const DEFAULT_SETTINGS: StyleSettings = {
  fontFamily: 'Calibri',
  fontSize: 18,
  textColor: '#1f2937',
  bgColor: '#ffffff',
  lineHeight: 1.4,
  align: 'left',
  vAlign: 'auto',
  slideFormat: '16:9',
  useFirstLineAsTitle: false,
  boldTitle: true,
  boldAllText: false,
  linesPerSlide: 2,
  keepExistingBreaks: true
}

async function copyHtmlToClipboard(html: string, text: string): Promise<{ success: boolean; error?: string }> {
  const api = (window as any).api

  if (api?.writeToClipboard) {
    try {
      const res = await api.writeToClipboard({ html, text })
      if (res?.success) return { success: true }
    } catch (error: any) {
      console.warn('IPC clipboard failed:', error)
    }
  }

  if (!html) {
    try {
      await navigator.clipboard.writeText(text)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error?.message || 'Impossible de copier le contenu.' }
    }
  }

  try {
    if (navigator?.clipboard?.write) {
      const blobHtml = new Blob([html], { type: 'text/html' })
      const blobText = new Blob([text], { type: 'text/plain' })
      const ClipboardItemCtor = (window as any).ClipboardItem
      if (ClipboardItemCtor) {
        const item = new ClipboardItemCtor({
          'text/html': blobHtml,
          'text/plain': blobText
        })
        await navigator.clipboard.write([item])
        return { success: true }
      }
    }
  } catch (error: any) {
    console.warn('ClipboardItem fallback failed:', error)
  }

  try {
    await navigator.clipboard.writeText(text)
    return { success: false, error: 'Copie HTML non supportée. Le texte brut a été copié.' }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Impossible de copier le contenu.' }
  }
}

const Swatches = ({ value, colors, onChange, label }: { value: string; colors: string[]; onChange: (c: string) => void; label: string }) => (
  <div>
    <span className="lbl">{label}</span>
    <div className="flex items-center gap-2">
      {colors.map(c => (
        <button
          key={c}
          type="button"
          aria-label={`${label} ${c}`}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
            value.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-[#2A2321] border-transparent' : 'border-surface-line dark:border-surface-line-dark'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="relative w-6 h-6 rounded-full border border-dashed border-surface-mute cursor-pointer overflow-hidden flex items-center justify-center text-[11px] text-surface-mute" title="Autre couleur">
        +
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
  </div>
)

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)


export default function App() {
  const [text, setText] = useState('')
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('text2slide_dark') === '1' } catch { return false }
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(520)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const [settings, setSettings] = useState<StyleSettings>(() => {
    try {
      const saved = localStorage.getItem('text2slide_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        const linesPerSlide = [1, 2, 3].includes(parsed.linesPerSlide) ? (parsed.linesPerSlide as 1 | 2 | 3) : 2
        const keepExistingBreaks = typeof parsed.keepExistingBreaks === 'boolean' ? parsed.keepExistingBreaks : true
        return { ...DEFAULT_SETTINGS, ...parsed, linesPerSlide, keepExistingBreaks }
      }
      return DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [toast, setToast] = useState<string | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [fontLoadVersion, setFontLoadVersion] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem('text2slide_settings', JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    try { localStorage.setItem('text2slide_dark', darkMode ? '1' : '0') } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handleCopySlide(activeSlideIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [text, settings, activeSlideIndex])

  useEffect(() => {
    const api = (window as any).api
    api?.getVersion?.().then((v: string) => setAppVersion(v)).catch(() => {})
  }, [])

  useEffect(() => {
    const api = (window as any).api
    if (!api || typeof api.onUpdateStatus !== 'function') return

    const unsubscribe = api.onUpdateStatus((status: UpdateState) => {
      setUpdateState(status)
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  const handleCleanText = () => {
    const result = normalizeText(text, {
      linesPerSlide: settings.linesPerSlide,
      keepExistingBreaks: settings.keepExistingBreaks
    })

    if (result === text) {
      if (settings.keepExistingBreaks) {
        showToast('Aucun changement. Décochez « Conserver les couplets existants » pour regrouper à nouveau.')
      } else {
        showToast('Aucun changement.')
      }
      return
    }

    const ta = textareaRef.current
    if (ta) {
      ta.focus()
      ta.select()
      const ok = document.execCommand('insertText', false, result)
      if (!ok) setText(result)
      ta.setSelectionRange(result.length, result.length)
    } else {
      setText(result)
    }

    const slideCount = result.trim() ? result.split(/\n\s*\n/).filter(b => b.trim().length > 0).length : 0
    showToast(`Normalisé : ${slideCount} diapositive${slideCount > 1 ? 's' : ''}`)
  }

  const handleRadioKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentVal: 1 | 2 | 3) => {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
      let nextVal: 1 | 2 | 3 = currentVal
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextVal = currentVal === 1 ? 3 : ((currentVal - 1) as 1 | 2 | 3)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextVal = currentVal === 3 ? 1 : ((currentVal + 1) as 1 | 2 | 3)
      }
      setSettings(s => ({ ...s, linesPerSlide: nextVal }))
      const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      if (buttons) {
        buttons[nextVal - 1]?.focus()
      }
    }
  }

  const slides = useMemo(() => {
    if (!text.trim()) return []

    const rawBlocks = text.split(/\n\s*\n|---/)

    return rawBlocks
      .map(block => block.trim())
      .filter(block => block.length > 0)
      .map(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        let title = ''
        let bodyLines = lines

        if (settings.useFirstLineAsTitle && lines.length > 0 && (lines[0].length < 60 && !lines[0].endsWith('.'))) {
          title = lines[0]
          bodyLines = lines.slice(1)
        }

        return { title, bodyLines, raw: block }
      })
  }, [text, settings.useFirstLineAsTitle])

  const layouts = useMemo(
    () => measureSlides(slides, settings),
    [slides, settings.fontFamily, settings.fontSize, settings.lineHeight, settings.boldTitle, settings.boldAllText, settings.vAlign, settings.slideFormat, fontLoadVersion]
  )
  const alertCount = layouts.filter(layout => layout.level !== 'ok').length
  const appendAlertSuffix = (message: string) => alertCount
    ? `${message} · ${alertCount} diapo${alertCount > 1 ? 's' : ''} à vérifier`
    : message

  useEffect(() => {
    let mounted = true
    void document.fonts.ready.then(() => {
      if (mounted) setFontLoadVersion(version => version + 1)
    })
    return () => { mounted = false }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2500)
  }

  const escapeHtml = (input: string) => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const generateSingleSlideHtml = (slide: { title: string; bodyLines: string[] }) => {
    const fontWeightStyle = settings.boldAllText ? 'font-weight: bold;' : ''
    let html = `<div style="font-family: '${settings.fontFamily}', sans-serif; font-size: ${settings.fontSize}pt; color: ${settings.textColor}; background-color: ${settings.bgColor}; padding: 32px; line-height: ${settings.lineHeight}; text-align: ${settings.align}; border: 1px solid transparent;">`

    if (slide.title) {
      const boldStyle = settings.boldTitle || settings.boldAllText ? 'font-weight: bold;' : 'font-weight: normal;'
      html += `<h2 style="font-size: ${settings.fontSize * 1.35}pt; color: ${settings.textColor}; margin: 0 0 16px 0; ${boldStyle}; text-align: ${settings.align};">${escapeHtml(slide.title)}</h2>`
    }

    if (slide.bodyLines.length > 0) {
      html += '<div style="display: block;">'
      slide.bodyLines.forEach(line => {
        const isBullet = line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')
        const cleanLine = isBullet ? line.replace(/^[-*•]\s*/, '') : line

        if (isBullet) {
          html += `<div style="margin: 0 0 6px 20px; ${fontWeightStyle}">• ${escapeHtml(cleanLine)}</div>`
        } else {
          html += `<p style="margin: 0 0 8px 0; ${fontWeightStyle}">${escapeHtml(cleanLine)}</p>`
        }
      })
      html += '</div>'
    }

    html += '</div>'
    return html
  }

  const handleCopySlide = async (index: number) => {
    if (!slides[index]) return

    const slide = slides[index]
    const html = generateSingleSlideHtml(slide)
    const plainText = `${slide.title ? slide.title + '\n' : ''}${slide.bodyLines.join('\n')}`

    const res = await copyHtmlToClipboard(html, plainText)

    if (res.success) {
      showToast(appendAlertSuffix('Copié !'))
    } else {
      showToast(appendAlertSuffix(res.error || 'Erreur de copie.'))
    }
  }

  const handleCopyAllSlides = async () => {
    if (slides.length === 0) return

    // Format "plan" : collé dans PowerPoint (Affichage > Plan, ou volet des miniatures),
    // chaque bloc devient une diapositive distincte.
    const outline = buildOutlineText(slides, settings.useFirstLineAsTitle)
    const res = await copyHtmlToClipboard('', outline)

    if (res.success) {
      showToast(appendAlertSuffix(`Copié : ${slides.length} diapositive${slides.length > 1 ? 's' : ''}. Collez dans PowerPoint > Affichage > Plan`))
    } else {
      showToast(appendAlertSuffix(res.error || 'Erreur de copie.'))
    }
  }

  const handleExportPptx = async () => {
    if (slides.length === 0) return
    try {
      const pptxSlides = slides.map((slide, index) => ({ ...slide, centered: layouts[index]?.centered }))
      const base64 = await buildPptxBase64(pptxSlides, settings)
      const api = (window as any).api
      if (api?.savePptx) {
        const res = await api.savePptx({ base64, defaultName: 'Text2Slide.pptx' })
        if (res?.success) showToast(appendAlertSuffix(`Présentation enregistrée (${slides.length} diapositives)`))
        else if (!res?.canceled) showToast(appendAlertSuffix(res?.error || "Erreur lors de l'enregistrement."))
      } else {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }))
        const a = document.createElement('a')
        a.href = url
        a.download = 'Text2Slide.pptx'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        showToast(appendAlertSuffix(`Présentation téléchargée (${slides.length} diapositives)`))
      }
    } catch (err: any) {
      showToast(appendAlertSuffix(err?.message || 'Impossible de créer le fichier .pptx'))
    }
  }

  const installUpdate = async () => {
    const api = (window as any).api
    if (!api || typeof api.installUpdate !== 'function') {
      showToast('Mise à jour non disponible dans cette build.')
      return
    }

    try {
      await api.installUpdate()
    } catch (err: any) {
      showToast(err?.message || 'Erreur lors de l’installation de la mise à jour.')
    }
  }

  useEffect(() => {
    const el = previewRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width
      if (w) setPreviewWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [slides.length > 0])

  useEffect(() => {
    if (activeSlideIndex > slides.length - 1) setActiveSlideIndex(Math.max(0, slides.length - 1))
  }, [slides.length])

  const { width: slideWidth, height: slideHeight } = getSlideDimensions(settings.slideFormat)
  const scale = previewWidth / slideWidth
  const active = slides[activeSlideIndex]
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const TEXT_SWATCHES = ['#1f2937', '#C43E1C', '#1d4ed8', '#047857', '#7c3aed', '#ffffff']
  const BG_SWATCHES = ['#ffffff', '#FAF7F5', '#FBE9E3', '#E8F0FB', '#1f2937', '#C43E1C']

  const updatePct = Math.round(updateState?.progress?.percent || 0)

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 h-14 shrink-0 border-b border-surface-line dark:border-surface-line-dark bg-surface-card dark:bg-surface-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">Text2Slide</span>
          {appVersion && (
            <span className="text-xs text-surface-mute dark:text-surface-mute-dark" title="Version installée">
              v{appVersion}
              {updateState?.status === 'checking' && ' · recherche de mise à jour…'}
              {updateState?.status === 'update-not-available' && ' · à jour ✓'}
              {updateState?.status === 'error' && ` · mise à jour impossible (${String(updateState.error || 'erreur inconnue').split('\n')[0].slice(0, 90)})`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {updateState?.status === 'update-available' && (
            <div className="text-xs px-3 py-1.5 rounded-full bg-brand-soft text-brand dark:bg-surface-line-dark dark:text-brand-dark">
              Nouvelle version trouvée, téléchargement…
            </div>
          )}
          {updateState?.status === 'download-progress' && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-brand-soft text-brand dark:bg-surface-line-dark dark:text-brand-dark">
              <span>Mise à jour {updatePct}%</span>
              <span className="w-20 h-1.5 rounded-full bg-white/70 dark:bg-black/30 overflow-hidden">
                <span className="block h-full bg-brand" style={{ width: `${updatePct}%` }} />
              </span>
            </div>
          )}
          {updateState?.status === 'update-downloaded' && (
            <button onClick={installUpdate} className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand text-white hover:bg-brand-hover transition-colors">
              Redémarrer pour installer la mise à jour
            </button>
          )}
          {alertCount > 0 && (
            <button
              onClick={() => setActiveSlideIndex(layouts.findIndex(layout => layout.level !== 'ok'))}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
            >
              ⚠ {alertCount} diapo{alertCount > 1 ? 's' : ''} à vérifier
            </button>
          )}

          <button onClick={() => setDarkMode(!darkMode)} className="btn !w-9 !px-0" aria-label={darkMode ? 'Passer en mode clair' : 'Passer en mode sombre'} title={darkMode ? 'Mode clair' : 'Mode sombre'}>
            {darkMode ? <Icon d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" /> : <Icon d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />}
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-1 min-[900px]:grid-cols-2 gap-5 p-5 overflow-y-auto">
        {/* Colonne texte */}
        <section className="card flex flex-col p-5 min-h-[320px]">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold">Texte source</h2>
                <p className="text-xs text-surface-mute dark:text-surface-mute-dark mt-0.5">Une ligne vide ou « --- » sépare les diapositives</p>
              </div>
              <button onClick={handleCleanText} disabled={!text.trim()} className="btn whitespace-nowrap">
                <Icon d="M4 7h16M4 12h10M4 17h6" /> Normaliser
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap text-xs pt-1 border-t border-surface-line dark:border-surface-line-dark">
              <div className="flex items-center gap-2">
                <span className="font-medium text-surface-mute dark:text-surface-mute-dark">Lignes par diapo :</span>
                <div
                  role="radiogroup"
                  aria-label="Lignes par diapositive"
                  className="inline-flex rounded-lg p-0.5 bg-surface-app dark:bg-surface-app-dark border border-surface-line dark:border-surface-line-dark"
                >
                  {([1, 2, 3] as const).map(num => (
                    <button
                      key={num}
                      type="button"
                      role="radio"
                      aria-checked={settings.linesPerSlide === num}
                      onClick={() => setSettings(s => ({ ...s, linesPerSlide: num }))}
                      onKeyDown={e => handleRadioKeyDown(e, num)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                        settings.linesPerSlide === num
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-surface-mute dark:text-surface-mute-dark hover:text-surface-ink dark:hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <label
                className="flex items-center gap-2 cursor-pointer text-surface-mute dark:text-surface-mute-dark hover:text-surface-ink dark:hover:text-white"
                title="Respecte les lignes vides et les --- déjà présents. Décochez pour tout regrouper à nouveau."
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-brand"
                  checked={settings.keepExistingBreaks}
                  onChange={e => setSettings(s => ({ ...s, keepExistingBreaks: e.target.checked }))}
                />
                <span>Conserver les couplets existants</span>
              </label>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="field !h-auto flex-1 min-h-[200px] p-4 resize-none leading-relaxed"
            placeholder={'Collez votre texte ici.\n\nSéparez les diapositives par une ligne vide ou ---'}
            value={text}
            onChange={e => setText(e.target.value)}
            spellCheck={false}
          />

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-surface-app dark:bg-surface-app-dark text-surface-mute dark:text-surface-mute-dark">{wordCount} mots</span>
            <span className="px-2.5 py-1 rounded-full bg-brand-soft text-brand dark:bg-surface-line-dark dark:text-brand-dark font-medium">{slides.length} diapositive{slides.length > 1 ? 's' : ''}</span>
          </div>
        </section>

        {/* Colonne réglages + aperçu */}
        <div className="flex flex-col gap-5 min-w-0">
          <section className="card p-5">
            <h2 className="text-sm font-semibold mb-4">Mise en page</h2>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="lbl">Police</label>
                <select value={settings.fontFamily} onChange={e => setSettings({ ...settings, fontFamily: e.target.value })} className="field">
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              <div>
                <label className="lbl">Taille (pt)</label>
                <input type="number" min={10} max={48} value={settings.fontSize} onChange={e => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="field" />
              </div>
              <div>
                <label className="lbl">Alignement</label>
                <select value={settings.align} onChange={e => setSettings({ ...settings, align: e.target.value as any })} className="field">
                  <option value="left">Gauche</option>
                  <option value="center">Centré</option>
                  <option value="right">Droite</option>
                  <option value="justify">Justifié</option>
                </select>
              </div>
            </div>

            <div className="mt-4 max-w-xs">
              <label className="lbl" htmlFor="slide-format">Format de diapositive</label>
              <select
                id="slide-format"
                value={settings.slideFormat}
                onChange={e => setSettings({ ...settings, slideFormat: e.target.value as SlideFormat })}
                className="field"
              >
                <option value="16:9">Écran large (16:9)</option>
                <option value="4:3">Standard (4:3)</option>
              </select>
            </div>

            <div className="mt-4 max-w-xs">
              <label className="lbl" htmlFor="vertical-alignment">Position verticale</label>
              <select
                id="vertical-alignment"
                value={settings.vAlign}
                onChange={e => setSettings({ ...settings, vAlign: e.target.value as VAlign })}
                className="field"
              >
                <option value="auto">Auto (courtes centrées)</option>
                <option value="middle">Toujours centré</option>
                <option value="top">Toujours en haut</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Swatches label="Couleur du texte" value={settings.textColor} colors={TEXT_SWATCHES} onChange={c => setSettings({ ...settings, textColor: c })} />
              <Swatches label="Couleur de fond" value={settings.bgColor} colors={BG_SWATCHES} onChange={c => setSettings({ ...settings, bgColor: c })} />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={settings.useFirstLineAsTitle} onChange={e => setSettings({ ...settings, useFirstLineAsTitle: e.target.checked })} />
                Première ligne = titre
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={settings.boldAllText} onChange={e => setSettings({ ...settings, boldAllText: e.target.checked })} />
                Tout en gras
              </label>
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 text-xs font-medium text-brand dark:text-brand-dark hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 rounded">
              {showAdvanced ? 'Masquer les options avancées' : 'Options avancées'}
            </button>
            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t border-surface-line dark:border-surface-line-dark">
                <div>
                  <label className="lbl">Interligne : {settings.lineHeight.toFixed(1)}</label>
                  <input type="range" min={1} max={2.2} step={0.1} value={settings.lineHeight} onChange={e => setSettings({ ...settings, lineHeight: Number(e.target.value) })} className="w-full accent-brand" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm self-end pb-1">
                  <input type="checkbox" className="w-4 h-4" checked={settings.boldTitle} onChange={e => setSettings({ ...settings, boldTitle: e.target.checked })} />
                  Titre en gras
                </label>
              </div>
            )}
          </section>

          <section className="card p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="text-sm font-semibold">Aperçu</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyAllSlides} disabled={slides.length === 0} className="btn" title="Copie toutes les diapositives. Collez dans PowerPoint : Affichage > Plan (1 bloc = 1 diapositive)">
                  Copier tout
                </button>
                <button onClick={handleExportPptx} disabled={slides.length === 0} className="btn" title="Crée un fichier PowerPoint avec une diapositive par bloc de texte">
                  <Icon d="M12 3v12M7 10l5 5 5-5M5 21h14" /> Exporter .pptx
                </button>
                <button onClick={() => handleCopySlide(activeSlideIndex)} disabled={!active} className="btn-primary !h-9">
                  <Icon d="M9 9h10v10H9zM5 15V5h10" /> Copier la diapositive
                  <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[11px] font-medium">Ctrl+Shift+C</kbd>
                </button>
              </div>
            </div>

            {!active ? (
              <div style={{ aspectRatio: `${slideWidth} / ${slideHeight}` }} className="rounded-lg border-2 border-dashed border-surface-line dark:border-surface-line-dark flex flex-col items-center justify-center text-center p-6 gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-soft dark:bg-surface-line-dark text-brand dark:text-brand-dark flex items-center justify-center">
                  <Icon d="M3 5h18v12H3zM8 21h8" />
                </div>
                <p className="text-sm font-medium">Aucune diapositive</p>
                <p className="text-xs text-surface-mute dark:text-surface-mute-dark">Collez du texte à gauche pour voir l'aperçu ici.</p>
              </div>
            ) : (
              <>
                <div
                  ref={previewRef}
                  className="relative w-full rounded-lg overflow-hidden shadow-md border border-surface-line dark:border-surface-line-dark"
                  style={{
                    aspectRatio: `${slideWidth} / ${slideHeight}`,
                    color: settings.textColor,
                    backgroundColor: settings.bgColor,
                    fontFamily: `'${settings.fontFamily}', sans-serif`
                  }}
                >
                  <div
                    className="absolute inset-0 flex flex-col"
                    style={{
                      boxSizing: 'border-box',
                      padding: `${MARGIN * scale}px`,
                      justifyContent: layouts[activeSlideIndex]?.centered ? 'center' : 'flex-start'
                    }}
                  >
                    {active.title && (
                      layouts[activeSlideIndex]?.centered ? (
                        <h3 style={{
                          fontSize: `${settings.fontSize * TITLE_SCALE * scale}px`,
                          lineHeight: LINE_FACTOR,
                          fontWeight: settings.boldTitle || settings.boldAllText ? 700 : 400,
                          textAlign: settings.align,
                          overflowWrap: 'break-word',
                          margin: `0 0 ${TITLE_GAP * scale}px 0`
                        }}>
                          {active.title}
                        </h3>
                      ) : (
                        <div style={{
                          minHeight: `${TITLE_BOX_H * scale}px`,
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: `${(TITLE_BLOCK - TITLE_BOX_H) * scale}px`
                        }}>
                          <h3 style={{
                            width: '100%',
                            fontSize: `${settings.fontSize * TITLE_SCALE * scale}px`,
                            lineHeight: LINE_FACTOR,
                            fontWeight: settings.boldTitle || settings.boldAllText ? 700 : 400,
                            textAlign: settings.align,
                            overflowWrap: 'break-word',
                            margin: 0
                          }}>
                            {active.title}
                          </h3>
                        </div>
                      )
                    )}
                    <div style={{
                      fontSize: `${settings.fontSize * scale}px`,
                      textAlign: settings.align,
                      lineHeight: settings.lineHeight * LINE_FACTOR,
                      fontWeight: settings.boldAllText ? 700 : 400,
                      overflowWrap: 'break-word'
                    }}>
                      {active.bodyLines.map((line, i) => {
                        const isBullet = /^[-*•]\s+/.test(line)
                        const cleanLine = isBullet ? line.replace(/^[-*•]\s+/, '') : line
                        return (
                          <div
                            key={i}
                            style={{
                              position: 'relative',
                              paddingLeft: isBullet ? `${BULLET_INDENT * scale}px` : 0,
                              marginBottom: i < active.bodyLines.length - 1 ? `${PARA_AFTER * scale}px` : 0
                            }}
                          >
                            {isBullet && <span aria-hidden="true" style={{ position: 'absolute', left: 0 }}>•</span>}
                            {cleanLine}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {layouts[activeSlideIndex]?.level !== 'ok' && (
                    <div
                      aria-hidden="true"
                      className={`absolute border-t-2 border-dashed ${
                        layouts[activeSlideIndex]?.level === 'over' ? 'border-red-600' : 'border-amber-500'
                      }`}
                      style={{
                        top: `${(slideHeight - MARGIN) * scale}px`,
                        left: `${MARGIN * scale}px`,
                        right: `${MARGIN * scale}px`
                      }}
                    />
                  )}
                  {layouts[activeSlideIndex]?.level === 'over' && (
                    <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
                  )}
                </div>

                {layouts[activeSlideIndex]?.level !== 'ok' && (
                  <div
                    role="status"
                    className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
                      layouts[activeSlideIndex]?.level === 'over'
                        ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200'
                        : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    }`}
                  >
                    <p className="font-medium">
                      {layouts[activeSlideIndex]?.reason === 'title'
                        ? 'Le titre est trop long pour son cadre.'
                        : layouts[activeSlideIndex]?.level === 'over'
                          ? `Le texte dépasse de la diapositive (~${layouts[activeSlideIndex]?.excessLines} ligne${layouts[activeSlideIndex]?.excessLines === 1 ? '' : 's'} en trop).`
                          : 'Le texte touche la marge de sécurité : il est très près du bord.'}
                    </p>
                    <p className="mt-1 opacity-90">Vous pouvez l’exporter telle quelle ; réduisez la taille, scindez le texte ou ignorez cette alerte.</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {slides.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      aria-label={`Diapositive ${idx + 1}${layouts[idx]?.level !== 'ok' ? ', à vérifier' : ''}`}
                      className={`relative shrink-0 w-24 rounded-md p-1.5 text-left overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                        idx === activeSlideIndex ? 'border-brand dark:border-brand-dark' : 'border-surface-line dark:border-surface-line-dark hover:border-brand/50'
                      }`}
                      style={{ backgroundColor: settings.bgColor, color: settings.textColor, aspectRatio: `${slideWidth} / ${slideHeight}` }}
                    >
                      <span className="block text-[8px] leading-tight font-semibold truncate">{idx + 1}. {s.title || s.bodyLines[0]}</span>
                      <span className="block text-[6px] leading-tight opacity-70 line-clamp-3">{(s.title ? s.bodyLines : s.bodyLines.slice(1)).join(' ')}</span>
                      {layouts[idx]?.level !== 'ok' && (
                        <span
                          role="img"
                          aria-label={layouts[idx]?.level === 'over' ? 'Débordement' : 'À vérifier'}
                          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${
                            layouts[idx]?.level === 'over' ? 'bg-red-600' : 'bg-amber-500'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

          </section>
        </div>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-surface-ink dark:bg-surface-card-dark text-white px-4 py-3 text-sm rounded-xl shadow-lg border border-white/10">
          {toast.toLowerCase().startsWith('copié') && <span className="text-emerald-400">✓</span>}
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}