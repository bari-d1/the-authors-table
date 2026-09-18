import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PillButton from './PillButton'

const fieldClasses =
  'w-full rounded-lg border border-border bg-paper p-3 font-body text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60'

// Single shared admin account, not self-registration - no sign-up flow
// here, just email + password against the account created directly via the
// Supabase Auth API.
function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      // Deliberately generic: never reveal whether the email exists or the
      // password was the part that was wrong.
      setError('Incorrect email or password.')
      setSubmitting(false)
      return
    }
    // On success, useAuthSession's onAuthStateChange listener picks up the
    // new session and RequireAuth swaps in the dashboard on its own.
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="mb-6 text-center font-display text-2xl font-bold text-ink">Admin login</h1>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={submitting}
          placeholder="Email"
          autoComplete="username"
          className={fieldClasses}
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={submitting}
          placeholder="Password"
          autoComplete="current-password"
          className={fieldClasses}
        />
        {error && <p className="font-body text-sm text-tag-plum">{error}</p>}
        <PillButton type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </PillButton>
      </form>
    </div>
  )
}

export default AdminLoginForm
