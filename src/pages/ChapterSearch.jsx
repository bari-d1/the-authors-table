import { useState } from 'react'
import BookSelector from '../components/BookSelector'
import Layout from '../components/Layout'
import { useBooks } from '../hooks/useBooks'

// Scaffold for the chapter search feature. Owns the book selection today;
// the chapter selector and search box land here next, coordinating off the
// same selectedBookId.
function ChapterSearch() {
  const [selectedBookId, setSelectedBookId] = useState(null)
  const { books } = useBooks()

  const selectedBook = books?.find((book) => book.id === selectedBookId) ?? null

  function handleChange(bookId) {
    setSelectedBookId(bookId)
    console.log('BookSelector selection changed:', bookId)
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink">Search chapters</h1>
        <BookSelector value={selectedBookId} onChange={handleChange} />
        <p className="mt-4 font-body text-sm text-ink-muted">
          Selected book: {selectedBook ? selectedBook.title : 'none'}
        </p>
      </div>
    </Layout>
  )
}

export default ChapterSearch
