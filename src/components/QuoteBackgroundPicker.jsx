import { useEffect } from 'react'
import { useQuoteBackgrounds } from '../hooks/useQuoteBackgrounds'

const PLACEHOLDER_CLASSES =
  'rounded-lg border border-border bg-white px-3 py-2 font-body text-sm text-ink-muted'

// Background template picker for the quote-share flow. value/onChange are
// the shared "selected background" state (a public Storage URL), the same
// shape selectedQuote uses, so the canvas rendering step (upcoming work)
// can read both from one place.
function QuoteBackgroundPicker({ value, onChange }) {
  const { backgrounds, error } = useQuoteBackgrounds()

  // Default to the first template as soon as the list loads, so the share
  // flow always has a valid background rather than starting on nothing.
  useEffect(() => {
    if (value === null && backgrounds && backgrounds.length > 0) {
      onChange(backgrounds[0].url)
    }
  }, [backgrounds, value, onChange])

  if (error) {
    return <p className={PLACEHOLDER_CLASSES}>Couldn't load background templates: {error}</p>
  }

  if (backgrounds === null) {
    return <p className={PLACEHOLDER_CLASSES}>Loading background templates…</p>
  }

  if (backgrounds.length === 0) {
    return <p className={PLACEHOLDER_CLASSES}>No background templates are available right now.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {backgrounds.map((background) => {
        const isSelected = background.url === value
        return (
          <button
            key={background.name}
            type="button"
            onClick={() => onChange(background.url)}
            aria-pressed={isSelected}
            aria-label={`Use background: ${background.name}`}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus:outline-none focus:ring-1 focus:ring-black ${
              isSelected ? 'border-teal' : 'border-border hover:border-ink-muted'
            }`}
          >
            <img src={background.url} alt="" className="h-full w-full object-cover" />
            {isSelected && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] leading-none text-white">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default QuoteBackgroundPicker
