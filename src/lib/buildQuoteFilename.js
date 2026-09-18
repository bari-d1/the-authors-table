const MAX_SLUG_LENGTH = 40

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, '')
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  return `${datePart}-${timePart}`
}

// e.g. "covered-quote-20260918-121530.png" - descriptive and unique per
// download, so repeated downloads don't overwrite each other as
// "download.png"/"image.png" in the reader's downloads folder.
export function buildQuoteFilename(bookTitle) {
  const slug = bookTitle ? slugify(bookTitle) : ''
  const timestamp = formatTimestamp(new Date())

  return `${slug ? `${slug}-` : ''}quote-${timestamp}.png`
}
