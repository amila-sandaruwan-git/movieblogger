// app/dashboard/layout.tsx - Clean dark sidebar design
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BarChart3, 
  FileText, 
  Bookmark, 
  PlusCircle,
  Home,
  Menu,
  X,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  avatar_url: string | null
  email: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchBookmarkCount()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, email')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookmarkCount = async () => {
    try {
      const { count } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      setBookmarkCount(count || 0)
    } catch (error) {
      console.error('Error fetching bookmark count:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleNewPost = () => {
    router.push('/dashboard/new-post')
    if (isMobile) setIsSidebarOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    if (isMobile) setIsSidebarOpen(false)
  }

  const sidebarItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <BarChart3 className="w-5 h-5" />, 
      path: '/dashboard' 
    },
    { 
      id: 'new', 
      label: 'New Post', 
      icon: <PlusCircle className="w-5 h-5" />, 
      path: '/dashboard/new-post', 
      action: handleNewPost 
    },
    { 
      id: 'posts', 
      label: 'My Posts', 
      icon: <FileText className="w-5 h-5" />, 
      path: '/dashboard/posts' 
    },
    { 
      id: 'reading-list', 
      label: 'Reading List', 
      icon: <Bookmark className="w-5 h-5" />, 
      path: '/dashboard/reading-list',
      badge: bookmarkCount > 0 ? bookmarkCount : undefined
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      path: '/dashboard/settings' 
    },
  ]

  const getActiveSection = () => {
    return sidebarItems.find(item => item.path === pathname)?.id || 'overview'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 animate-pulse"></div>
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen flex bg-gray-900">
        {/* Sidebar */}
        <aside className={`
          dashboard-sidebar
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 transition-transform duration-300 w-72
               ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `fixed z-30 transition-all duration-300
               ${isSidebarOpen ? 'w-64' : 'w-20'}`
          }
          bg-gray-800
          flex flex-col overflow-hidden
          shadow-xl
        `}>
          {/* Header */}
          <div className={`
            flex items-center h-16 shrink-0
            ${!isMobile && !isSidebarOpen ? 'justify-center px-2' : 'justify-between px-4'}
          `}>
            {(!isMobile && isSidebarOpen) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">Dashboard</span>
              </div>
            )}
            
            {!isMobile && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            )}
            
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors ml-auto"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* User Profile */}
          {(!isMobile && isSidebarOpen) || isMobile ? (
            <div className="mx-3 mb-4 p-3 rounded-xl bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-purple-600 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate text-sm">
                    {profile?.name || 'User'}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {profile?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 flex justify-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer"
                   onClick={() => setIsSidebarOpen(true)}>
                <span className="text-white font-semibold">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = getActiveSection() === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action()
                    } else {
                      handleNavigation(item.path)
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }
                    ${!isMobile && !isSidebarOpen ? 'justify-center' : ''}
                  `}
                  title={!isMobile && !isSidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {((!isMobile && isSidebarOpen) || isMobile) && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
            
            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                text-red-400 hover:text-white hover:bg-red-500/20 mt-4
                ${!isMobile && !isSidebarOpen ? 'justify-center' : ''}
              `}
              title={!isMobile && !isSidebarOpen ? "Logout" : undefined}
            >
              <LogOut className="w-5 h-5" />
              {((!isMobile && isSidebarOpen) || isMobile) && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`
          flex-1 overflow-y-auto min-h-screen
          transition-all duration-300
          ${!isMobile && isSidebarOpen ? 'ml-64' : !isMobile && !isSidebarOpen ? 'ml-20' : 'ml-0'}
        `}>
          {/* Breadcrumb */}
          <div className="px-6 py-3 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/dashboard" className="hover:text-purple-400 transition">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">
                {sidebarItems.find(item => item.path === pathname)?.label || 'Overview'}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}