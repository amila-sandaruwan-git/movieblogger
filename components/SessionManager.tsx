// components/SessionManager.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

export function SessionManager() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const isCheckingRef = useRef(false)
  const lastActivityRef = useRef(Date.now())
  const [sessionValid, setSessionValid] = useState(true)

  // Pages that should NOT auto-check
  const excludePaths = ['/login', '/signup', '/auth/callback', '/update-password', '/reset-password']
  const shouldSkip = excludePaths.includes(pathname)

  // Function to silently refresh session without page reload
  const silentSessionRefresh = async () => {
    if (isCheckingRef.current || shouldSkip) return false
    
    isCheckingRef.current = true
    
    try {
      console.log('🔄 Silently checking session...')
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session check error:', sessionError)
        return false
      }
      
      // If no session, check if we're on a protected page
      if (!session) {
        const storedSession = localStorage.getItem('sb-rbkijdlyyibaleqpgcyv-auth-token')
        
        if (storedSession && !shouldSkip) {
          // We had a session but it's gone - user might be on protected page
          console.log('⚠️ Session lost, checking auth status...')
          
          // Try to silently sign in with stored credentials? No, just update state
          setSessionValid(false)
          
          // Dispatch event for components to handle
          window.dispatchEvent(new CustomEvent('session-lost', { detail: { timestamp: Date.now() } }))
        }
        return false
      }
      
      setSessionValid(true)
      
      // Check if session is expired
      if (session.expires_at) {
        const expiresAt = session.expires_at * 1000
        const now = Date.now()
        
        if (now >= expiresAt) {
          // Session expired, try to refresh silently
          console.log('⏰ Session expired, attempting silent refresh...')
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError || !refreshed.session) {
            console.log('❌ Session refresh failed')
            setSessionValid(false)
            window.dispatchEvent(new CustomEvent('session-lost', { detail: { timestamp: Date.now() } }))
            return false
          }
          
          console.log('✅ Session refreshed successfully')
          setSessionValid(true)
          
          // Dispatch event that session was refreshed
          window.dispatchEvent(new CustomEvent('session-refreshed', { 
            detail: { user: refreshed.user, timestamp: Date.now() } 
          }))
          return true
        }
        
        // Check if session expires in less than 5 minutes, refresh early
        const timeUntilExpiry = expiresAt - now
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('🔄 Session expiring soon, refreshing token silently...')
          await supabase.auth.refreshSession()
        }
      }
      
      return true
      
    } catch (error) {
      console.error('Session check failed:', error)
      return false
    } finally {
      setTimeout(() => {
        isCheckingRef.current = false
      }, 500)
    }
  }

  // Check and restore session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Tab became visible again
        const timeAway = Date.now() - lastActivityRef.current
        
        if (timeAway > 2000) {
          console.log(`🔄 Tab visible after ${Math.round(timeAway/1000)}s, checking session...`)
          await silentSessionRefresh()
        }
        
        lastActivityRef.current = Date.now()
      } else {
        lastActivityRef.current = Date.now()
      }
    }

    const handleFocus = async () => {
      const timeAway = Date.now() - lastActivityRef.current
      
      if (timeAway > 1000) {
        console.log(`🔄 Window focused after ${Math.round(timeAway/1000)}s, checking session...`)
        await silentSessionRefresh()
      }
      
      lastActivityRef.current = Date.now()
    }

    lastActivityRef.current = Date.now()
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [shouldSkip])

  // Listen for auth changes from other tabs
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key && event.key.includes('supabase.auth.token')) {
        console.log('🔄 Auth changed in another tab, syncing session...')
        await silentSessionRefresh()
        
        // Dispatch event to refresh UI components
        window.dispatchEvent(new CustomEvent('auth-state-changed', { 
          detail: { source: 'storage', timestamp: Date.now() } 
        }))
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Initial session check on mount
  useEffect(() => {
    if (!shouldSkip) {
      silentSessionRefresh()
    }
  }, [shouldSkip])

  return null
}