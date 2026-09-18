import { useEffect, useRef } from 'react'

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
const SCRIM_PADDING_X = 56
const SCRIM_PADDING_Y = 56
const SCRIM_RADIUS = 32

function getToken(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

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

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

// Renders the quote-share image: selected background (cover-fit) + a dark
// scrim sized to the text block + the quote (display font) + a smaller
// attribution line (body font). Re-renders whenever quote, backgroundUrl,
// or attribution change.
function QuoteCardCanvas({ quote, backgroundUrl, attribution }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    async function render() {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Paper-colored fallback fill first, so a missing/failed background
      // image never leaves a blank or transparent card.
      ctx.fillStyle = getToken('--color-paper', '#f6f2e9')
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

      // Scrim behind the text for legibility against any background image,
      // sized to the actual content rather than a fixed panel, so a short
      // quote gets a small scrim and more of the background stays visible.
      ctx.fillStyle = 'rgba(20, 16, 12, 0.45)'
      drawRoundedRect(
        ctx,
        MARGIN_X - SCRIM_PADDING_X,
        textTop - SCRIM_PADDING_Y,
        CANVAS_WIDTH - (MARGIN_X - SCRIM_PADDING_X) * 2,
        totalTextHeight + SCRIM_PADDING_Y * 2,
        SCRIM_RADIUS,
      )
      ctx.fill()

      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'

      ctx.font = `700 ${fontSize}px "Space Grotesk", sans-serif`
      ctx.fillStyle = getToken('--color-surface', '#fdfbf6')
      let cursorY = textTop + fontSize * 0.9
      for (const line of lines) {
        ctx.fillText(line, CANVAS_WIDTH / 2, cursorY)
        cursorY += lineHeight
      }

      if (hasAttribution) {
        ctx.font = `500 ${ATTRIBUTION_FONT_SIZE}px "Inter", sans-serif`
        ctx.fillStyle = 'rgba(253, 251, 246, 0.8)'
        let attributionCursorY = textTop + quoteBlockHeight + ATTRIBUTION_GAP + ATTRIBUTION_FONT_SIZE * 0.8
        for (const line of attributionLines) {
          ctx.fillText(line, CANVAS_WIDTH / 2, attributionCursorY)
          attributionCursorY += attributionLineHeight
        }
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [quote, backgroundUrl, attribution])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="mx-auto w-full max-w-xs rounded-2xl border border-border shadow-md"
    />
  )
}

export default QuoteCardCanvas
