import Fuse from 'fuse.js'
import { splitIntoParagraphs } from './splitIntoParagraphs'

// Tuned for fuzzy matching against paragraph/sentence units rather than
// short labels: ignoreLocation matters here since a match can legitimately
// sit anywhere in a unit, not just near its start, and Fuse's default
// location/distance scoring otherwise penalizes exactly that. threshold is
// the main relevance lever; 0.4 was picked empirically against real chapter
// text as the point where realistic one-character typos ("coverign" for
// "covering") still match, while multi-word queries unrelated to the
// content return nothing.
const FUSE_OPTIONS = {
  keys: ['text'],
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.4,
  minMatchCharLength: 3,
}

// Builds a paragraph index + Fuse instance for one chapter's content. Meant
// to be rebuilt only when content changes (see useChapterSearch), not on
// every keystroke of whatever search box ends up calling `search`.
export function createChapterSearch(content) {
  const paragraphs = splitIntoParagraphs(content)
  const fuse = new Fuse(paragraphs, FUSE_OPTIONS)

  function search(query) {
    if (!query || !query.trim()) return []

    // Fuse's own threshold governs whether its internal bitap match is
    // accepted, but the score it reports afterward is further weighted by
    // field length, so a result can come back with a score well past the
    // configured threshold (observed: a short unrelated sentence scoring
    // 0.6+ against a 0.3 threshold). Re-applying the threshold as an
    // explicit cutoff here is what actually keeps irrelevant paragraphs out.
    return fuse
      .search(query.trim())
      .filter((result) => result.score <= FUSE_OPTIONS.threshold)
      .map((result) => ({
        paragraph: result.item,
        score: result.score,
      }))
  }

  return { paragraphs, search }
}
