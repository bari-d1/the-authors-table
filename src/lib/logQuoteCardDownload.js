import { supabase } from './supabaseClient'

// Fires a quote_cards insert for the metrics dashboard whenever a reader
// downloads a quote card. Purely a background log: never awaited by the
// download flow, never shown to the reader on success or failure. Skips the
// insert entirely (rather than attempting one that's guaranteed to fail)
// when there's no book context at all - book_id is NOT NULL in the schema,
// which happens if the reader types a quote via the free-type fallback
// before ever selecting a book. chapter_id is null whenever the quote
// didn't come from a chapter-text selection, regardless of whether a book
// happens to be loaded at the time.
export async function logQuoteCardDownload(bookId, chapterId) {
  if (!bookId) return

  try {
    const { error } = await supabase.from('quote_cards').insert({ book_id: bookId, chapter_id: chapterId ?? null })
    if (error) {
      console.error('logQuoteCardDownload: insert failed', error)
    }
  } catch (err) {
    console.error('logQuoteCardDownload: insert threw', err)
  }
}
