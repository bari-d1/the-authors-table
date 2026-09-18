// The dark teal panel + italic serif treatment, reused wherever something
// needs to be visually pulled out as a highlight - a featured line from
// the book, or (its first real use) a comment flagged as a question for
// Joshua Komolafe. Available for other uses (an admin-selected featured
// quote, etc.) even where it isn't applied yet.
function PullQuote({ children, className = '' }) {
  return (
    <blockquote className={`bg-teal px-6 py-6 font-heading text-lg italic leading-snug text-white sm:px-8 ${className}`}>
      {children}
    </blockquote>
  )
}

export default PullQuote
