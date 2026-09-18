const CONTEXT_RADIUS = 60

// Turns a unit's full text plus Fuse's matched character ranges into a
// short, windowed excerpt: a run of segments to render in order, each
// either plain or highlighted, with ellipsis flags for whatever got cut off
// the front/back. Windowing around the actual match (rather than always
// showing the start of the text) matters because units can run up to ~300
// characters, longer than makes sense to show in a results list.
export function buildExcerpt(text, ranges) {
  if (!ranges || ranges.length === 0) {
    const truncated = text.length > 2 * CONTEXT_RADIUS
    return {
      segments: [{ text: truncated ? text.slice(0, 2 * CONTEXT_RADIUS) : text, highlight: false }],
      leadingEllipsis: false,
      trailingEllipsis: truncated,
    }
  }

  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const windowStart = Math.max(0, sorted[0][0] - CONTEXT_RADIUS)
  const windowEnd = Math.min(text.length, sorted[sorted.length - 1][1] + 1 + CONTEXT_RADIUS)

  const segments = []
  let cursor = windowStart

  for (const [start, end] of sorted) {
    const clippedStart = Math.max(start, windowStart)
    const clippedEnd = Math.min(end + 1, windowEnd) // Fuse ranges are inclusive on both ends
    if (clippedStart >= windowEnd || clippedEnd <= windowStart || clippedStart < cursor) continue

    if (clippedStart > cursor) {
      segments.push({ text: text.slice(cursor, clippedStart), highlight: false })
    }
    segments.push({ text: text.slice(clippedStart, clippedEnd), highlight: true })
    cursor = clippedEnd
  }

  if (cursor < windowEnd) {
    segments.push({ text: text.slice(cursor, windowEnd), highlight: false })
  }

  return {
    segments,
    leadingEllipsis: windowStart > 0,
    trailingEllipsis: windowEnd < text.length,
  }
}
