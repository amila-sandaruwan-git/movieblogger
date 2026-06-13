'use client'

import { useState, useEffect, useCallback } from 'react'
import NavigationWithNotifications from '@/components/NavigationWithNotifications'
import { usePathname, useSearchParams } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
  user: any
  notifications: any[]
  unreadCount: number
  isLoginPage: boolean
  isAdminLoginPage: boolean
}

export default function ClientLayout({
  children,
  user,
  notifications,
  unreadCount,
  isLoginPage,
  isAdminLoginPage
}: ClientLayoutProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showNavigation, setShowNavigation] = useState(true)
  const [showFooter, setShowFooter] = useState(true)
  
  // Function to check if we should show navigation
  const checkNavigationVisibility = useCallback(() => {
    const currentPathname = window.location.pathname
    
    // Check for admin pages
    const isAdminPage = currentPathname.startsWith('/admin')
    
    // Check for admin login
    const currentSearchParams = new URLSearchParams(window.location.search)
    const isAdminLogin = currentPathname === '/login' && currentSearchParams.get('from') === 'admin'
    
    // Don't show navigation on admin pages or admin login
    // Admin login page should not show nav, but regular login page should
    const shouldHideNav = isAdminPage || isAdminLogin
    
    setShowNavigation(!shouldHideNav)
    setShowFooter(!shouldHideNav)
    
    console.log('Navigation check:', {
      pathname: currentPathname,
      search: currentSearchParams.toString(),
      isAdminPage,
      isAdminLogin,
      showNavigation: !shouldHideNav
    })
  }, [])

  // Check on mount and when pathname/searchParams change
  useEffect(() => {
    checkNavigationVisibility()
  }, [checkNavigationVisibility, pathname, searchParams])

  // Listen to popstate events (when user uses browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      checkNavigationVisibility()
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [checkNavigationVisibility])

  // Also listen to custom events if you want to trigger from login component
  useEffect(() => {
    const handleUrlChange = () => {
      checkNavigationVisibility()
    }
    
    // Custom event listener
    window.addEventListener('urlchanged', handleUrlChange)
    
    return () => {
      window.removeEventListener('urlchanged', handleUrlChange)
    }
  }, [checkNavigationVisibility])

  return (
    <>
      {/* Show navigation based on client-side state */}
      {showNavigation && (
        <NavigationWithNotifications 
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
        />
      )}
      
      {/* Main content - adjust padding based on navigation visibility */}
      <main className={`min-h-screen ${showNavigation ? 'pt-16' : 'pt-0'}`}>
        {children}
      </main>
      
      {/* Footer - hide for admin pages and admin login */}
      
    </>
  )
}