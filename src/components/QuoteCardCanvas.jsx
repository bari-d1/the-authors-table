import { useEffect, useRef, useState } from 'react'
import { buildQuoteFilename } from '../lib/buildQuoteFilename'
import { logQuoteCardDownload } from '../lib/logQuoteCardDownload'
import PillButton from './PillButton'

// Fixed output size for social sharing (4:5 portrait, an Instagram-friendly
// size). The <canvas> element's width/height attributes below are this
// real pixel buffer; its on-screen size is constrained separately via CSS,
// so the rendered image itself never stretches or distorts with the
// browser window.
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1350

const MARGIN_X = 100
const QUOTE_MAX_FONT = 88
const QUOTE_MIN_FONT = 34
const QUOTE_FONT_STEP = 2
const QUOTE_LINE_HEIGHT_RATIO = 1.25
const QUOTE_MAX_HEIGHT_RATIO = 0.55 // keep the quote within a comfortable band of a 1350-tall canvas
const ATTRIBUTION_FONT_SIZE = 32
const ATTRIBUTION_GAP = 48

// Deliberately hardcoded, not read from the site's CSS custom properties:
// the quote card has its own background templates and color scheme,
// independent of whatever the surrounding site theme is doing. Reading live
// tokens here would mean a site-wide restyle silently changes the
// downloadable image too, which isn't part of that theme.
const CANVAS_FALLBACK_FILL = '#f6f2e9'
const CANVAS_TEXT_COLOR = '#fdfbf6'

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current === '' || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

// Shrinks the quote's font size until its wrapped lines fit within
// maxHeight, so a short quote renders large and a long one (up to the
// 280-character cap) shrinks to still fit on one card rather than
// overflowing - but never goes below QUOTE_MIN_FONT, so it also never
// becomes illegibly tiny; content past that point overflows gracefully
// rather than vanishing.
function fitQuote(ctx, text, maxWidth, maxHeight) {
  for (let fontSize = QUOTE_MAX_FONT; fontSize >= QUOTE_MIN_FONT; fontSize -= QUOTE_FONT_STEP) {
    ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
    const lines = wrapText(ctx, text, maxWidth)
    const lineHeight = fontSize * QUOTE_LINE_HEIGHT_RATIO
    if (lines.length * lineHeight <= maxHeight) {
      return { fontSize, lines, lineHeight }
    }
  }

  const fontSize = QUOTE_MIN_FONT
  ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
  return { fontSize, lines: wrapText(ctx, text, maxWidth), lineHeight: fontSize * QUOTE_LINE_HEIGHT_RATIO }
}

// Draws `img` scaled and cropped to fully cover the canvas (CSS
// background-size: cover equivalent), so it fills the frame without
// distortion regardless of the source image's own aspect ratio.
function drawCoverImage(ctx, img, canvasWidth, canvasHeight) {
  const canvasRatio = canvasWidth / canvasHeight
  const imgRatio = img.width / img.height

  const drawWidth = imgRatio > canvasRatio ? img.width * (canvasHeight / img.height) : canvasWidth
  const drawHeight = imgRatio > canvasRatio ? canvasHeight : img.height * (canvasWidth / img.width)

  ctx.drawImage(img, (canvasWidth - drawWidth) / 2, (canvasHeight - drawHeight) / 2, drawWidth, drawHeight)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // The backgrounds bucket serves Access-Control-Allow-Origin: *, so this
    // keeps the canvas untainted for a future export/download step instead
    // of only working for the on-screen preview.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load background image: ${url}`))
    img.src = url
  })
}

// Shared by both the Download and Share actions, so they always produce
// identical output rather than each generating the image its own way.
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Canvas produced no image data'))
    }, 'image/png')
  })
}

