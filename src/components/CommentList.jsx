import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { useEffect, useState } from 'react'
import { buildCommentTree } from '../lib/commentTree'
import { supabase } from '../lib/supabaseClient'
import CommentItem from './CommentItem'
import PillButton from './PillButton'

// Select values have to be primitives MUI can compare by identity, but
// filters.chapterId also needs to carry a real `null` (General / book-level
// comments) - these two sentinels bridge between that and the select's
// string-only value space.
const ALL_CHAPTERS_VALUE = 'all'
const GENERAL_VALUE = 'general'

const DEFAULT_FILTERS = { question: false, chapterId: 'all' }

function CommentList({ bookId, onSubmitReply }) {
  const [comments, setComments] = useState(null)
  const [error, setError] = useState(null)
  const [openReplyId, setOpenReplyId] = useState(null)
  const [chapters, setChapters] = useState([])
  // chapterId: 'all' (no chapter filter), null (General / book-level
  // comments), or a real chapter id. Kept as one object, not two separate
  // toggles, so the question and chapter filters combine rather than
  // fighting each other.
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  function handleToggleReply(commentId) {
    setOpenReplyId((current) => (current === commentId ? null : commentId))
  }

  // Explicit reset (rather than relying on the parent page's loading-state
  // branching to remount this component) so filters never carry over from
  // one book's thread to another's.
  useEffect(() => {
    setFilters(DEFAULT_FILTERS)
  }, [bookId])

  // Populates the chapter filter's options. Independent of the comments
  // fetch/subscription above; chapters don't need realtime.
  useEffect(() => {
    let cancelled = false

    async function loadChapters() {
      const { data } = await supabase
        .from('chapters')
        .select('id, number, title')
        .eq('book_id', bookId)
        .order('number')

      if (cancelled) return
      setChapters(data ?? [])
    }

    loadChapters()

    return () => {
      cancelled = true
    }
  }, [bookId])

  useEffect(() => {
    let cancelled = false
    // Events can arrive over the realtime channel before the initial fetch
    // resolves (the channel handshake and the REST fetch race each other).
    // Queue anything that shows up early and merge it in once the fetch
    // lands, instead of dropping it or letting the fetch clobber it.
    let initialLoadDone = false
    const pendingEvents = []

    function applyInsert(row) {
      setComments((current) => {
        if (!current) return current
        if (current.some((existing) => existing.id === row.id)) return current
        return [...current, row]
      })
    }

    function applyUpdate(row) {
      setComments((current) => {
        if (!current) return current
        return current.map((existing) => (existing.id === row.id ? row : existing))
      })
    }

    const channel = supabase
      .channel(`comments-book-${bookId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (!initialLoadDone) {
            pendingEvents.push({ type: 'INSERT', row: payload.new })
            return
          }
          applyInsert(payload.new)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `book_id=eq.${bookId}` },
        (payload) => {
          if (!initialLoadDone) {
            pendingEvents.push({ type: 'UPDATE', row: payload.new })
            return
          }
          applyUpdate(payload.new)
        },
      )
      .subscribe()

    async function loadComments() {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('book_id', bookId)

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        initialLoadDone = true
        return
      }

      let merged = data
      for (const event of pendingEvents) {
        if (event.type === 'INSERT') {
          if (!merged.some((existing) => existing.id === event.row.id)) {
            merged = [...merged, event.row]
          }
        } else {
          merged = merged.map((existing) => (existing.id === event.row.id ? event.row : existing))
        }
      }

      setComments(merged)
      initialLoadDone = true
    }

    loadComments()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [bookId])

  if (error) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink">
        Something went wrong loading comments: {error}
      </p>
    )
  }

  if (comments === null) {
    return <p className="text-center font-body text-ink-muted">Loading comments…</p>
  }

  const tree = buildCommentTree(comments)

  if (tree.length === 0) {
    return (
      <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
        No comments yet. Be the first to join the discussion.
      </p>
    )
  }

  // Only each root's own flags decide inclusion; a qualifying comment's full
  // reply chain (even replies that don't themselves match) comes along with
  // it since children are already nested inside each root node.
  function chapterMatches(comment) {
    if (filters.chapterId === 'all') return true
    if (filters.chapterId === null) return comment.chapter_id === null
    return comment.chapter_id === filters.chapterId
  }

  const visibleTree = tree.filter((comment) => {
    if (filters.question && !comment.question) return false
    if (!chapterMatches(comment)) return false
    return true
  })

  const filtersActive = filters.question || filters.chapterId !== 'all'

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <PillButton
          type="button"
          variant={!filters.question ? 'primary' : 'secondary'}
          onClick={() => setFilters((prev) => ({ ...prev, question: false }))}
        >
          All comments
        </PillButton>
        <PillButton
          type="button"
          variant={filters.question ? 'primary' : 'secondary'}
          onClick={() => setFilters((prev) => ({ ...prev, question: true }))}
        >
          Questions for the author
        </PillButton>
      </div>

      <div className="mb-4">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select
            value={
              filters.chapterId === 'all'
                ? ALL_CHAPTERS_VALUE
                : filters.chapterId === null
                  ? GENERAL_VALUE
                  : filters.chapterId
            }
            onChange={(event) => {
              const raw = event.target.value
              const chapterId =
                raw === ALL_CHAPTERS_VALUE ? 'all' : raw === GENERAL_VALUE ? null : raw
              setFilters((prev) => ({ ...prev, chapterId }))
            }}
            sx={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--color-ink)' }}
          >
            <MenuItem value={ALL_CHAPTERS_VALUE}>All chapters</MenuItem>
            <MenuItem value={GENERAL_VALUE}>General</MenuItem>
            {chapters.map((chapter) => (
              <MenuItem key={chapter.id} value={chapter.id} sx={{ whiteSpace: 'normal' }}>
                {chapter.number}. {chapter.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {visibleTree.length === 0 ? (
        <p className="rounded-sharp border border-border bg-white px-6 py-8 text-center font-body text-ink-muted">
          {filtersActive ? 'No comments match these filters.' : 'No comments yet. Be the first to join the discussion.'}
        </p>
      ) : (
        <ul>
          {visibleTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              openReplyId={openReplyId}
              onToggleReply={handleToggleReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default CommentList
