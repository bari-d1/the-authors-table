import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Single shared author row, no id needed - there's exactly one author on
// this site. Used both for the byline on a book's page and for the full
// bio on the gallery page.
export function useAuthor() {
  const [author, setAuthor] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error: fetchError } = await supabase.from('author').select('*').maybeSingle()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setAuthor(data)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { author, error }
}
