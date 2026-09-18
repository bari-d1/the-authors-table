export const MAX_QUOTE_LENGTH = 280

// Applies the shareable-quote length cap to arbitrary text (a browser
// selection isn't bound by a textarea's maxLength, so this is the one place
// that actually enforces it, with enough info returned to tell the reader
// what happened rather than trimming silently).
export function capQuote(text) {
  const trimmed = text.trim()

  if (trimmed.length <= MAX_QUOTE_LENGTH) {
    return { text: trimmed, wasTrimmed: false }
  }

  return {
    text: trimmed.slice(0, MAX_QUOTE_LENGTH),
    wasTrimmed: true,
    originalLength: trimmed.length,
  }
}
