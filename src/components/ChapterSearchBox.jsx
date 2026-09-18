import { useMemo, useState } from 'react'
import { useChapterSearch } from '../hooks/useChapterSearch'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const DEBOUNCE_MS = 250

const PLACEHOLDER_CLASSES =
  'rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted'

function Excerpt({ excerpt }) {
  return (
    <>
      {excerpt.leadingEllipsis && '… '}
      {excerpt.segments.map((segment, i) =>
        segment.highlight ? (
          <mark key={i} className="rounded bg-gold/25 px-0.5 font-semibold text-ink">
            {segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
      {excerpt.trailingEllipsis && ' …'}
    </>
  )
}

// Search within whatever chapter is currently loaded. Hidden/disabled until
// a book and chapter are both selected upstream, since there's no content
// to search without a loaded chapter.
function ChapterSearchBox({ chapterId, chapterContent, contentError, onResultClick }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)
  const { search } = useChapterSearch(chapterContent)

  const results = useMemo(() => {
    if (chapterContent === null) return []
    return search(debouncedQuery)
  }, [search, debouncedQuery, chapterContent])

  if (!chapterId) {
    return <p className={PLACEHOLDER_CLASSES}>Choose a book and chapter to search its text.</p>
  }

  if (contentError) {
    return <p className={PLACEHOLDER_CLASSES}>Couldn't load chapter text to search: {contentError}</p>
  }

  if (chapterContent === null) {
    return <p className={PLACEHOLDER_CLASSES}>Loading chapter text…</p>
  }

  const trimmedQuery = debouncedQuery.trim()
  const hasSearched = trimmedQuery.length > 0

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search this chapter…"
        className="w-full rounded-lg border border-border bg-paper p-3 font-body text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-gold"
      />

      {hasSearched && results.length === 0 && (
        <p className="mt-3 font-body text-sm text-ink-muted">
          No matches for “{trimmedQuery}” in this chapter.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((result) => (
            <li key={result.paragraph.index}>
              <button
                type="button"
                onClick={() => onResultClick?.(result.paragraph.index)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-left font-body text-sm leading-relaxed text-ink transition-colors hover:border-gold hover:bg-paper focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <Excerpt excerpt={result.excerpt} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ChapterSearchBox
