import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PillButton from '../components/PillButton'
import { useBooks } from '../hooks/useBooks'

function BookGallery() {
  const { books, error } = useBooks()
  // The book whose full blurb is open in the modal, or null. Just the id
  // is enough since `books` already holds everything else needed to look
  // it back up when rendering the dialog.
  const [expandedBookId, setExpandedBookId] = useState(null)

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="border border-border bg-white px-6 py-8 text-center font-body text-ink">
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
          <p className="border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
            No books here yet. Check back soon.
          </p>
        </div>
      </Layout>
    )
  }

  const expandedBook = books.find((book) => book.id === expandedBookId) ?? null

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="label-tracked mb-16 text-center text-ink">Book Gallery</h1>
        {/* Photo-forward, editorial: two columns at most, generous
            whitespace between entries, no bordered card chrome - the cover
            photography and typography carry the weight, not a box. */}
        <div className="grid grid-cols-1 gap-x-16 gap-y-20 sm:grid-cols-2">
          {books.map((book) => (
            <div key={book.id} className="flex flex-col">
              {book.cover_url && (
                <Link to={`/book/${book.id}`} className="block">
                  <img
                    src={book.cover_url}
                    alt={`Cover of ${book.title}`}
                    className="aspect-3/4 w-full object-cover"
                  />
                </Link>
              )}
              <div className="flex flex-1 flex-col gap-3 pt-6">
                <h2 className="font-heading text-2xl font-semibold text-ink">{book.title}</h2>
                {book.blurb && (
                  <>
                    <p className="line-clamp-4 font-body text-sm leading-relaxed text-ink-muted">
                      {book.blurb}
                    </p>
                    <button
                      type="button"
                      onClick={() => setExpandedBookId(book.id)}
                      className="label-tracked self-start text-[11px] text-teal hover:text-ink"
                    >
                      Read more
                    </button>
                  </>
                )}
                <div className="mt-2 flex flex-wrap gap-3">
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

      <Dialog open={expandedBook !== null} onClose={() => setExpandedBookId(null)} maxWidth="sm" fullWidth>
        {expandedBook && (
          <>
            <DialogTitle>{expandedBook.title}</DialogTitle>
            <DialogContent>
              <p className="font-body text-sm leading-relaxed text-ink-muted">{expandedBook.blurb}</p>
            </DialogContent>
            <IconButton
              aria-label="Close"
              onClick={() => setExpandedBookId(null)}
              sx={{ position: 'absolute', right: 12, top: 12, color: 'inherit' }}
            >
              ✕
            </IconButton>
          </>
        )}
      </Dialog>
    </Layout>
  )
}

export default BookGallery
