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

    async function loadComments() {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('book_id', bookId)

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setComments(data)
      }
    }

    loadComments()

    return () => {
      cancelled = true
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
