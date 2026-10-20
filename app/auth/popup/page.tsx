'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Film } from 'lucide-react'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink-950 text-white">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400 text-ink-950">
        <Film size={22} />
      </span>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
      <p className="text-sm text-gray-400">Logging in…</p>
    </div>
  )
}