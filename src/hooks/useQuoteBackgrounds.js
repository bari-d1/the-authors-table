import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'quote-backgrounds'

// Module-level cache: the template list rarely changes, so every mount of
// the picker re-listing the bucket would be wasteful. Fetched once per
// browser session (resets on a full page reload) and shared by every
// consumer instead of each running its own request.
let cachedBackgrounds = null
let inFlightRequest = null

async function fetchBackgrounds() {
  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    sortBy: { column: 'name', order: 'asc' },
  })

  if (error) throw new Error(error.message)

  return (data ?? [])
    // list() can include a placeholder pseudo-entry for an empty "folder"
    // (id: null); real objects always have an id.
    .filter((entry) => entry.id)
    .map((entry) => ({
      name: entry.name,
      url: supabase.storage.from(BUCKET).getPublicUrl(entry.name).data.publicUrl,
    }))
}

export function useQuoteBackgrounds() {
  const [backgrounds, setBackgrounds] = useState(cachedBackgrounds)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedBackgrounds !== null) return

    let cancelled = false
    if (!inFlightRequest) {
      inFlightRequest = fetchBackgrounds()
    }

    inFlightRequest
      .then((result) => {
        cachedBackgrounds = result
        if (!cancelled) setBackgrounds(result)
      })
      .catch((err) => {
        inFlightRequest = null // allow a retry on a future mount
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { backgrounds, error }
}
