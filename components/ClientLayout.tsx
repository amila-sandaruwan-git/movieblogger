// components/ClientLayout.tsx - FIXED
'use client'

import { useState, useEffect, useCallback } from 'react'
import NavigationWithNotifications from '@/components/NavigationWithNotifications'
import Footer from '@/components/Footer'
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
  const [showFooter, setShowFooter] = useState(false) // CHANGED: default to false
  
  // Function to check if we should show navigation and footer
  const checkVisibility = useCallback(() => {
    const currentPathname = window.location.pathname
    
    console.log('🔍 ClientLayout Debug:', {
      currentPathname,
      isDashboard: currentPathname.startsWith('/dashboard'),
      isAdmin: currentPathname.startsWith('/admin'),
      isHomepage: currentPathname === '/',
      shouldShowFooter: currentPathname === '/' // ALWAYS TRUE FOR HOMEPAGE
    })
    
    // Check for admin pages
    const isAdminPage = currentPathname.startsWith('/admin')
    
    // Check for admin login
    const currentSearchParams = new URLSearchParams(window.location.search)
    const isAdminLogin = currentPathname === '/login' && currentSearchParams.get('from') === 'admin'
    
    // Don't show navigation on admin pages or admin login
    const shouldHideNav = isAdminPage || isAdminLogin
    
    setShowNavigation(!shouldHideNav)
    
    // ONLY SHOW FOOTER ON HOMEPAGE ( / )
    if (currentPathname === '/') {
      console.log('✅ Homepage detected - showing footer')
      setShowFooter(true)
    } else {
      console.log('❌ Not homepage - hiding footer')
      setShowFooter(false)
    }
    
  }, [])

  // Check on mount and when pathname/searchParams change
  useEffect(() => {
    checkVisibility()
  }, [checkVisibility, pathname, searchParams])

  // Listen to popstate events
  useEffect(() => {
    const handlePopState = () => {
      checkVisibility()
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [checkVisibility])

  // Listen to custom events
  useEffect(() => {
    const handleUrlChange = () => {
      checkVisibility()
    }
    
    window.addEventListener('urlchanged', handleUrlChange)
    
    return () => {
      window.removeEventListener('urlchanged', handleUrlChange)
    }
  }, [checkVisibility])

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
      
      {/* Main content */}
      <main className={`min-h-screen ${showNavigation ? 'pt-16' : 'pt-0'}`}>
        {children}
      </main>
      
      {/* ONLY SHOW FOOTER ON HOMEPAGE */}
      {showFooter && <Footer />}
    </>
  )
}