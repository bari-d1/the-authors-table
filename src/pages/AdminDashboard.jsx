import Layout from '../components/Layout'
import MetricsPanel from '../components/MetricsPanel'
import ModerationPanel from '../components/ModerationPanel'
import PillButton from '../components/PillButton'
import RequireAuth from '../components/RequireAuth'
import { supabase } from '../lib/supabaseClient'

function AdminDashboardContent() {
  function handleLogOut() {
    supabase.auth.signOut()
    // No navigation needed: useAuthSession's onAuthStateChange listener
    // picks up the cleared session and RequireAuth swaps back to the login
    // form on its own.
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">Admin dashboard</h1>
        <PillButton type="button" variant="secondary" onClick={handleLogOut}>
          Log out
        </PillButton>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Metrics</h2>
        <MetricsPanel />
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Moderation</h2>
        <ModerationPanel />
      </section>
    </div>
  )
}

// The login form (rendered by RequireAuth when there's no session) doesn't
// need the site chrome the protected dashboard does, so Layout wraps
// everything at this top level rather than living inside RequireAuth.
function AdminDashboard() {
  return (
    <Layout>
      <RequireAuth>
        <AdminDashboardContent />
      </RequireAuth>
    </Layout>
  )
}

export default AdminDashboard
