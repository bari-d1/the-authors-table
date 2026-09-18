import { formatRelativeTime } from '../lib/formatRelativeTime'
import CommentComposer from './CommentComposer'
import PillButton from './PillButton'
import PullQuote from './PullQuote'
import TagBadge from './TagBadge'

function CommentItem({ comment, depth = 0, openReplyId, onToggleReply, onSubmitReply }) {
  const isReplyOpen = openReplyId === comment.id

  async function handleReplySubmit(formData) {
    await onSubmitReply(formData)
    onToggleReply(comment.id)
  }

  return (
    <li className={depth > 0 ? 'mt-4 border-l border-border pl-4' : 'mt-4'}>
      <div className="rounded-sharp border border-border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {comment.hidden ? (
            <span className="font-body text-sm italic text-ink-muted">[comment removed]</span>
          ) : (
            <>
              <span className="font-heading text-sm font-bold text-ink">
                {comment.commenter_name}
              </span>
              {comment.question && <TagBadge>Question</TagBadge>}
            </>
          )}
          <span className="font-body text-xs text-ink-muted">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        {!comment.hidden && comment.question && (
          <PullQuote className="mt-3">{comment.content}</PullQuote>
        )}
        {!comment.hidden && !comment.question && (
          <p className="mt-2 font-body text-sm text-ink">{comment.content}</p>
        )}
        {!comment.hidden && (
          <div className="mt-3">
            <PillButton
              type="button"
              variant="secondary"
              className="px-3 py-1 text-xs"
              onClick={() => onToggleReply(comment.id)}
            >
              {isReplyOpen ? 'Cancel' : 'Reply'}
            </PillButton>
          </div>
        )}
      </div>

      {isReplyOpen && (
        <div className="mt-3">
          <CommentComposer
            parentId={comment.id}
            submitLabel="Post reply"
            onSubmit={handleReplySubmit}
          />
        </div>
      )}

      {comment.children.length > 0 && (
        <ul>
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              openReplyId={openReplyId}
              onToggleReply={onToggleReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default CommentItem
