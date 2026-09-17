import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function BookGallery() {
  useEffect(() => {
    supabase.auth.getSession().then(({ error }) => {
      if (error) {
        console.error('Supabase connectivity check failed:', error.message)
      } else {
        console.log('Supabase connectivity check: OK')
      }
    })
  }, [])

  return (
    <div>
      <h1>Book Gallery</h1>
    </div>
  )
}

export default BookGallery
