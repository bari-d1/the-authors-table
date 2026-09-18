import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useBooks } from '../hooks/useBooks'

const PLACEHOLDER_CLASSES =
  'rounded-lg border border-border bg-white px-3 py-2 font-body text-sm text-ink-muted'

// Picks a book only, nothing else. The chapter selector and search box that
// will sit alongside this are separate, upcoming components; whatever page
// coordinates all three owns the selected book id and passes it down here
// as `value` / `onChange`, the same lifted-state shape those siblings will
// use.
//
// A real MUI Select, not a styled native <select> - this is exactly the
// "dropdown select" category MUI is scoped to here (keyboard-accessible
// listbox, focus management) rather than something worth hand-building.
function BookSelector({ value, onChange, disabled = false }) {
  const { books, error } = useBooks()

  if (error) {
    return <p className={PLACEHOLDER_CLASSES}>Couldn't load books: {error}</p>
  }

  if (books === null) {
    return <p className={PLACEHOLDER_CLASSES}>Loading books…</p>
  }

  if (books.length === 0) {
    return <p className={PLACEHOLDER_CLASSES}>No books available yet.</p>
  }

  return (
    <FormControl fullWidth disabled={disabled} size="medium">
      <Select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) return <span style={{ color: 'var(--color-ink-muted)' }}>Choose a book…</span>
          return books.find((book) => book.id === selected)?.title ?? ''
        }}
        sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--color-ink)' }}
      >
        {books.map((book) => (
          <MenuItem key={book.id} value={book.id} sx={{ whiteSpace: 'normal' }}>
            {book.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default BookSelector
