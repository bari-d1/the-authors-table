import { formatRelativeTime } from '../lib/formatRelativeTime'
import CommentComposer from './CommentComposer'
import PillButton from './PillButton'
import TagBadge from './TagBadge'

// The iMessage-style glass bubble the comment text renders in. Two tints -
// plain "ink" glass for ordinary comments, teal glass for ones flagged as a
// question for the author - both built the same way: a translucent
// gradient fill, backdrop-blur so it actually reads as glass over whatever
// scrolls behind it, an inner top highlight to fake a curved-glass sheen,
// and a small rounded "tail" nub (the ::before) at the bottom corner, the
// way an iMessage bubble points back at its sender.
const BUBBLE_BASE =
  "relative mt-1.5 inline-block max-w-full rounded-[20px] px-4 py-3 font-body text-sm leading-relaxed backdrop-blur-xl before:absolute before:-bottom-1 before:h-3 before:w-3 before:rounded-full before:backdrop-blur-xl before:content-['']"

const BUBBLE_TINT = {
  question:
    'left-4 border border-white/30 bg-gradient-to-br from-teal/85 to-teal/60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-10px_rgba(15,15,15,0.45)] before:left-4 before:border before:border-white/20 before:bg-teal/65',
  plain:
    'left-4 border border-white/70 bg-gradient-to-br from-white/85 to-white/50 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_-10px_rgba(15,15,15,0.2)] before:left-4 before:border before:border-white/60 before:bg-white/60',
}

function CommentItem({ comment, depth = 0, openReplyId, onToggleReply, onSubmitReply }) {
  const isReplyOpen = openReplyId === comment.id

  async function handleReplySubmit(formData) {
    await onSubmitReply(formData)
    onToggleReply(comment.id)
  }

  return (
    <li className={depth > 0 ? 'mt-4 pl-6' : 'mt-4'}>
      <div className="flex flex-wrap items-center gap-2 px-1">
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

      {!comment.hidden && (
        <div className={`${BUBBLE_BASE} ${comment.question ? BUBBLE_TINT.question : BUBBLE_TINT.plain}`}>
          {comment.content}
        </div>
      )}

      {!comment.hidden && (
        <div className="mt-2 pl-1">
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
