//app/auth/popup/page.tsx



'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PopupAuth() {
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Notify the parent window that login was successful
        if (window.opener) {
          window.opener.postMessage({ type: 'oauth-success' }, window.location.origin)
          window.close() // Close the popup
        }
      } else {
        console.error('No active session')
      }
    }

    checkSession()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Logging in…</p>
    </div>
  )
}
