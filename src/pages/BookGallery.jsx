import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PillButton from '../components/PillButton'
import { useBooks } from '../hooks/useBooks'

function BookGallery() {
  const { books, error } = useBooks()

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink">
            Something went wrong loading the books: {error}
          </p>
        </div>
      </Layout>
    )
  }

  if (books === null) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-center font-body text-ink-muted">Loading books…</p>
        </div>
      </Layout>
    )
  }

  if (books.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink-muted">
            No books here yet. Check back soon.
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-10 font-display text-3xl font-bold text-ink">Book Gallery</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
            >
              {book.cover_url && (
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title}`}
                  className="aspect-3/4 w-full rounded-t-2xl object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="font-display text-lg font-bold text-ink">{book.title}</h2>
                {book.blurb && (
                  <p className="line-clamp-4 font-body text-sm text-ink-muted">{book.blurb}</p>
                )}
                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <PillButton as={Link} to={`/book/${book.id}`} variant="primary">
                    Join discussion
                  </PillButton>
                  {book.buy_link && (
                    <PillButton
                      as="a"
                      href={book.buy_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                    >
                      Buy
                    </PillButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default BookGallery
