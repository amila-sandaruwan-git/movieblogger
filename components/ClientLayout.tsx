// components/ClientLayout.tsx


'use client'

import { usePathname } from 'next/navigation'
import NavigationWithNotifications from '@/components/NavigationWithNotifications'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import SupportWidget from '@/components/SupportWidget' // <-- ADDED IMPORT

interface Props {
  children: React.ReactNode
  user: any
  profile: any
  notifications: any[]
  unreadCount: number
}

export default function ClientLayout({ children, user, profile, notifications, unreadCount }: Props) {
  const pathname = usePathname()

  // Only hide the nav on admin pages (footer still shows everywhere)
  const hideNav = pathname.startsWith('/admin')

  return (
    <>
      {!hideNav && (
        <NavigationWithNotifications
          user={user}
          profile={profile}
          notifications={notifications}
          unreadCount={unreadCount}
        />
      )}

      <main className={hideNav ? '' : 'pt-16'}>
        {children}
      </main>

      <Footer />
      
      <ScrollToTop />
      
      {/* FLOATING SUPPORT WIDGET */}
      <SupportWidget /> 
    </>
  )
}