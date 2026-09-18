const EXCERPT_TARGET_WORDS = 50

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length
}

// Given all of a chapter's paragraph/sentence units and the index of one a
// search result matched, returns the contiguous slice of units (in
// original order) that together run to roughly targetWords (50 by default)
// - the matched passage plus enough surrounding context to make sense of
// it, not the whole chapter. Expansion alternates sides so the match stays
// roughly centered rather than the excerpt skewing entirely forward or back.
export function buildExcerptWindow(paragraphs, targetIndex, targetWords = EXCERPT_TARGET_WORDS) {
  const targetPos = paragraphs.findIndex((p) => p.index === targetIndex)
  if (targetPos === -1) return []

  let startPos = targetPos
  let endPos = targetPos
  let wordCount = countWords(paragraphs[targetPos].text)

  while (wordCount < targetWords && (startPos > 0 || endPos < paragraphs.length - 1)) {
    const canExpandBefore = startPos > 0
    const canExpandAfter = endPos < paragraphs.length - 1
    const afterIsBehindOrEven = endPos - targetPos <= targetPos - startPos

    if (canExpandAfter && (!canExpandBefore || afterIsBehindOrEven)) {
      endPos += 1
      wordCount += countWords(paragraphs[endPos].text)
    } else if (canExpandBefore) {
      startPos -= 1
      wordCount += countWords(paragraphs[startPos].text)
    } else {
      break
    }
  }

  return paragraphs.slice(startPos, endPos + 1)
}