// Static capability check, not tied to any particular image: most desktop
// browsers support navigator.share for URLs/text but not `files`, which is
// what canShare({ files }) specifically tests. A tiny throwaway file is
// enough to answer the question once per session; the actual share later
// re-checks with the real file as defense in depth.
function canShareFiles() {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  try {
    const testFile = new File([new Uint8Array([0])], 'test.png', { type: 'image/png' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

// Renders the quote-share image: selected background (cover-fit) + the
// quote (display font) + a smaller attribution line (body font), white
// text directly on the photo with a soft drop shadow for legibility, no
// background panel behind it. Re-renders whenever quote, backgroundUrl, or
// attribution change.
function QuoteCardCanvas({ quote, backgroundUrl, attribution, bookTitle, bookId, chapterId }) {
  const canvasRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState(null)
  const [shareSupported] = useState(canShareFiles)
  // Refs, not just the state above: state updates are batched/async, so two
  // clicks dispatched before React re-renders (a fast real double-click can
  // land inside that window) would both still read the stale false value
  // from the same render. The refs read/write synchronously, so the second
  // call sees the first one's guard immediately.
  const isDownloadingRef = useRef(false)
  const isSharingRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    async function render() {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Paper-colored fallback fill first, so a missing/failed background
      // image never leaves a blank or transparent card.
      ctx.fillStyle = CANVAS_FALLBACK_FILL
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (backgroundUrl) {
        try {
          const img = await loadImage(backgroundUrl)
          if (cancelled) return
          drawCoverImage(ctx, img, CANVAS_WIDTH, CANVAS_HEIGHT)
        } catch (err) {
          console.error('QuoteCardCanvas:', err)
          // Keeps the paper-color fallback already filled above.
        }
      }

      if (cancelled) return

      // Canvas text rendering doesn't wait for web fonts on its own; without
      // this a first render can silently fall back to a default font.
      await Promise.all([
        document.fonts.load(`700 ${QUOTE_MAX_FONT}px "Space Grotesk"`),
        document.fonts.load(`500 ${ATTRIBUTION_FONT_SIZE}px "Inter"`),
      ]).catch(() => {})

      if (cancelled) return

      const trimmedQuote = (quote ?? '').trim()
      const hasQuote = trimmedQuote.length > 0
      const displayQuote = hasQuote ? `“${trimmedQuote}”` : 'Select a quote to preview it here.'

      const maxTextWidth = CANVAS_WIDTH - MARGIN_X * 2
      const maxQuoteHeight = CANVAS_HEIGHT * QUOTE_MAX_HEIGHT_RATIO
      const { fontSize, lines, lineHeight } = fitQuote(ctx, displayQuote, maxTextWidth, maxQuoteHeight)

      const hasAttribution = hasQuote && Boolean(attribution)
      ctx.font = `500 ${ATTRIBUTION_FONT_SIZE}px "Inter", sans-serif`
      // A long book title needs the same width constraint as the quote -
      // without wrapping it, a title longer than the card runs straight off
      // both edges instead of staying inside the card.
      const attributionLines = hasAttribution ? wrapText(ctx, attribution, maxTextWidth) : []
      const attributionLineHeight = ATTRIBUTION_FONT_SIZE * 1.4
      const attributionBlockHeight = attributionLines.length * attributionLineHeight
      const quoteBlockHeight = lines.length * lineHeight
      const totalTextHeight = quoteBlockHeight + (hasAttribution ? ATTRIBUTION_GAP + attributionBlockHeight : 0)
      const textTop = (CANVAS_HEIGHT - totalTextHeight) / 2

      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'

      // No background panel behind the text anymore - just the white text
      // directly on the photo. A soft drop shadow (not a solid scrim) is
      // what keeps it legible against a light or busy patch of the image.
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
      ctx.shadowBlur = 14
      ctx.shadowOffsetY = 2

      ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
      ctx.fillStyle = CANVAS_TEXT_COLOR
      let cursorY = textTop + fontSize * 0.9
      for (const line of lines) {
        ctx.fillText(line, CANVAS_WIDTH / 2, cursorY)
        cursorY += lineHeight
      }

      if (hasAttribution) {
        ctx.font = `500 ${ATTRIBUTION_FONT_SIZE}px "Inter", sans-serif`
        ctx.fillStyle = 'rgba(253, 251, 246, 0.85)'
        let attributionCursorY = textTop + quoteBlockHeight + ATTRIBUTION_GAP + ATTRIBUTION_FONT_SIZE * 0.8
        for (const line of attributionLines) {
          ctx.fillText(line, CANVAS_WIDTH / 2, attributionCursorY)
          attributionCursorY += attributionLineHeight
        }
      }

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }

    render()

    return () => {
      cancelled = true
    }
  }, [quote, backgroundUrl, attribution])

  const hasQuote = Boolean((quote ?? '').trim())

  async function handleDownload() {
    if (isDownloadingRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    isDownloadingRef.current = true
    setIsDownloading(true)
    try {
      const blob = await canvasToBlob(canvas)

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = buildQuoteFilename(bookTitle)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Revoked on a short delay rather than immediately after click - some
      // mobile browsers (iOS Safari in particular) handle the download
      // asynchronously, and revoking the URL too early can break it.
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      // The download has already succeeded at this point (the file is on
      // its way to the reader regardless of what happens next). Logged for
      // the metrics dashboard only - deliberately not awaited, so a slow or
      // failing insert can't delay re-enabling the button, and nothing
      // about its outcome is ever shown to the reader.
      logQuoteCardDownload(bookId, chapterId)
    } catch (err) {
      console.error('QuoteCardCanvas: download failed', err)
    } finally {
      isDownloadingRef.current = false
      setIsDownloading(false)
    }
  }

  async function handleShare() {
    if (isSharingRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    isSharingRef.current = true
    setIsSharing(true)
    setShareError(null)
    try {
      const blob = await canvasToBlob(canvas)
      const file = new File([blob], buildQuoteFilename(bookTitle), { type: 'image/png' })

      // Re-checked here with the real file, not just the button's static
      // visibility check, as defense in depth.
      if (!navigator.canShare({ files: [file] })) {
        throw new Error('File sharing is not supported in this browser')
      }

      await navigator.share({
        files: [file],
        title: attribution || "A quote from The Author's Table",
      })
    } catch (err) {
      // The reader dismissing the native share sheet throws AbortError -
      // a normal cancellation, not a failure, so it gets no message at all.
      if (err?.name !== 'AbortError') {
        console.error('QuoteCardCanvas: share failed', err)
        setShareError("Couldn't share right now. Try downloading instead.")
      }
    } finally {
      isSharingRef.current = false
      setIsSharing(false)
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="mx-auto w-full max-w-xs rounded-sharp border border-border shadow-md"
      />
      <div className="mt-4 flex justify-center gap-3">
        <PillButton
          type="button"
          variant="primary"
          onClick={handleDownload}
          disabled={!hasQuote || isDownloading}
        >
          {isDownloading ? 'Preparing…' : 'Download'}
        </PillButton>
        {shareSupported && (
          <PillButton
            type="button"
            variant="primary"
            onClick={handleShare}
            disabled={!hasQuote || isSharing}
          >
            {isSharing ? 'Preparing…' : 'Share'}
          </PillButton>
        )}
      </div>
      {shareError && (
        <p className="mt-2 text-center font-body text-sm text-error">{shareError}</p>
      )}
    </div>
  )
}

export default QuoteCardCanvas
