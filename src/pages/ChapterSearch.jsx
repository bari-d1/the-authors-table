import { useEffect, useState } from 'react'
import BookSelector from '../components/BookSelector'
import ChapterSelector from '../components/ChapterSelector'
import Layout from '../components/Layout'
import { useBooks } from '../hooks/useBooks'
import { useChapters } from '../hooks/useChapters'

// Scaffold for the chapter search feature. Owns the book + chapter
// selection today; the search box lands here next, coordinating off the
// same selectedBookId/selectedChapterId.
function ChapterSearch() {
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [selectedChapterId, setSelectedChapterId] = useState(null)
  const { books } = useBooks()
  const { chapters } = useChapters(selectedBookId)

  const selectedBook = books?.find((book) => book.id === selectedBookId) ?? null
  const selectedChapter = chapters?.find((chapter) => chapter.id === selectedChapterId) ?? null

  // A chapter selected under one book is meaningless once a different book
  // is chosen, so drop it rather than leaving a stale id from the previous
  // book sitting in state.
  useEffect(() => {
    setSelectedChapterId(null)
  }, [selectedBookId])

  function handleBookChange(bookId) {
    setSelectedBookId(bookId)
    console.log('BookSelector selection changed:', bookId)
  }

  function handleChapterChange(chapterId) {
    setSelectedChapterId(chapterId)
    console.log('ChapterSelector selection changed:', chapterId)
  }

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
      </div>
    </Layout>
  )
}

export default ChapterSearch
