import { useEffect, useMemo } from 'react'
import { buildExcerptWindow } from '../lib/buildExcerptWindow'
import { splitIntoParagraphs } from '../lib/splitIntoParagraphs'

// Shows a ~50-word excerpt around whichever search result the reader
// clicked, not the whole chapter - readers select a quote from within that
// excerpt, which also keeps a shared quote honestly tied to a real passage
// rather than an arbitrary stretch of the chapter. The highlighted
// paragraph persists until a different result is clicked (or the chapter
// changes), rather than fading - since it's what the whole excerpt is
// built around, fading it out while the excerpt stayed put would just
// look like the "why is this here" paragraph. Units are the same ones the
// search index uses (splitIntoParagraphs is a pure function of
// chapterContent, so the indices line up without sharing any instance).
function ChapterReader({ chapterContent, highlightedIndex }) {
  const paragraphs = useMemo(() => splitIntoParagraphs(chapterContent), [chapterContent])
  const excerpt = useMemo(
    () => (highlightedIndex === null ? [] : buildExcerptWindow(paragraphs, highlightedIndex)),
    [paragraphs, highlightedIndex],
  )

  useEffect(() => {
    if (highlightedIndex === null) return

    const el = document.getElementById(`chapter-paragraph-${highlightedIndex}`)
    // A short excerpt rarely needs scrolling at all (it replaces its own
    // spot in the page rather than living somewhere far away), but this is
    // a cheap safety net for when the reader scrolled elsewhere first.
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedIndex])

  if (!chapterContent) return null

  if (highlightedIndex === null) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-sm text-ink-muted">
        Search the chapter above, then click a result to read that passage here.
      </p>
    )
  }

  return (
    <div className="rounded-sharp border border-border bg-white px-6 py-10 sm:px-12 sm:py-14">
      {excerpt.map((paragraph) => (
        <p
          key={paragraph.index}
          id={`chapter-paragraph-${paragraph.index}`}
          className={`-mx-3 mb-5 scroll-mt-8 rounded-md px-3 py-1.5 font-body text-base leading-loose text-ink transition-colors duration-500 last:mb-0 ${
            highlightedIndex === paragraph.index ? 'bg-teal-tint' : 'bg-transparent'
          }`}
        >
          {paragraph.text}
        </p>
      ))}
    </div>
  )
}

export default ChapterReader
