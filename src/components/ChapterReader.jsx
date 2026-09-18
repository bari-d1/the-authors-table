import { useEffect, useMemo } from 'react'
import { splitIntoParagraphs } from '../lib/splitIntoParagraphs'

// Renders a chapter's full text as readable prose, split into the same
// units the search index uses (splitIntoParagraphs is a pure function of
// chapterContent, so the indices line up without sharing any instance).
// Each unit gets a stable id so a search result can scroll straight to it.
function ChapterReader({ chapterContent, highlightedIndex, onScrolledIntoView }) {
  const paragraphs = useMemo(() => splitIntoParagraphs(chapterContent), [chapterContent])

  useEffect(() => {
    if (highlightedIndex === null) return

    const el = document.getElementById(`chapter-paragraph-${highlightedIndex}`)
    if (!el) return

    // block: 'center' rather than the scrollIntoView default ('start') so a
    // match near the bottom of the chapter doesn't just scroll to its own
    // top edge and sit half off-screen.
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // A long chapter can take a couple of seconds to smooth-scroll across
    // (measured ~3-4s for a 300+ paragraph chapter), so the "fade after a
    // few seconds" clock (owned by the caller) starts once the scroll
    // actually stops moving, not the moment it's kicked off - otherwise the
    // highlight can fade before, or just as, the paragraph arrives on
    // screen. Polling scrollY rather than the 'scrollend' event so this
    // doesn't depend on how long a given scroll takes or on browser support.
    let settled = false
    let lastY = window.scrollY
    let stableTicks = 0

    const poll = setInterval(() => {
      const currentY = window.scrollY
      if (currentY === lastY) {
        stableTicks += 1
      } else {
        stableTicks = 0
        lastY = currentY
      }

      if (stableTicks >= 2) {
        settled = true
        clearInterval(poll)
        onScrolledIntoView?.()
      }
    }, 150)

    // Hard ceiling in case scrolling somehow never settles, so the
    // highlight doesn't get stuck permanently.
    const ceiling = setTimeout(() => {
      if (settled) return
      clearInterval(poll)
      onScrolledIntoView?.()
    }, 8000)

    return () => {
      clearInterval(poll)
      clearTimeout(ceiling)
    }
  }, [highlightedIndex, onScrolledIntoView])

  if (!chapterContent) return null

  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-10 sm:px-12 sm:py-14">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph.index}
          id={`chapter-paragraph-${paragraph.index}`}
          className={`-mx-3 mb-5 scroll-mt-8 rounded-md px-3 py-1.5 font-body text-base leading-loose text-ink transition-colors duration-1000 last:mb-0 ${
            highlightedIndex === paragraph.index ? 'bg-gold/25' : 'bg-transparent'
          }`}
        >
          {paragraph.text}
        </p>
      ))}
    </div>
  )
}

export default ChapterReader
