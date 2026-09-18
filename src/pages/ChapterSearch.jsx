import { useEffect, useState } from 'react'
import BookSelector from '../components/BookSelector'
import ChapterReader from '../components/ChapterReader'
import ChapterSearchBox from '../components/ChapterSearchBox'
import ChapterSelector from '../components/ChapterSelector'
import Layout from '../components/Layout'
import QuotableText from '../components/QuotableText'
import QuoteBackgroundPicker from '../components/QuoteBackgroundPicker'
import QuoteCardCanvas from '../components/QuoteCardCanvas'
import { capQuote } from '../lib/capQuote'
import { useBooks } from '../hooks/useBooks'
import { useChapterContent } from '../hooks/useChapterContent'

// Chapter search: pick a book, pick a chapter, search its text.
function ChapterSearch() {
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [selectedChapterId, setSelectedChapterId] = useState(null)
  // Doubles as "which paragraph is the reading excerpt centered on" and
  // "which paragraph is highlighted" - persists until a different result
  // is clicked or the chapter changes, rather than fading, since the
  // excerpt itself is built around it.
  const [highlightedParagraphIndex, setHighlightedParagraphIndex] = useState(null)
  // The quote-share flow's shared state. Only ever set from an actual
  // chapter-text selection (via QuotableText) - readers can't type
  // anything else in here, the shared quote has to be a real passage they
  // selected, not arbitrary text.
  const [selectedQuote, setSelectedQuote] = useState('')
  const [quoteNotice, setQuoteNotice] = useState(null)
  const [quoteSourceBookId, setQuoteSourceBookId] = useState(null)
  const [quoteSourceChapterId, setQuoteSourceChapterId] = useState(null)
  const [selectedBackgroundUrl, setSelectedBackgroundUrl] = useState(null)
  const { books } = useBooks()
  const { content: chapterContent, error: contentError } = useChapterContent(selectedChapterId)

  const selectedBook = books?.find((book) => book.id === selectedBookId) ?? null

  // A chapter selected under one book is meaningless once a different book
  // is chosen, so drop it rather than leaving a stale id from the previous
  // book sitting in state.
  useEffect(() => {
    setSelectedChapterId(null)
  }, [selectedBookId])

  // The excerpt/highlight only means something for the chapter it was set
  // against; a new chapter's paragraphs start over at index 0, so a
  // leftover index could highlight (and excerpt) the wrong passage.
  useEffect(() => {
    setHighlightedParagraphIndex(null)
  }, [selectedChapterId])

  function handleBookChange(bookId) {
    setSelectedBookId(bookId)
  }

  function handleChapterChange(chapterId) {
    setSelectedChapterId(chapterId)
  }

  function handleResultClick(paragraphIndex) {
    setHighlightedParagraphIndex(paragraphIndex)
  }

  // A browser text selection isn't bound by a textarea's maxLength, so this
  // is where the cap actually gets enforced.
  function handleShareQuote(rawText) {
    const result = capQuote(rawText)
    setSelectedQuote(result.text)
    setQuoteNotice(
      result.wasTrimmed
        ? `Trimmed to ${result.text.length} characters (your selection was ${result.originalLength}).`
        : null,
    )
    setQuoteSourceBookId(selectedBookId)
    setQuoteSourceChapterId(selectedChapterId)
  }

  const handleBackgroundChange = (url) => {
    setSelectedBackgroundUrl(url)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-6 font-heading text-3xl font-bold text-ink">Share a Quote</h1>
        <div className="flex flex-col gap-3">
          <BookSelector value={selectedBookId} onChange={handleBookChange} />
          <ChapterSelector
            bookId={selectedBookId}
            value={selectedChapterId}
            onChange={handleChapterChange}
          />
        </div>

        <div className="mt-6">
          <ChapterSearchBox
            chapterId={selectedChapterId}
            chapterContent={chapterContent}
            contentError={contentError}
            onResultClick={handleResultClick}
          />
        </div>

        {highlightedParagraphIndex !== null && (
          <p className="label-tracked mt-8 text-xs text-ink-muted">
            Highlight a line below, then tap "Share this quote"
          </p>
        )}

        <div className="mt-3">
          <QuotableText onShareQuote={handleShareQuote}>
            <ChapterReader chapterContent={chapterContent} highlightedIndex={highlightedParagraphIndex} />
          </QuotableText>
        </div>

        <div className="mt-10 rounded-sharp border border-border bg-white p-5">
          <h2 className="mb-3 font-heading text-lg font-bold text-ink">Your quote</h2>
          <div className="min-h-22 rounded-sharp border border-border bg-white p-3 font-body text-sm text-ink">
            {selectedQuote || <span className="text-ink-muted">Nothing selected yet.</span>}
          </div>
          {quoteNotice && <p className="mt-2 font-body text-sm text-error">{quoteNotice}</p>}

          <h3 className="mb-2 mt-5 font-body text-sm font-medium text-ink">Background</h3>
          <QuoteBackgroundPicker value={selectedBackgroundUrl} onChange={handleBackgroundChange} />

          <h3 className="mb-2 mt-5 font-body text-sm font-medium text-ink">Preview</h3>
          <QuoteCardCanvas
            quote={selectedQuote}
            backgroundUrl={selectedBackgroundUrl}
            bookTitle={selectedBook?.title}
            bookId={quoteSourceBookId}
            chapterId={quoteSourceChapterId}
          />
        </div>
      </div>
    </Layout>
  )
}

export default ChapterSearch
