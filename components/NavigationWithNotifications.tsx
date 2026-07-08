// components/NavigationWithNotifications.tsx - UPDATED with session sync without reload
'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notificationEmitter } from '@/lib/notifications'
import { useSessionSync } from '@/hooks/useSessionSync'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ClientProfileDropdown } from '@/components/ClientProfileDropdown'
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  Mail, 
  AlertCircle, 
  Heart,
  X,
  Home,
  Film,
  Users,
  MessageCircle,
  User as UserIcon,
  Shield,
  LayoutDashboard,
  Sparkles,
  Star,
  Menu,
  Settings,
  LogOut,
  Bookmark,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  BarChart3,
  FileText,
  DollarSign,
  PlusCircle,
  UserCheck,
  Eye,
  CheckCheck
} from 'lucide-react'

interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  updated_at?: string
  metadata?: {
    post_id?: string
    comment_id?: string
    sender_id?: string
    sender_name?: string
    sender_username?: string
    post_title?: string
    content?: string
    message_id?: string
    [key: string]: any
  }
}

interface NavigationProps {
  user?: SupabaseUser | null
  unreadCount?: number
  notifications?: any[]
  isAdmin?: boolean
}

export default function NavigationWithNotifications({ 
  user: initialUser, 
  unreadCount = 0, 
  notifications = [],
  isAdmin = false
}: NavigationProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([])
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount)
  const [userIsAdmin, setUserIsAdmin] = useState(isAdmin)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const [isBellRinging, setIsBellRinging] = useState(false)
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false)
  const [newNotification, setNewNotification] = useState<Notification | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Use the session sync hook for real-time user state without page reload
  const { user: syncedUser, sessionValid, refreshSession } = useSessionSync()
  
  // Use synced user or initial user - this ensures UI updates without reload
  const currentUser = syncedUser || initialUser
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const navbarRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastScrollYRef = useRef(0)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const toastClickHandledRef = useRef(false)
  
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home size={20} />, color: 'text-blue-400' },
    { href: '/reviews', label: 'Reviews', icon: <Film size={20} />, color: 'text-purple-400' },
    { href: '/about', label: 'About', icon: <Users size={20} />, color: 'text-green-400' },
    { href: '/contact', label: 'Contact', icon: <MessageCircle size={20} />, color: 'text-orange-400' },
  ]

  const dashboardSections = [
    { href: '/dashboard', label: 'Dashboard Overview', icon: <BarChart3 size={20} />, color: 'text-blue-400' },
    { href: '/dashboard/new-post', label: 'Create New Post', icon: <PlusCircle size={20} />, color: 'text-green-400' },
    { href: '/dashboard/posts', label: 'My Posts', icon: <FileText size={20} />, color: 'text-purple-400' },
    { href: '/dashboard/earnings', label: 'Earnings', icon: <DollarSign size={20} />, color: 'text-yellow-400' },
    { href: '/dashboard/reading-list', label: 'Reading List', icon: <Bookmark size={20} />, color: 'text-pink-400' },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} />, color: 'text-gray-400' },
  ]

  const memoizedNotifications = useMemo(() => localNotifications, [localNotifications])

  // Listen for session refresh events to update UI
  useEffect(() => {
    const handleSessionRefreshed = () => {
      console.log('Navigation: Session refreshed, updating UI')
      // Refresh notifications when session is refreshed
      if (currentUser?.id) {
        fetchNotifications(currentUser.id)
      }
    }
    
    const handleAuthStateChanged = () => {
      console.log('Navigation: Auth state changed, refreshing data')
      if (currentUser?.id) {
        fetchNotifications(currentUser.id)
      }
    }
    
    window.addEventListener('session-refreshed', handleSessionRefreshed)
    window.addEventListener('auth-state-changed', handleAuthStateChanged)
    
    return () => {
      window.removeEventListener('session-refreshed', handleSessionRefreshed)
      window.removeEventListener('auth-state-changed', handleAuthStateChanged)
    }
  }, [currentUser?.id])

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let ticking = false
    let scrollTimer: NodeJS.Timeout
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const scrollDelta = currentScrollY - lastScrollYRef.current
          
          if (scrollDelta > 8 && currentScrollY > 100) {
            if (navbarVisible) {
              setNavbarVisible(false)
              document.body.classList.add('navbar-hidden')
            }
          } 
          else if (scrollDelta < -8) {
            if (!navbarVisible) {
              setNavbarVisible(true)
              document.body.classList.remove('navbar-hidden')
            }
          }
          else if (currentScrollY < 50) {
            if (!navbarVisible) {
              setNavbarVisible(true)
              document.body.classList.remove('navbar-hidden')
            }
          }
          
          lastScrollYRef.current = currentScrollY
          ticking = false
        })
        
        ticking = true
      }
    }
    
    const throttledScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        handleScroll()
      }, 10)
    }
    
    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      document.body.classList.remove('navbar-hidden')
    }
  }, [navbarVisible])

  useEffect(() => {
    setUserIsAdmin(isAdmin)
  }, [isAdmin])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const formattedNotifications: Notification[] = notifications.map((n: any) => ({
        id: n.id || '',
        user_id: n.user_id || '',
        type: n.type || 'general',
        title: n.title || 'New Notification',
        message: n.message || '',
        is_read: n.is_read || false,
        created_at: n.created_at || new Date().toISOString(),
        updated_at: n.updated_at,
        metadata: n.metadata || {},
      }))
      setLocalNotifications(formattedNotifications)
    }
    setLocalUnreadCount(unreadCount)
  }, [notifications, unreadCount])

  const fetchNotifications = useCallback(async (userId?: string) => {
    const targetUserId = userId || currentUser?.id
    if (!targetUserId) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(15)
      
      if (error) throw error
      
      if (data) {
        const formattedData: Notification[] = data.map((n: any) => ({
          ...n,
          is_read: n.is_read || false,
          metadata: n.metadata || {}
        }))
        setLocalNotifications(formattedData)
        const unread = formattedData.filter((n: any) => !n.is_read).length
        setLocalUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [currentUser, supabase])

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications(currentUser.id)
    }
  }, [currentUser, fetchNotifications])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser && (!currentUser || currentUser.id !== authUser.id)) {
          if (authUser) {
            const isUserAdmin = await checkAdminStatus(authUser.id)
            setUserIsAdmin(isUserAdmin)
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      }
    }

    checkAuth()
  }, [supabase.auth])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (authUser) {
            const isUserAdmin = await checkAdminStatus(authUser.id)
            setUserIsAdmin(isUserAdmin)
            
            if (event === 'SIGNED_IN') {
              await fetchNotifications(authUser.id)
            }
          }
        } 
        else if (event === 'SIGNED_OUT') {
          setUserIsAdmin(false)
          setLocalNotifications([])
          setLocalUnreadCount(0)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, fetchNotifications])

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()
      
      if (adminData) return true
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()
      
      const adminEmails = [
        'admin@movieblogger.com',
        'administrator@movieblogger.com',
        'superadmin@movieblogger.com'
      ]
      
      return userData?.email ? adminEmails.includes(userData.email) : false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // 🔔 REALTIME NOTIFICATION LISTENER
  useEffect(() => {
    if (!currentUser?.id) {
      console.log('No current user, skipping realtime setup')
      return
    }
    
    console.log('🔔 Setting up real-time notification listener for user:', currentUser.id)
    
    const channel = supabase
      .channel(`notifications-realtime-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('🔔 Realtime notification received:', payload.new)
          
          const newNotification = payload.new as Notification
          
          setLocalNotifications(prev => {
            if (prev.some(n => n.id === newNotification.id)) return prev
            return [newNotification, ...prev.slice(0, 14)]
          })
          
          if (!newNotification.is_read) {
            setLocalUnreadCount(prev => prev + 1)
          }
          
          triggerBellAnimation()
          showToastNotification(newNotification)
          playNotificationSound(newNotification.type)
          notificationEmitter.emit(newNotification)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload.new)
          const updatedNotification = payload.new as Notification
          
          setLocalNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          )
          
          if (updatedNotification.is_read) {
            setLocalUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications for user:', currentUser.id)
        }
      })

    return () => {
      console.log('🔔 Cleaning up real-time notification listener')
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id, supabase])

  const handleBellIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowNotifications(prev => !prev)
    if (showMobileMenu) {
      setShowMobileMenu(false)
    }
  }

  const handleViewAllNotifications = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowNotifications(false)
    router.push('/notifications')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (showNotifications) {
        const isClickOnBell = bellRef.current && bellRef.current.contains(event.target as Node)
        const isClickOnNotification = notificationRef.current && notificationRef.current.contains(event.target as Node)
        
        if (!isClickOnBell && !isClickOnNotification) {
          setShowNotifications(false)
        }
      }
      
      if (showMobileMenu) {
        if (mobileMenuRef.current && mobileMenuRef.current.contains(event.target as Node)) {
          return
        }
        const profileButton = document.querySelector('.mobile-profile-button')
        if (profileButton && profileButton.contains(event.target as Node)) {
          return
        }
        setShowMobileMenu(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside as EventListener)
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [showNotifications, showMobileMenu])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false)
        if (showMobileMenu) setShowMobileMenu(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showNotifications, showMobileMenu])

  useEffect(() => {
    setShowNotifications(false)
    setShowMobileMenu(false)
  }, [pathname])

  const triggerBellAnimation = () => {
    setIsBellRinging(true)
    setTimeout(() => setIsBellRinging(false), 1000)
  }

  const showToastNotification = (notification: Notification) => {
    setNewNotification(notification)
    setShowNewNotificationToast(true)
    
    setTimeout(() => {
      setShowNewNotificationToast(false)
      setNewNotification(null)
    }, 5000)
  }

  const playNotificationSound = (type: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      let frequency = 800
      let duration = 0.1
      
      switch (type) {
        case 'comment':
        case 'reply':
          frequency = 800
          duration = 0.1
          break
        case 'follow':
          frequency = 1000
          duration = 0.2
          break
        case 'message':
          frequency = 1200
          duration = 0.15
          break
        default:
          frequency = 600
          duration = 0.08
      }
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration)
      
      setTimeout(() => {
        oscillator.disconnect()
        gainNode.disconnect()
      }, (duration + 0.1) * 1000)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    if (!notificationId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (!error) {
        setLocalNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setLocalUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    if (!currentUser?.id || localUnreadCount === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .eq('is_read', false)

      if (!error) {
        setLocalNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setLocalUnreadCount(0)
        setSuccessMessage('All notifications marked as read')
        setTimeout(() => setSuccessMessage(null), 2000)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / (1000 * 60))
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)
      
      if (diffDay === 0) {
        if (diffHour === 0) {
          if (diffMin === 0) return 'Just now'
          return `${diffMin} min ago`
        }
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
      }
      
      if (diffDay === 1) return 'Yesterday'
      if (diffDay < 7) return `${diffDay} days ago`
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDay < 365 ? undefined : 'numeric'
      })
    } catch {
      return 'Recently'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-4 h-4 text-white" />
      case 'follow':
        return <UserPlus className="w-4 h-4 text-white" />
      case 'message':
        return <Mail className="w-4 h-4 text-white" />
      case 'welcome':
        return <AlertCircle className="w-4 h-4 text-white" />
      case 'like':
        return <Heart className="w-4 h-4 text-white" />
      default:
        return <Bell className="w-4 h-4 text-white" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return 'bg-gradient-to-r from-blue-600 to-blue-700'
      case 'follow':
        return 'bg-gradient-to-r from-green-600 to-emerald-700'
      case 'message':
        return 'bg-gradient-to-r from-orange-600 to-amber-700'
      case 'welcome':
        return 'bg-gradient-to-r from-purple-600 to-pink-700'
      case 'like':
        return 'bg-gradient-to-r from-pink-600 to-rose-700'
      default:
        return 'bg-gradient-to-r from-gray-700 to-gray-800'
    }
  }

  const formatNotificationMessage = (notification: Notification) => {
    const metadata = notification.metadata || {}
    
    switch (notification.type) {
      case 'comment':
        return `${metadata.sender_name || 'Someone'} commented on your post`
      case 'reply':
        return `${metadata.sender_name || 'Someone'} replied to your comment`
      case 'follow':
        return `${metadata.sender_name || 'Someone'} started following you`
      case 'message':
        return `${metadata.sender_name || 'Someone'} sent you a message`
      case 'welcome':
        return notification.message || 'Welcome to MovieBlogger! 🎬'
      case 'like':
        return `${metadata.sender_name || 'Someone'} liked your post`
      default:
        return notification.message || notification.title || 'New notification'
    }
  }

  const handleToastClick = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (toastClickHandledRef.current || isNavigating) return
    toastClickHandledRef.current = true
    
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }
    
    setShowNewNotificationToast(false)
    setNewNotification(null)
    
    router.push('/notifications')
    
    setTimeout(() => {
      toastClickHandledRef.current = false
    }, 1000)
  }

  const handleNotificationClick = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isNavigating) return
    setIsNavigating(true)
    
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }
    
    setShowNotifications(false)
    
    router.push('/notifications')
    
    setTimeout(() => {
      setIsNavigating(false)
    }, 500)
  }

  const shouldShowBellIcon = currentUser?.id && [
    '/',
    '/reviews',
    '/about',
    '/contact',
    '/dashboard',
    '/dashboard/',
    '/profile',
    '/post/'
  ].some(path => pathname === path || pathname.startsWith(path))

  const BellIcon = () => (
    <button
      ref={bellRef}
      onClick={handleBellIconClick}
      className="relative p-2 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:scale-105 hover:rotate-6"
      aria-expanded={showNotifications}
      aria-label={`Notifications ${localUnreadCount > 0 ? `(${localUnreadCount} unread)` : ''}`}
    >
      <Bell className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isBellRinging ? 'animate-ring' : ''}`} />
      {localUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900">
          {localUnreadCount > 9 ? '9+' : localUnreadCount}
        </span>
      )}
    </button>
  )

  const SuccessToast = () => {
    if (!successMessage) return null

    return (
      <div className="fixed top-4 right-4 z-200 animate-slide-in-right-toast">
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCheck className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      </div>
    )
  }

  const NotificationsDropdown = () => {
    if (!showNotifications) return null

    return (
      <>
        <div 
          ref={notificationRef}
          className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-16 md:top-full mt-0 md:mt-2 w-auto md:w-96 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 z-100 overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            ...(typeof window !== 'undefined' && window.innerWidth < 768 ? {
              left: '16px',
              right: '16px',
              width: 'auto',
            } : {
              right: 0,
              left: 'auto',
              width: '24rem',
            })
          }}
        >
          <div className="p-4 border-b border-gray-800 shrink-0 bg-gray-900">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Notifications</h3>
              <div className="flex items-center space-x-2">
                {localUnreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      markAllNotificationsAsRead()
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowNotifications(false)
                  }}
                  className="p-1 hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(70vh - 120px)' }}>
            {memoizedNotifications.length > 0 ? (
              <div className="divide-y divide-gray-800">
                {memoizedNotifications.slice(0, 15).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-800 cursor-pointer transition ${
                      !notification.is_read ? 'bg-gray-800/30' : ''
                    }`}
                    onClick={(e) => handleNotificationClick(notification, e)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotificationBg(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 wrap-break-word">{formatNotificationMessage(notification)}</p>
                        <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No notifications yet</p>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-800 bg-gray-800/30">
            <button
              onClick={handleViewAllNotifications}
              className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2 transition"
            >
              View all notifications
            </button>
          </div>
        </div>
      </>
    )
  }

  const ToastNotification = () => {
    if (!showNewNotificationToast || !newNotification) return null

    return (
      <div 
        className="fixed top-4 right-4 z-200 animate-slide-in-right-toast cursor-pointer"
        onClick={(e) => handleToastClick(newNotification, e)}
      >
        <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 p-4 max-w-sm hover:bg-gray-800 transition-colors">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBg(newNotification.type)}`}>
              {getNotificationIcon(newNotification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-200">{formatNotificationMessage(newNotification)}</p>
              <p className="text-xs text-gray-500 mt-1">Just now</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowNewNotificationToast(false)
                setNewNotification(null)
              }}
              className="hover:bg-gray-700 rounded-full p-1 transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    setShowMobileMenu(false)
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'navbar-animations'
    style.innerHTML = `
      @keyframes ring {
        0% { transform: rotate(0deg); }
        10% { transform: rotate(-10deg); }
        20% { transform: rotate(10deg); }
        30% { transform: rotate(-10deg); }
        40% { transform: rotate(10deg); }
        50% { transform: rotate(-5deg); }
        60% { transform: rotate(5deg); }
        70% { transform: rotate(0deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes slideInRightToast {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      
      .animate-ring { animation: ring 0.5s ease-in-out; }
      .animate-slide-in-right-toast { animation: slideInRightToast 0.3s ease-out; }
      .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
    `
    
    if (!document.getElementById('navbar-animations')) {
      document.head.appendChild(style)
    }
    
    return () => {
      const existingStyle = document.getElementById('navbar-animations')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return (
    <>
      <SuccessToast />
      <ToastNotification />
      
      <div 
        ref={navbarRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 transition-transform duration-500 ease-in-out ${
          navbarVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="hidden md:flex lg:px-6 md:px-4 py-4">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center shrink-0">
              <span className="text-xl lg:text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
                MovieBlogger
              </span>
            </Link>
            
            <nav className="flex items-center gap-4 lg:gap-8 flex-wrap justify-center">
              {navLinks.map(({ href, label, icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 lg:gap-2 text-gray-300 hover:text-white transition text-sm lg:text-base ${
                    pathname === href ? 'text-white' : ''
                  }`}
                >
                  <span className={color}>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
              
              {currentUser && (
                <Link href="/dashboard" className={`flex items-center gap-1 lg:gap-2 text-gray-300 hover:text-white transition text-sm lg:text-base ${
                  pathname.startsWith('/dashboard') ? 'text-white' : ''
                }`}>
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2 lg:gap-3 shrink-0">
              {currentUser ? (
                <>
                  {shouldShowBellIcon && (
                    <div className="relative">
                      <BellIcon />
                      <NotificationsDropdown />
                    </div>
                  )}
                  <ClientProfileDropdown user={currentUser as any} />
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="px-3 lg:px-4 py-2 text-gray-300 hover:text-white text-sm lg:text-base whitespace-nowrap">Login</Link>
                  <Link href="/signup" className="px-3 lg:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm lg:text-base whitespace-nowrap">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MovieBlogger
              </span>
            </Link>
            
            <div className="flex items-center gap-2">
              {shouldShowBellIcon && (
                <div className="relative">
                  <button
                    ref={bellRef}
                    onClick={handleBellIconClick}
                    className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:scale-105 hover:rotate-6 transition-all duration-300"
                  >
                    <Bell className={`w-5 h-5 text-gray-300 ${isBellRinging ? 'animate-ring' : ''}`} />
                    {localUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {localUnreadCount > 9 ? '9+' : localUnreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div 
                      ref={notificationRef}
                      className="fixed left-4 right-4 top-16 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 z-100 overflow-y-auto"
                      style={{
                        maxHeight: '70vh',
                        zIndex: 9999,
                      }}
                    >
                      <div className="p-4 border-b border-gray-800 sticky top-0 bg-gray-900">
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold text-white text-lg">Notifications</h3>
                          <div className="flex items-center space-x-2">
                            {localUnreadCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAllNotificationsAsRead()
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowNotifications(false)
                              }}
                              className="p-1 hover:bg-gray-800 rounded-full transition"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto">
                        {memoizedNotifications.length > 0 ? (
                          <div className="divide-y divide-gray-800">
                            {memoizedNotifications.slice(0, 15).map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-800 cursor-pointer transition ${
                                  !notification.is_read ? 'bg-gray-800/30' : ''
                                }`}
                                onClick={(e) => handleNotificationClick(notification, e)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotificationBg(notification.type)}`}>
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-200 wrap-break-word">{formatNotificationMessage(notification)}</p>
                                    <span className="text-xs text-gray-500">{formatDate(notification.created_at)}</span>
                                  </div>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No notifications yet</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 border-t border-gray-800 bg-gray-800/30 sticky bottom-0">
                        <button
                          onClick={handleViewAllNotifications}
                          className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2 transition"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentUser ? (
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="focus:outline-none mobile-profile-button"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {currentUser.user_metadata?.avatar_url ? (
                      <img src={currentUser.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 rounded-full bg-white/5 border border-white/10"
                >
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMobileMenu && currentUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          
          <div 
            ref={mobileMenuRef}
            className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 shadow-2xl z-50 md:hidden animate-slide-in-right overflow-y-auto"
            style={{ maxHeight: '100vh', overflowY: 'auto' }}
          >
            <div className="p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Menu
                </span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img src={currentUser.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{currentUser.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 pb-24">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Main</p>
                {navLinks.map(({ href, label, icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      pathname === href
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className={color}>{icon}</span>
                    <span className="font-medium">{label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                  </Link>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="h-px bg-gray-800 my-3" />
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2 mt-2">Dashboard</p>
                {dashboardSections.map(({ href, label, icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      pathname === href
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className={color}>{icon}</span>
                    <span className="font-medium">{label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                  </Link>
                ))}
              </div>
              
              <div className="mt-6">
                <div className="h-px bg-gray-800 my-3" />
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2 mt-2">Profile</p>
                
                <Link
                  href="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition"
                >
                  <UserIcon size={20} className="text-green-400" />
                  <span className="font-medium">My Profile</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                </Link>
              </div>
              
              {userIsAdmin && (
                <div className="mt-6">
                  <div className="h-px bg-gray-800 my-3" />
                  <Link
                    href="/admin"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      pathname.startsWith('/admin')
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Shield size={20} className="text-purple-400" />
                    <span className="font-medium">Admin Panel</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                  </Link>
                </div>
              )}
              
              <div className="mt-6">
                <div className="h-px bg-gray-800 my-3" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showMobileMenu && !currentUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 shadow-2xl z-50 md:hidden animate-slide-in-right overflow-y-auto">
            <div className="p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Menu
                </span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center py-3 bg-purple-600 text-white rounded-lg font-medium transition hover:bg-purple-700"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full text-center py-3 border border-gray-700 text-gray-300 rounded-lg font-medium transition hover:bg-white/5"
                >
                  Sign Up
                </Link>
              </div>
            </div>
            
            <div className="p-4 pb-24">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">Main</p>
                {navLinks.map(({ href, label, icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition ${
                      pathname === href
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className={color}>{icon}</span>
                    <span className="font-medium">{label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}