// hooks/useClientSession.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useClientSession() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)
  const supabase = createClient()

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        setUser(null)
        return
      }
      
      if (session) {
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000
          if (Date.now() >= expiresAt) {
            const { data: refreshed } = await supabase.auth.refreshSession()
            setUser(refreshed.session?.user || null)
          } else {
            setUser(session.user)
          }
        } else {
          setUser(session.user)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setSessionChecked(true)
    }
  }, [supabase.auth])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab visible, checking session...')
        checkSession()
      }
    }

    const handleFocus = () => {
      console.log('Window focused, checking session...')
      checkSession()
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('supabase.auth.token')) {
        console.log('Auth changed in another tab, syncing...')
        checkSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)

    checkSession()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [checkSession])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return { user, isLoading, sessionChecked, checkSession }
}