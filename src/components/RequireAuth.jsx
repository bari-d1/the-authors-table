import { useAuthSession } from '../hooks/useAuthSession'
import AdminLoginForm from './AdminLoginForm'

// Gates its children behind an active Supabase Auth session. children are
// the actual protected content (metrics + moderation) - the login form is
// never itself wrapped in this, it's what gets shown instead when there's
// no session, not something rendered behind the same gate it's standing in
// for.
function RequireAuth({ children }) {
  const { session, loading } = useAuthSession()

  if (loading) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24 text-center">
        <p className="font-body text-sm text-ink-muted">Checking session…</p>
      </div>
    )
  }

  if (!session) {
    return <AdminLoginForm />
  }

  return children
}

export default RequireAuth
