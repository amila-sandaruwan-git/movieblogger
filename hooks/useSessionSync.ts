// hooks/useSessionSync.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useSessionSync() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionValid, setSessionValid] = useState(true)
  const supabase = createClient()

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        return
      }
      
      if (session) {
        if (session.expires_at) {
          const expiresAt = session.expires_at * 1000
          if (Date.now() >= expiresAt) {
            const { data: refreshed } = await supabase.auth.refreshSession()
            if (refreshed.session) {
              setUser(refreshed.user)
              setSessionValid(true)
            } else {
              setUser(null)
              setSessionValid(false)
            }
          } else {
            setUser(session.user)
            setSessionValid(true)
          }
        } else {
          setUser(session.user)
          setSessionValid(true)
        }
      } else {
        setUser(null)
        setSessionValid(false)
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      setUser(null)
      setSessionValid(false)
    } finally {
      setIsLoading(false)
    }
  }, [supabase.auth])

  useEffect(() => {
    const handleSessionLost = () => {
      refreshSession()
    }
    
    const handleSessionRefreshed = (event: CustomEvent) => {
      setUser(event.detail.user)
      setSessionValid(true)
    }
    
    const handleAuthStateChanged = () => {
      refreshSession()
    }
    
    window.addEventListener('session-lost', handleSessionLost)
    window.addEventListener('session-refreshed', handleSessionRefreshed as EventListener)
    window.addEventListener('auth-state-changed', handleAuthStateChanged)
    
    return () => {
      window.removeEventListener('session-lost', handleSessionLost)
      window.removeEventListener('session-refreshed', handleSessionRefreshed as EventListener)
      window.removeEventListener('auth-state-changed', handleAuthStateChanged)
    }
  }, [refreshSession])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
          setSessionValid(true)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSessionValid(false)
        } else if (event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null)
          setSessionValid(true)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  return { user, isLoading, sessionValid, refreshSession }
}