import { useState } from 'react'
import PillButton from './PillButton'

const CONTENT_MAX_LENGTH = 2000
const COUNTER_WARNING_THRESHOLD = 200
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY_FORM = {
  content: '',
  commenterName: '',
  question: false,
  readerEmail: '',
}

// Collects a new comment or reply and hands the data off via onSubmit.
// Doesn't talk to Supabase itself, that's separate wiring; parentId is
// null for a top-level comment or an existing comment's id for a reply.
function CommentComposer({ parentId = null, onSubmit, submitLabel = 'Post comment' }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    if (!form.content.trim()) {
      return 'Please write a comment before posting.'
    }
    if (form.content.length > CONTENT_MAX_LENGTH) {
      return `Comments must be ${CONTENT_MAX_LENGTH} characters or fewer.`
    }
    if (!form.commenterName.trim()) {
      return 'Please enter your name.'
    }
    if (form.question) {
      if (!form.readerEmail.trim()) {
        return 'Questions for Joshua Komolafe need an email so a reply can reach you.'
      }
      if (!EMAIL_PATTERN.test(form.readerEmail.trim())) {
        return 'Please enter a valid email address.'
      }
    }
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await onSubmit({
        content: form.content.trim(),
        commenterName: form.commenterName.trim(),
        question: form.question,
        readerEmail: form.question ? form.readerEmail.trim() : null,
        parentId,
      })
      setForm(EMPTY_FORM)
    } catch (submitError) {
      setError(
        submitError?.message || 'Something went wrong posting your comment. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const remaining = CONTENT_MAX_LENGTH - form.content.length
  const counterIsWarning = remaining <= COUNTER_WARNING_THRESHOLD

  const fieldClasses =
    'w-full rounded-lg border border-border bg-white p-3 font-body text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-60'

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 rounded-sharp border border-border bg-white p-4"
    >
      <div>
        <textarea
          value={form.content}
          onChange={(event) => updateField('content', event.target.value)}
          maxLength={CONTENT_MAX_LENGTH}
          required
          disabled={submitting}
          placeholder="Share your thoughts…"
          rows={4}
          className={fieldClasses}
        />
        <div
          className={`mt-1 text-right font-body text-xs ${
            counterIsWarning ? 'text-error' : 'text-ink-muted'
          }`}
        >
          {form.content.length} / {CONTENT_MAX_LENGTH}
        </div>
      </div>

      <input
        type="text"
        value={form.commenterName}
        onChange={(event) => updateField('commenterName', event.target.value)}
        required
        disabled={submitting}
        placeholder="Your name"
        className={fieldClasses}
      />

      <label className="flex items-center gap-2 font-body text-sm text-ink">
        <input
          type="checkbox"
          checked={form.question}
          onChange={(event) => updateField('question', event.target.checked)}
          disabled={submitting}
        />
        This is a question for Joshua Komolafe
      </label>

      {form.question && (
        <input
          type="email"
          value={form.readerEmail}
          onChange={(event) => updateField('readerEmail', event.target.value)}
          required
          disabled={submitting}
          placeholder="Your email, so a reply can reach you"
          className={fieldClasses}
        />
      )}

      {error && <p className="font-body text-sm text-error">{error}</p>}

      <div>
        <PillButton type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Posting…' : submitLabel}
        </PillButton>
      </div>
    </form>
  )
}

export default CommentComposer
