import { useState } from 'react'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { useModerationComments } from '../hooks/useModerationComments'
import PillButton from './PillButton'

function ModerationPanel() {
  const { comments, error, hasMore, loadingMore, loadMore, toggleHidden } = useModerationComments()
  const [togglingId, setTogglingId] = useState(null)
  const [toggleError, setToggleError] = useState(null)
  const [questionOnly, setQuestionOnly] = useState(false)

  async function handleToggle(comment) {
    setToggleError(null)
    setTogglingId(comment.id)
    try {
      await toggleHidden(comment.id, comment.hidden)
    } catch (err) {
      setToggleError(`Couldn't update that comment: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  if (error) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink">
        Couldn't load comments: {error}
      </p>
    )
  }

  if (comments === null) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
        Loading comments…
      </p>
    )
  }

  const visibleComments = questionOnly ? comments.filter((comment) => comment.question) : comments

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-bold text-ink">Recent comments</h3>
        <PillButton
          type="button"
          variant={questionOnly ? 'primary' : 'secondary'}
          onClick={() => setQuestionOnly((value) => !value)}
        >
          {questionOnly ? 'Showing questions only' : 'Show questions only'}
        </PillButton>
      </div>

      {toggleError && <p className="mb-3 font-body text-sm text-error">{toggleError}</p>}

      {visibleComments.length === 0 ? (
        <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
          {questionOnly ? 'No comments flagged as questions.' : 'No comments yet.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visibleComments.map((comment) => (
            <li
              key={comment.id}
              className={`border p-3 ${
                comment.question ? 'border-teal bg-white' : 'border-border bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-body text-xs text-ink-muted">
                    <span>{comment.books?.title ?? 'Unknown book'}</span>
                    <span>·</span>
                    <span>{comment.commenter_name}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(comment.created_at)}</span>
                    {comment.question && <span className="label-tracked text-teal">· Question for PJK</span>}
                  </p>
                  <p className="mt-1 font-body text-sm text-ink">
                    {comment.hidden ? (
                      <span className="italic text-ink-muted">[hidden]</span>
                    ) : (
                      comment.content
                    )}
                  </p>
                </div>
                <PillButton
                  type="button"
                  variant="secondary"
                  onClick={() => handleToggle(comment)}
                  disabled={togglingId === comment.id}
                  className="shrink-0"
                >
                  {togglingId === comment.id ? '…' : comment.hidden ? 'Unhide' : 'Hide'}
                </PillButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !questionOnly && (
        <div className="mt-4 flex justify-center">
          <PillButton type="button" variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </PillButton>
        </div>
      )}
    </div>
  )
}

export default ModerationPanel
