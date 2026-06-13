// components/SessionSync.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { usePageVisibility } from '@/hooks/usePageVisibility'

export function SessionSync() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const isVisible = usePageVisibility()
  const lastSessionCheckRef = useRef<number>(Date.now())
  const isRefreshingRef = useRef(false)
  const visibleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Pages that should NOT auto-refresh
  const excludePaths = ['/login', '/signup', '/auth/callback', '/update-password', '/reset-password']
  const shouldSkipAutoRefresh = excludePaths.includes(pathname)

  // Check session validity and refresh if needed
  const checkAndRefreshSession = useCallback(async () => {
    if (isRefreshingRef.current || shouldSkipAutoRefresh) return
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        return
      }

      // Check if session is expired or about to expire (within 5 minutes)
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now
        
        // If session expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('Session expiring soon, refreshing...')
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (!refreshError) {
            console.log('Session refreshed successfully')
            router.refresh()
          }
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
    }
  }, [supabase.auth, router, shouldSkipAutoRefresh])

  // Refresh page when user returns to the tab
  const refreshOnReturn = useCallback(async () => {
    if (isRefreshingRef.current || shouldSkipAutoRefresh) return
    
    const now = Date.now()
    const timeAway = now - lastSessionCheckRef.current
    
    // Only refresh if user was away for more than 3 seconds
    if (timeAway > 3000) {
      console.log('User returned to tab after', Math.round(timeAway / 1000), 'seconds, checking session...')
      
      isRefreshingRef.current = true
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If no session but user was previously logged in, redirect to login
        // Or if session is invalid, refresh the page
        if (!session) {
          console.log('No session found, refreshing page...')
          router.refresh()
        } else {
          // Check if session is still valid
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.log('User not authenticated, refreshing page...')
            router.refresh()
          } else {
            // Session is valid, just refresh the page to update UI
            router.refresh()
          }
        }
      } catch (error) {
        console.error('Error checking session on return:', error)
        router.refresh()
      } finally {
        setTimeout(() => {
          isRefreshingRef.current = false
        }, 1000)
      }
    }
    
    lastSessionCheckRef.current = now
  }, [supabase.auth, router, shouldSkipAutoRefresh])

  // Track when tab becomes visible again
  useEffect(() => {
    if (!isVisible) {
      // Tab became hidden, just update timestamp
      lastSessionCheckRef.current = Date.now()
    } else {
      // Tab became visible again, refresh after a small delay
      if (visibleTimeoutRef.current) {
        clearTimeout(visibleTimeoutRef.current)
      }
      
      visibleTimeoutRef.current = setTimeout(() => {
        refreshOnReturn()
      }, 100)
    }
    
    return () => {
      if (visibleTimeoutRef.current) {
        clearTimeout(visibleTimeoutRef.current)
      }
    }
  }, [isVisible, refreshOnReturn])

  // Periodic session check (every 60 seconds) while tab is visible
  useEffect(() => {
    if (!isVisible || shouldSkipAutoRefresh) return
    
    const intervalId = setInterval(() => {
      checkAndRefreshSession()
    }, 60 * 1000) // Check every minute
    
    return () => clearInterval(intervalId)
  }, [isVisible, checkAndRefreshSession, shouldSkipAutoRefresh])

  // Handle auth state changes from other tabs
  useEffect(() => {
    const handleAuthChange = (event: StorageEvent) => {
      // Check if the auth storage changed in another tab
      if (event.key === 'supabase.auth.token') {
        console.log('Auth state changed in another tab, refreshing...')
        if (!isRefreshingRef.current && !shouldSkipAutoRefresh) {
          router.refresh()
        }
      }
    }
    
    window.addEventListener('storage', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [router, shouldSkipAutoRefresh])

  // Also listen for custom auth events
  useEffect(() => {
    const handleAuthEvent = () => {
      if (!isRefreshingRef.current && !shouldSkipAutoRefresh) {
        router.refresh()
      }
    }
    
    window.addEventListener('supabase-auth-change', handleAuthEvent)
    
    return () => {
      window.removeEventListener('supabase-auth-change', handleAuthEvent)
    }
  }, [router, shouldSkipAutoRefresh])

  return null
}