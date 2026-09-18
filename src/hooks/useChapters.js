import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Chapters for one book, ordered by number. null bookId means "no book
// chosen yet": chapters stays null (not an empty array) so callers can tell
// "nothing selected" apart from "selected, still loading" apart from
// "selected, loaded, zero chapters".
export function useChapters(bookId) {
  const [chapters, setChapters] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!bookId) {
      setChapters(null)
      setError(null)
      return
    }

    let cancelled = false
    setChapters(null)
    setError(null)

    async function loadChapters() {
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('id, number, title')
        .eq('book_id', bookId)
        .order('number')

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setChapters(data)
      }
    }

    loadChapters()

    return () => {
      cancelled = true
    }
  }, [bookId])

  return { chapters, error }
}
