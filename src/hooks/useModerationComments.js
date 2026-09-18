import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const PAGE_SIZE = 50

async function fetchPage(offset) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, book_id, commenter_name, content, question, hidden, created_at, books(title)')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) throw error
  return data ?? []
}

// Recent comments across all books, most recent first, paginated 50 at a
// time rather than loaded all at once. Owns the hide/unhide mutation too,
// since it's the thing holding the array that needs updating afterward.
export function useModerationComments() {
  const [comments, setComments] = useState(null)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadFirstPage() {
      try {
        const data = await fetchPage(0)
        if (cancelled) return
        setComments(data)
        setHasMore(data.length === PAGE_SIZE)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    loadFirstPage()

    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || comments === null) return

    setLoadingMore(true)
    try {
      const data = await fetchPage(comments.length)
      setComments((prev) => [...(prev ?? []), ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }, [comments, hasMore, loadingMore])

  // Optimistic: flips the row immediately, rolls back if the update
  // actually fails (e.g. a session that expired mid-action) so the panel
  // never shows a state that isn't what's really in the database.
  const toggleHidden = useCallback(async (id, currentHidden) => {
    const nextHidden = !currentHidden
    setComments((prev) => prev?.map((c) => (c.id === id ? { ...c, hidden: nextHidden } : c)) ?? prev)

    const { error: updateError } = await supabase.from('comments').update({ hidden: nextHidden }).eq('id', id)

    if (updateError) {
      setComments((prev) => prev?.map((c) => (c.id === id ? { ...c, hidden: currentHidden } : c)) ?? prev)
      throw updateError
    }
  }, [])

  return { comments, error, hasMore, loadingMore, loadMore, toggleHidden }
}
