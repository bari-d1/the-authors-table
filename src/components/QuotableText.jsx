import { useEffect, useRef, useState } from 'react'

const BUTTON_OFFSET = 44

// Wraps a block of rendered text and shows a small "Share this quote"
// button near whatever the reader selects inside it, using the browser's
// native text selection (works the same for a mouse drag, a keyboard
// selection, or a touch long-press/drag-handle selection on mobile) rather
// than a custom selection UI. Selections outside this block are ignored.
function QuotableText({ children, onShareQuote }) {
  const containerRef = useRef(null)
  const [popover, setPopover] = useState(null) // { text, top, left } | null

  useEffect(() => {
    function updateFromSelection() {
      const selection = window.getSelection()
      const container = containerRef.current

      if (!container || !selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPopover(null)
        return
      }

      const text = selection.toString().trim()
      if (!text) {
        setPopover(null)
        return
      }

      // Ignore selections elsewhere on the page (e.g. the header), only
      // react to ones actually inside this block.
      if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) {
        setPopover(null)
        return
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setPopover(null)
        return
      }

      // position: fixed, so these are viewport-relative (no scroll offset
      // added); re-run on scroll so the button tracks the selection instead
      // of drifting once the page moves. Prefer sitting above the
      // selection, but flip below it when there isn't room - a selection
      // starting right at the top of the viewport would otherwise push the
      // button off-screen entirely.
      const fitsAbove = rect.top - BUTTON_OFFSET >= 0
      setPopover({
        text,
        top: fitsAbove ? rect.top - BUTTON_OFFSET : rect.bottom + 12,
        left: rect.left + rect.width / 2,
      })
    }

    document.addEventListener('selectionchange', updateFromSelection)
    window.addEventListener('scroll', updateFromSelection, true)

    return () => {
      document.removeEventListener('selectionchange', updateFromSelection)
      window.removeEventListener('scroll', updateFromSelection, true)
    }
  }, [])

  function handleShare() {
    if (!popover) return
    onShareQuote(popover.text)
    setPopover(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div ref={containerRef} className="relative">
      {children}
      {popover && (
        <button
          type="button"
          // Prevents the tap/click from collapsing the selection before the
          // click handler runs - on mobile in particular, a plain onClick
          // can lose the selection (and this button along with it) the
          // instant the reader touches down on it.
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleShare}
          style={{ top: popover.top, left: popover.left }}
          className="label-tracked fixed z-50 -translate-x-1/2 whitespace-nowrap rounded-sharp bg-black px-5 py-3 text-xs text-white"
        >
          Share this quote
        </button>
      )}
    </div>
  )
}

export default QuotableText
