import { useMemo } from 'react'
import { createChapterSearch } from '../lib/createChapterSearch'

// Rebuilds the paragraph index + Fuse instance only when chapterContent
// itself changes, so typing in a future search box searches against the
// same instance rather than reconstructing it per keystroke.
export function useChapterSearch(chapterContent) {
  return useMemo(() => createChapterSearch(chapterContent), [chapterContent])
}
