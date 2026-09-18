// Chapter content comes out of the PDF import as hard-wrapped lines (a
// single "\n" per line-wrap) with a blank line between paragraph blocks.
// Those blocks turn out to be large (whole sections between headings, often
// 1500+ characters) rather than the few-sentence paragraphs a person would
// picture, and Fuse's fuzzy matching degrades badly on fields that long, a
// real match can score as barely different from an unrelated one. So: keep
// a blank-line block as one unit when it's short enough to search well, and
// fall back to sentence-level units for anything longer than that.
const MAX_UNIT_LENGTH = 300

const BLOCK_PATTERN = /[^\n]+(?:\n[^\n]+)*/g
// A sentence ends at ./!/? (optionally followed by a closing quote or
// paren), immediately before whitespace or the end of the block. Doesn't
// special-case abbreviations ("Mr.", "e.g.") - an occasional early split is
// an acceptable trade-off for staying simple here.
const SENTENCE_END_PATTERN = /[.!?]+["')\]]?(?=\s|$)/g

function pushUnit(units, index, absoluteStart, raw) {
  const leading = raw.length - raw.trimStart().length
  const trimmed = raw.trim()
  if (!trimmed) return index

  const start = absoluteStart + leading
  units.push({
    index,
    start,
    end: start + trimmed.length,
    // Internal single newlines are just word-wrap, not real line breaks;
    // collapse them so a match spanning a wrap still reads naturally and
    // still matches. start/end keep indexing into the original text.
    text: trimmed.replace(/\s*\n\s*/g, ' '),
  })
  return index + 1
}

function splitBlockIntoSentences(units, index, blockRaw, blockStart) {
  let cursor = 0
  let match

  SENTENCE_END_PATTERN.lastIndex = 0
  while ((match = SENTENCE_END_PATTERN.exec(blockRaw)) !== null) {
    const end = match.index + match[0].length
    index = pushUnit(units, index, blockStart + cursor, blockRaw.slice(cursor, end))
    cursor = end
  }

  if (cursor < blockRaw.length) {
    index = pushUnit(units, index, blockStart + cursor, blockRaw.slice(cursor))
  }

  return index
}

export function splitIntoParagraphs(text) {
  if (!text) return []

  const units = []
  let index = 0

  for (const match of text.matchAll(BLOCK_PATTERN)) {
    const raw = match[0]
    if (!raw.trim()) continue

    if (raw.trim().length <= MAX_UNIT_LENGTH) {
      index = pushUnit(units, index, match.index, raw)
    } else {
      index = splitBlockIntoSentences(units, index, raw, match.index)
    }
  }

  return units
}
