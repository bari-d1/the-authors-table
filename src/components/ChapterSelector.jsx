import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useChapters } from '../hooks/useChapters'

const PLACEHOLDER_CLASSES =
  'rounded-lg border border-border bg-white px-3 py-2 font-body text-sm text-ink-muted'

// Chapter picker for whichever book BookSelector chose. Stays disabled
// (styled the same as its other non-interactive states) until a bookId is
// passed in; the caller owns resetting its own selected-chapter state when
// bookId changes, this component only reflects whatever book it's given.
function ChapterSelector({ bookId, value, onChange }) {
  const { chapters, error } = useChapters(bookId)

  if (!bookId) {
    return <p className={PLACEHOLDER_CLASSES}>Choose a book to see its chapters.</p>
  }

  if (error) {
    return <p className={PLACEHOLDER_CLASSES}>Couldn't load chapters: {error}</p>
  }

  if (chapters === null) {
    return <p className={PLACEHOLDER_CLASSES}>Loading chapters…</p>
  }

  if (chapters.length === 0) {
    return <p className={PLACEHOLDER_CLASSES}>This book has no chapters yet.</p>
  }

  return (
    <FormControl fullWidth size="medium">
      <Select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) return <span style={{ color: 'var(--color-ink-muted)' }}>Choose a chapter…</span>
          const chapter = chapters.find((c) => c.id === selected)
          return chapter ? `Chapter ${chapter.number}: ${chapter.title}` : ''
        }}
        sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--color-ink)' }}
      >
        {chapters.map((chapter) => (
          <MenuItem key={chapter.id} value={chapter.id} sx={{ whiteSpace: 'normal' }}>
            Chapter {chapter.number}: {chapter.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default ChapterSelector
