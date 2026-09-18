import { formatRelativeTime } from '../lib/formatRelativeTime'
import TagBadge from './TagBadge'

function CommentItem({ comment, depth = 0 }) {
  return (
    <li className={depth > 0 ? 'mt-4 border-l border-border pl-4' : 'mt-4'}>
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          {comment.hidden ? (
            <span className="font-body text-sm italic text-ink-muted">[comment removed]</span>
          ) : (
            <>
              <span className="font-display text-sm font-bold text-ink">
                {comment.commenter_name}
              </span>
              {comment.question && <TagBadge color="slate">Question</TagBadge>}
            </>
          )}
          <span className="font-body text-xs text-ink-muted">
            {formatRelativeTime(comment.created_at)}
          </span>
        </div>
        {!comment.hidden && (
          <p className="mt-2 font-body text-sm text-ink">{comment.content}</p>
        )}
      </div>

      {comment.children.length > 0 && (
        <ul>
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default CommentItem
