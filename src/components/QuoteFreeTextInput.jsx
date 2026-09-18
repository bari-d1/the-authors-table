import { MAX_QUOTE_LENGTH } from '../lib/capQuote'

const COUNTER_WARNING_THRESHOLD = 40

// The typed/pasted fallback for getting a quote into the share flow, for a
// reader not currently viewing a chapter (or who'd just rather type it).
// Directly bound to the same shared quote value QuotableText writes to, so
// both paths land in one place: this box is the editable view of whichever
// quote is currently selected, however it got there.
function QuoteFreeTextInput({ value, onChange }) {
  const remaining = MAX_QUOTE_LENGTH - value.length
  const counterIsWarning = remaining <= COUNTER_WARNING_THRESHOLD

  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_QUOTE_LENGTH}
        rows={3}
        placeholder="Or type or paste a line to share…"
        className="w-full rounded-lg border border-border bg-paper p-3 font-body text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-gold"
      />
      <div
        className={`mt-1 text-right font-body text-xs ${counterIsWarning ? 'text-tag-plum' : 'text-ink-muted'}`}
      >
        {value.length} / {MAX_QUOTE_LENGTH}
      </div>
    </div>
  )
}

export default QuoteFreeTextInput
