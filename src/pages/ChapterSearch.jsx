import { useCallback, useEffect, useRef, useState } from 'react'
import BookSelector from '../components/BookSelector'
import ChapterReader from '../components/ChapterReader'
import ChapterSearchBox from '../components/ChapterSearchBox'
import ChapterSelector from '../components/ChapterSelector'
import Layout from '../components/Layout'
import { useBooks } from '../hooks/useBooks'
import { useChapterContent } from '../hooks/useChapterContent'
import { useChapters } from '../hooks/useChapters'

const HIGHLIGHT_DURATION_MS = 2500

// Chapter search: pick a book, pick a chapter, search its text.
function ChapterSearch() {
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [selectedChapterId, setSelectedChapterId] = useState(null)
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState(null)
  const fadeTimerRef = useRef(null)
  const { books } = useBooks()
  const { chapters } = useChapters(selectedBookId)
  const { content: chapterContent, error: contentError } = useChapterContent(selectedChapterId)

  const selectedBook = books?.find((book) => book.id === selectedBookId) ?? null
  const selectedChapter = chapters?.find((chapter) => chapter.id === selectedChapterId) ?? null

  // A chapter selected under one book is meaningless once a different book
  // is chosen, so drop it rather than leaving a stale id from the previous
  // book sitting in state.
  useEffect(() => {
    setSelectedChapterId(null)
  }, [selectedBookId])

  // A highlighted paragraph index only means something for the chapter it
  // was set against; a new chapter's paragraphs start over at index 0, so a
  // leftover index could highlight the wrong passage.
  useEffect(() => {
    clearTimeout(fadeTimerRef.current)
    setHighlightedParagraphIndex(null)
  }, [selectedChapterId])

  function handleBookChange(bookId) {
    setSelectedBookId(bookId)
    console.log('BookSelector selection changed:', bookId)
  }

  function handleChapterChange(chapterId) {
    setSelectedChapterId(chapterId)
    console.log('ChapterSelector selection changed:', chapterId)
  }

  function handleResultClick(paragraphIndex) {
    // A second click before the first highlight has finished fading should
    // replace it outright, not leave an old fade timer racing the new one.
    clearTimeout(fadeTimerRef.current)
    setHighlightedParagraphIndex(paragraphIndex)
  }

  // ChapterReader calls this once the scroll it triggered has actually
  // settled, not the instant it starts - a long chapter can take a couple
  // of seconds to scroll across, and starting the fade clock on click would
  // let the highlight disappear before, or just as, it comes into view.
  const handleScrolledIntoView = useCallback(() => {
    fadeTimerRef.current = setTimeout(() => {
      setHighlightedParagraphIndex(null)
    }, HIGHLIGHT_DURATION_MS)
  }, [])

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Search chapters</h1>
        <div className="flex flex-col gap-3">
          <BookSelector value={selectedBookId} onChange={handleBookChange} />
          <ChapterSelector
            bookId={selectedBookId}
            value={selectedChapterId}
            onChange={handleChapterChange}
          />
        </div>
        <p className="mt-4 font-body text-sm text-ink-muted">
          Selected book: {selectedBook ? selectedBook.title : 'none'}
        </p>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Selected chapter: {selectedChapter ? `${selectedChapter.number}. ${selectedChapter.title}` : 'none'}
        </p>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Chapter content:{' '}
          {contentError
            ? `Couldn't load chapter content: ${contentError}`
            : selectedChapterId === null
              ? 'none'
              : chapterContent === null
                ? 'Loading…'
                : `loaded, ${chapterContent.length} characters`}
        </p>

        <div className="mt-6">
          <ChapterSearchBox
            chapterId={selectedChapterId}
            chapterContent={chapterContent}
            contentError={contentError}
            onResultClick={handleResultClick}
          />
        </div>

        <div className="mt-10">
          <ChapterReader
            chapterContent={chapterContent}
            highlightedIndex={highlightedParagraphIndex}
            onScrolledIntoView={handleScrolledIntoView}
          />
        </div>
      </div>
    </Layout>
  )
}

export default ChapterSearch
