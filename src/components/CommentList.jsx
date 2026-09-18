import { useEffect, useState } from 'react'
import { buildCommentTree } from '../lib/commentTree'
import { supabase } from '../lib/supabaseClient'
import CommentItem from './CommentItem'

function CommentList({ bookId, onSubmitReply }) {
  const [comments, setComments] = useState(null)
  const [error, setError] = useState(null)
  const [openReplyId, setOpenReplyId] = useState(null)

  function handleToggleReply(commentId) {
    setOpenReplyId((current) => (current === commentId ? null : commentId))
  }

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

  return (
    <ul>
      {tree.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          openReplyId={openReplyId}
          onToggleReply={handleToggleReply}
          onSubmitReply={onSubmitReply}
        />
      ))}
    </ul>
  )
}

export default CommentList
