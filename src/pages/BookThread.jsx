import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CommentComposer from '../components/CommentComposer'
import CommentList from '../components/CommentList'
import Layout from '../components/Layout'
import PillButton from '../components/PillButton'
import { useAuthor } from '../hooks/useAuthor'
import { supabase } from '../lib/supabaseClient'

function BookThread() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  // The full bio only lives on the gallery page now; this page just needs
  // the author's name for the byline, so a failure here shouldn't block
  // the book/discussion from rendering.
  const { author } = useAuthor()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      const { data, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setBook(data)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [bookId])

  async function handleCommentSubmit({ content, commenterName, question, readerEmail, parentId }) {
    const { error: insertError } = await supabase.from('comments').insert({
      book_id: book.id,
      chapter_id: null,
      parent_id: parentId,
      commenter_name: commenterName,
      content,
      question,
      reader_email: readerEmail,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }

    // The new comment isn't added to local state here on purpose; a
    // realtime subscription (separate work) is what will surface it.
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-center font-body text-ink-muted">Loading book…</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink">
            Something went wrong loading this book: {error}
          </p>
        </div>
      </Layout>
    )
  }

  if (notFound) {
    return (
      <Layout>
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16 text-center">
          <p className="font-body text-ink-muted">
            We couldn&apos;t find a book with that id.
          </p>
          <PillButton as={Link} to="/" variant="primary">
            Back to the gallery
          </PillButton>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Book banner */}
        <section className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              className="w-40 shrink-0 border border-border object-cover sm:w-48"
            />
          )}
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-bold text-ink">{book.title}</h1>
            {author && <p className="font-body text-ink-muted">by {author.name}</p>}
            {book.blurb && (
              <p className="mt-2 font-body text-sm leading-relaxed text-ink-muted">{book.blurb}</p>
            )}
          </div>
        </section>

        {/* Discussion */}
        <section className="mt-10">
          <h2 className="mb-4 font-heading text-xl font-bold text-ink">Discussion</h2>
          <div className="mb-6">
            <CommentComposer parentId={null} onSubmit={handleCommentSubmit} />
          </div>
          <CommentList bookId={book.id} onSubmitReply={handleCommentSubmit} />
        </section>
      </div>
    </Layout>
  )
}

export default BookThread
