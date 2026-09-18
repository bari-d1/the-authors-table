import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PillButton from '../components/PillButton'
import { useAuthor } from '../hooks/useAuthor'
import { useBooks } from '../hooks/useBooks'

function BookGallery() {
  const { books, error } = useBooks()
  const { author } = useAuthor()
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

  const expandedBook = books.find((book) => book.id === expandedBookId) ?? null

  return (
    <Layout>
      {/* Hero: what this site actually is, before any book grid. */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-heading text-4xl font-semibold text-ink sm:text-5xl">
            Read the books. Talk to the author.
          </h1>
          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-5 font-body text-base leading-relaxed text-ink-muted">
            <p>
              Joshua Komolafe is publishing six books this spring: on covering, on marriage, on
              discernment, on delegation, on grief, and on the fear of being seen. This is where you
              read them chapter by chapter and tell him what you think.
            </p>
            <p>
              Highlight a line that stays with you and turn it into an image worth sharing. Ask a
              question beneath the passage that raised it, and Joshua reads every one and answers
              himself. Search a chapter when you're trying to find a phrase you remember but can't
              place.
            </p>
            <p>Nothing else lives here. Just the books, and the conversation happening around them.</p>
          </div>
        </div>
      </div>

      {/* About the author, once, here, rather than repeated on every book. */}
      {author && (
        <div className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center sm:flex-row sm:items-start sm:text-left">
            {author.photo_url && (
              <img
                src={author.photo_url}
                alt={author.name}
                className="h-28 w-28 shrink-0 rounded-full border border-border object-cover"
              />
            )}
            <div className="flex flex-col gap-2">
              <p className="label-tracked text-ink-muted">About the author</p>
              <p className="font-heading text-2xl font-semibold text-ink">{author.name}</p>
              {author.bio && (
                <p className="font-body text-sm leading-relaxed text-ink-muted">{author.bio}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 py-20">
        {books.length === 0 ? (
          <p className="border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
            No books here yet. Check back soon.
          </p>
        ) : (
          <>
            <h2 className="label-tracked mb-16 text-center text-ink">The books</h2>
            {/* Photo-forward, editorial: three columns at most (smaller
                covers than a two-column layout gives), generous whitespace
                between entries, no bordered card chrome - the cover
                photography and typography carry the weight, not a box. */}
            <div className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
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
                    <h3 className="font-heading text-2xl font-semibold text-ink">{book.title}</h3>
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
          </>
        )}
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
