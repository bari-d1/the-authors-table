import { useBooks } from '../hooks/useBooks'

// Picks a book only, nothing else. The chapter selector and search box that
// will sit alongside this are separate, upcoming components; whatever page
// coordinates all three owns the selected book id and passes it down here
// as `value` / `onChange`, the same lifted-state shape those siblings will
// use.
function BookSelector({ value, onChange, disabled = false }) {
  const { books, error } = useBooks()

  if (error) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink">
        Couldn't load books: {error}
      </p>
    )
  }

  if (books === null) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted">
        Loading books…
      </p>
    )
  }

  if (books.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink-muted">
        No books available yet.
      </p>
    )
  }

  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-border bg-paper py-3 pl-3 pr-9 font-body text-sm text-ink focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
      >
        <option value="" disabled>
          Choose a book…
        </option>
        {books.map((book) => (
          <option key={book.id} value={book.id}>
            {book.title}
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

export default BookSelector
