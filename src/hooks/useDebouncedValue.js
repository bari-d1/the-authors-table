import { useEffect, useState } from 'react'

// Returns `value`, but only after it's stopped changing for `delayMs`. Used
// to hold off re-searching until the reader pauses typing instead of
// re-running the search on every keystroke.
export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
