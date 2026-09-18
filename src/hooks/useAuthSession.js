import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// undefined = not checked yet, null = checked, no session, object = signed
// in. Distinguishing "not checked" from "checked, no session" is what lets
// RequireAuth show a loading state instead of flashing the login form
// before the initial check resolves.
export function useAuthSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!cancelled) setSession(newSession)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading: session === undefined }
}
