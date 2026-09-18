import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Live grouped queries against comments and quote_cards, no stored
// counters table - computed fresh on every mount. Per-book breakdowns are
// done as one small count query per book (in parallel) rather than a
// single SQL GROUP BY, since there are only a handful of books and this
// avoids needing a view or RPC just for this.
export function useAdminMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: books, error: booksError } = await supabase
          .from('books')
          .select('id, title')
          .order('title')
        if (booksError) throw booksError

        const [commentsTotal, quoteCardsTotal] = await Promise.all([
          supabase.from('comments').select('*', { count: 'exact', head: true }),
          supabase.from('quote_cards').select('*', { count: 'exact', head: true }),
        ])
        if (commentsTotal.error) throw commentsTotal.error
        if (quoteCardsTotal.error) throw quoteCardsTotal.error

        const byBook = await Promise.all(
          (books ?? []).map(async (book) => {
            const [commentsCount, quoteCardsCount] = await Promise.all([
              supabase.from('comments').select('*', { count: 'exact', head: true }).eq('book_id', book.id),
              supabase.from('quote_cards').select('*', { count: 'exact', head: true }).eq('book_id', book.id),
            ])
            if (commentsCount.error) throw commentsCount.error
            if (quoteCardsCount.error) throw quoteCardsCount.error

            return {
              bookId: book.id,
              title: book.title,
              comments: commentsCount.count ?? 0,
              quoteCards: quoteCardsCount.count ?? 0,
            }
          }),
        )

        if (cancelled) return
        setMetrics({
          totalComments: commentsTotal.count ?? 0,
          totalQuoteCards: quoteCardsTotal.count ?? 0,
          byBook,
        })
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { metrics, error }
}
