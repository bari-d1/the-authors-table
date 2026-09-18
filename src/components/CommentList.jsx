import { useEffect, useState } from 'react'
import { buildCommentTree } from '../lib/commentTree'
import { supabase } from '../lib/supabaseClient'
import CommentItem from './CommentItem'
import PillButton from './PillButton'

function CommentList({ bookId, onSubmitReply }) {
  const [comments, setComments] = useState(null)
  const [error, setError] = useState(null)
  const [openReplyId, setOpenReplyId] = useState(null)
  const [filter, setFilter] = useState('all')

  function handleToggleReply(commentId) {
    setOpenReplyId((current) => (current === commentId ? null : commentId))
  }

  // Explicit reset (rather than relying on the parent page's loading-state
  // branching to remount this component) so the filter never carries over
  // from one book's thread to another's.
  useEffect(() => {
    setFilter('all')
  }, [bookId])

  useEffect(() => {
    let cancelled = false
    // Events can arrive over the realtime channel before the initial fetch
    // resolves (the channel handshake and the REST fetch race each other).
    // Queue anything that shows up early and merge it in once the fetch
    // lands, instead of dropping it or letting the fetch clobber it.
    let initialLoadDone = false
    const pendingEvents = []

    function applyInsert(row) {
      setComments((current) => {
        if (!current) return current
        if (current.some((existing) => existing.id === row.id)) return current
        return [...current, row]
      })
    }

    function applyUpdate(row) {
      setComments((current) => {
        if (!current) return current
        return current.map((existing) => (existing.id === row.id ? row : existing))
      })
    }

    const channel = supabase
      .channel(`comments-book-${bookId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (!initialLoadDone) {
            pendingEvents.push({ type: 'INSERT', row: payload.new })
            return
          }
          applyInsert(payload.new)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (!initialLoadDone) {
            pendingEvents.push({ type: 'UPDATE', row: payload.new })
            return
          }
          applyUpdate(payload.new)
        },
      )
      .subscribe()

    async function loadComments() {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('book_id', bookId)

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        initialLoadDone = true
        return
      }

      let merged = data
      for (const event of pendingEvents) {
        if (event.type === 'INSERT') {
          if (!merged.some((existing) => existing.id === event.row.id)) {
            merged = [...merged, event.row]
          }
        } else {
          merged = merged.map((existing) => (existing.id === event.row.id ? event.row : existing))
        }
      }

      setComments(merged)
      initialLoadDone = true
    }

    loadComments()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [bookId])

  if (error) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink">
        Something went wrong loading comments: {error}
      </p>
    )
  }

  if (comments === null) {
    return <p className="text-center font-body text-ink-muted">Loading comments…</p>
  }

  const tree = buildCommentTree(comments)

  if (tree.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink-muted">
        No comments yet. Be the first to join the discussion.
      </p>
    )
  }

  // Only the top-level flag decides inclusion; a qualifying question's full
  // reply chain (including replies that aren't themselves questions) comes
  // along with it since children are already nested inside each root node.
  const visibleTree = filter === 'questions' ? tree.filter((comment) => comment.question) : tree

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <PillButton
          type="button"
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
        >
          All comments
        </PillButton>
        <PillButton
          type="button"
          variant={filter === 'questions' ? 'primary' : 'secondary'}
          onClick={() => setFilter('questions')}
        >
          Questions for the author
        </PillButton>
      </div>

      {visibleTree.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface px-6 py-8 text-center font-body text-ink-muted">
          No questions for the author yet.
        </p>
      ) : (
        <ul>
          {visibleTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              openReplyId={openReplyId}
              onToggleReply={handleToggleReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default CommentList
