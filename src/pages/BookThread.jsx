import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CommentComposer from '../components/CommentComposer'
import CommentList from '../components/CommentList'
import Layout from '../components/Layout'
import PillButton from '../components/PillButton'
import { supabase } from '../lib/supabaseClient'

function BookThread() {
  const { bookId } = useParams()
  const [book, setBook] = useState(null)
  const [author, setAuthor] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      const [bookResult, authorResult] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).maybeSingle(),
        supabase.from('author').select('*').maybeSingle(),
      ])

      if (cancelled) return

      if (bookResult.error || authorResult.error) {
        setError((bookResult.error || authorResult.error).message)
        setLoading(false)
        return
      }

      if (!bookResult.data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setBook(bookResult.data)
      setAuthor(authorResult.data)
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
          <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink">
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
              className="w-40 shrink-0 rounded-xl border border-border object-cover sm:w-48"
            />
          )}
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold text-ink">{book.title}</h1>
            {author && <p className="font-body text-ink-muted">by {author.name}</p>}
          </div>
        </section>

        {/* Author section, visually distinct from the banner above */}
        {author && (
          <section className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-6 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
            {author.photo_url && (
              <img
                src={author.photo_url}
                alt={author.name}
                className="h-20 w-20 shrink-0 rounded-full border border-border object-cover"
              />
            )}
            <div className="flex flex-col gap-1">
              <p className="font-display text-base font-bold text-ink">{author.name}</p>
              {author.bio && <p className="font-body text-sm text-ink-muted">{author.bio}</p>}
            </div>
          </section>
        )}

        {/* Discussion */}
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold text-ink">Discussion</h2>
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
