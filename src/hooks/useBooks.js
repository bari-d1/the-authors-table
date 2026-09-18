import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Shared books fetch: null while loading, an array (possibly empty) once
// resolved, so every consumer (gallery, selectors, etc.) reads books the
// same way instead of each running its own copy of this effect.
export function useBooks() {
  const [books, setBooks] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadBooks() {
      const { data, error: fetchError } = await supabase.from('books').select('*')

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setBooks(data)
      }
    }

    loadBooks()

    return () => {
      cancelled = true
    }
  }, [])

  return { books, error }
}
