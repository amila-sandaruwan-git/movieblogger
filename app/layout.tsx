import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { createClient } from '@/lib/supabase/server'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })

export const metadata: Metadata = {
  title: 'MovieBlogger - Your Ultimate Movie Guide',
  description: 'Discover your next favorite film with in-depth reviews and discussions',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: any = null
  let notifications: any[] = []
  let unreadCount = 0

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data

    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    notifications = notifs || []
    unreadCount = notifications.filter(n => !n.is_read).length
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased bg-white dark:bg-ink-950`}>
        <ThemeProvider>
          <ClientLayout
            user={user}
            profile={profile}
            notifications={notifications}
            unreadCount={unreadCount}
          >
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}