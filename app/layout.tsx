// app/layout.tsx - UPDATED with EdgeFix component
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import ClientLayout from '@/components/ClientLayout'
import { SessionManager } from '@/components/SessionManager'
import { AuthStateUpdater } from '@/components/AuthStateUpdater'
import { EdgeFix } from '@/components/EdgeFix'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MovieReel - Your Ultimate Movie Guide',
  description: 'Discover your next favorite film with in-depth reviews and discussions',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const supabase = await createClient()
  
  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Parse notification data from headers
  let notifications: any[] = []
  let unreadCount = 0
  
  try {
    const notificationsHeader = headersList.get('x-user-notifications')
    const unreadCountHeader = headersList.get('x-user-unread-count')
    
    if (notificationsHeader) {
      notifications = JSON.parse(notificationsHeader)
    }
    
    if (unreadCountHeader) {
      unreadCount = parseInt(unreadCountHeader) || 0
    }
  } catch (error) {
    console.error('Error parsing notification headers:', error)
  }

  // Get flags from middleware
  const isLoginPage = headersList.get('x-is-login-page') === 'true'
  const isAdminLoginPage = headersList.get('x-is-admin-login-page') === 'true'
  
  // Check if current page is admin page
  const currentPath = headersList.get('x-current-path') || ''
  const isAdminPage = currentPath.startsWith('/admin')

  // For admin pages, don't use ClientLayout (which includes Navbar)
  if (isAdminPage) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        </head>
        <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
          <ThemeProvider>
            <EdgeFix />
            <SessionManager />
            <AuthStateUpdater />
            {children}
          </ThemeProvider>
        </body>
      </html>
    )
  }

  // For non-admin pages, use ClientLayout with Navbar
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
        <ThemeProvider>
          <EdgeFix />
          <SessionManager />
          <AuthStateUpdater />
          <ClientLayout
            user={user}
            notifications={notifications}
            unreadCount={unreadCount}
            isLoginPage={isLoginPage}
            isAdminLoginPage={isAdminLoginPage}
          >
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}