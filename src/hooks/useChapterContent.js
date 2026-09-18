import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// A single chapter's full text, fetched by id only when chapterId itself
// changes (never on unrelated re-renders, e.g. a future search box typing
// against this same content). null chapterId means "nothing selected":
// content stays null so a cleared selection doesn't leave stale text
// sitting around.
export function useChapterContent(chapterId) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!chapterId) {
      setContent(null)
      setError(null)
      return
    }

    let cancelled = false
    setContent(null)
    setError(null)

    async function loadContent() {
      const { data, error: fetchError } = await supabase
        .from('chapters')
        .select('content')
        .eq('id', chapterId)
        .single()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setContent(data.content ?? '')
      }
    }

    loadContent()

    return () => {
      cancelled = true
    }
  }, [chapterId])

  return { content, error }
}
