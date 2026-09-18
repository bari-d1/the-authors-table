import { useChapters } from '../hooks/useChapters'

// Chapter picker for whichever book BookSelector chose. Stays disabled
// (styled the same as its other non-interactive states) until a bookId is
// passed in; the caller owns resetting its own selected-chapter state when
// bookId changes, this component only reflects whatever book it's given.
function ChapterSelector({ bookId, value, onChange }) {
  const { chapters, error } = useChapters(bookId)

  if (!bookId) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted">
        Choose a book to see its chapters.
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink">
        Couldn't load chapters: {error}
      </p>
    )
  }

  if (chapters === null) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted">
        Loading chapters…
      </p>
    )
  }

  if (chapters.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted">
        This book has no chapters yet.
      </p>
    )
  }

  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full appearance-none rounded-lg border border-border bg-paper py-3 pl-3 pr-9 font-body text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
      >
        <option value="" disabled>
          Choose a chapter…
        </option>
        {chapters.map((chapter) => (
          <option key={chapter.id} value={chapter.id}>
            Chapter {chapter.number}: {chapter.title}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
      >
        ▾
      </span>
    </div>
  )
}

export default ChapterSelector
