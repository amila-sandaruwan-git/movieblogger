'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClientProfileDropdown } from '@/components/ClientProfileDropdown'
import {
  Bell, Home, Film, Users, MessageCircle, LayoutDashboard, X, Menu,
  User as UserIcon, LogOut, UserPlus, MessageSquare, Reply, Sparkles, CheckCheck, Shield, ChevronRight
} from 'lucide-react'
import Image from 'next/image'

interface Props {
  user: any
  profile: any
  notifications: any[]
  unreadCount: number
}

export default function NavigationWithNotifications({ user, profile, notifications, unreadCount }: Props) {
  const [showNotif, setShowNotif] = useState(false)
  const [showMobile, setShowMobile] = useState(false)
  const [localNotifs, setLocalNotifs] = useState(notifications)
  const [localUnread, setLocalUnread] = useState(unreadCount)
  const notifRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home size={18} /> },
    { href: '/reviews', label: 'Reviews', icon: <Film size={18} /> },
    { href: '/about', label: 'About', icon: <Users size={18} /> },
    { href: '/contact', label: 'Contact', icon: <MessageCircle size={18} /> },
  ]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  useEffect(() => {
    setLocalNotifs(notifications)
    setLocalUnread(unreadCount)
  }, [notifications, unreadCount])

  // Real-time subscription to new notifications
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`nav-notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setLocalNotifs(prev => [payload.new, ...prev].slice(0, 20))
        setLocalUnread(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setShowNotif(false)
    setShowMobile(false)
  }, [pathname])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = showMobile ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showMobile])

  const markAllRead = async () => {
    if (!user?.id || localUnread === 0) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setLocalNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setLocalUnread(0)
  }

  const markOneRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setLocalUnread(prev => Math.max(0, prev - 1))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'reply': return <Reply className="h-4 w-4" />
      case 'follow': return <UserPlus className="h-4 w-4" />
      case 'new_post': return <Film className="h-4 w-4" />
      case 'welcome': return <Sparkles className="h-4 w-4" />
      case 'message': return <MessageCircle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-sky-500/15 text-sky-300 ring-sky-400/30'
      case 'reply': return 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30'
      case 'follow': return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
      case 'new_post': return 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30'
      case 'welcome': return 'bg-gold-400/15 text-gold-300 ring-gold-400/30'
      case 'message': return 'bg-teal-500/15 text-teal-300 ring-teal-400/30'
      default: return 'bg-white/10 text-gray-300 ring-white/20'
    }
  }

  const openNotification = (n: any) => {
    if (!n.is_read) markOneRead(n.id)
    setShowNotif(false)

    if (n.metadata?.action === 'open_messages') {
      router.push('/dashboard/messages')
      return
    }
    if (n.metadata?.action === 'open_admin_messages') {
      router.push('/admin/messages')
      return
    }

    if (n.type === 'follow' || n.type === 'welcome') return
    if (n.metadata?.post_id) {
      const url = n.metadata.comment_id
        ? `/post/${n.metadata.post_id}?comment=${n.metadata.comment_id}`
        : `/post/${n.metadata.post_id}`
      router.push(url)
    }
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const avatar = profile?.avatar_url
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin'

  const Logo = ({ small = false }: { small?: boolean }) => (
    <Link href="/" className="flex items-center gap-2.5">
      <span className={`flex items-center justify-center rounded-lg bg-gold-400 text-ink-950 ${small ? 'h-8 w-8' : 'h-9 w-9'}`}>
        <Film size={small ? 16 : 18} />
      </span>
      <span className={`mb-display font-semibold tracking-tight text-white ${small ? 'text-lg' : 'text-xl'}`}>
        Movie<span className="text-gold-400">Blogger</span>
      </span>
    </Link>
  )

  const UnreadBadge = () =>
    localUnread > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-500 px-1 text-[10px] font-bold text-white ring-2 ring-ink-950">
        {localUnread > 9 ? '9+' : localUnread}
      </span>
    ) : null

  const bellBtn =
    'relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition hover:border-gold-400/40 hover:text-white'

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        {/* ============ Desktop ============ */}
        <div className="mb-container hidden h-16 items-center justify-between gap-6 md:flex">
          <Logo />

          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive(l.href)
                    ? 'bg-gold-400 text-ink-950'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                aria-current={pathname.startsWith('/dashboard') ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-gold-400 text-ink-950'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <LayoutDashboard size={15} /> Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotif(!showNotif)} className={bellBtn} aria-label="Notifications" aria-expanded={showNotif}>
                    <Bell size={18} />
                    <UnreadBadge />
                  </button>

                  {showNotif && (
                    <div className="animate-fade-up absolute right-0 mt-3 flex max-h-[calc(100vh-6rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60">
                      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-ink-900 px-4 py-3">
                        <h3 className="mb-display text-base font-semibold text-white">Notifications</h3>
                        <div className="flex items-center gap-3">
                          {localUnread > 0 && (
                            <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
                              <CheckCheck size={14} /> Mark all read
                            </button>
                          )}
                          <button onClick={() => setShowNotif(false)} aria-label="Close" className="text-gray-500 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      {localNotifs.length > 0 ? (
                        localNotifs.slice(0, 10).map(n => (
                          <div
                            key={n.id}
                            onClick={() => openNotification(n)}
                            className={`flex cursor-pointer items-start gap-3 border-b border-white/5 px-4 py-3.5 transition hover:bg-white/5 ${!n.is_read ? 'bg-gold-400/[0.04]' : ''}`}
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${getNotificationBg(n.type)}`}>
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium text-white' : 'text-gray-400'}`}>{n.message}</p>
                              <p className="mt-1 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                            {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center px-4 py-12 text-center text-gray-500">
                          <Bell size={30} className="mb-3 opacity-40" />
                          <p className="text-sm">You're all caught up</p>
                        </div>
                      )}
                      </div>

                      <Link href="/notifications" className="block shrink-0 border-t border-white/10 px-4 py-3 text-center text-sm font-medium text-gold-400 transition hover:bg-white/5">
                        View all Notifications
                      </Link>
                    </div>
                  )}
                </div>

                <ClientProfileDropdown user={user} profile={profile} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 transition hover:text-white">Login</Link>
                <Link href="/signup" className="mb-btn-primary !py-2">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* ============ Mobile top bar ============ */}
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <Logo small />
          <div className="flex items-center gap-2">
            {user && (
              // The dropdown only exists on desktop, so on mobile the bell opens the notifications page
              <Link href="/notifications" className={bellBtn} aria-label="Notifications">
                <Bell size={18} />
                <UnreadBadge />
              </Link>
            )}
            <button
              onClick={() => setShowMobile(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 transition hover:bg-white/10"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ============ Mobile drawer ============ */}
      {showMobile && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setShowMobile(false)} />
          <aside className="animate-slide-in-right fixed bottom-0 right-0 top-0 z-50 flex w-[19rem] max-w-[85vw] flex-col border-l border-white/10 bg-ink-900 md:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
              <span className="mb-eyebrow">Menu</span>
              <button onClick={() => setShowMobile(false)} aria-label="Close menu" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {user && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 ring-2 ring-white/10">
                    {avatar ? (
                      <Image src={avatar} alt={displayName} width={48} height={48} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-ink-950" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{displayName}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {navLinks.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setShowMobile(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive(l.href) ? 'bg-gold-400 text-ink-950' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {l.icon}
                    <span className="flex-1">{l.label}</span>
                    <ChevronRight size={16} className="opacity-40" />
                  </Link>
                ))}

                {user && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowMobile(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        pathname.startsWith('/dashboard') ? 'bg-gold-400 text-ink-950' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <LayoutDashboard size={18} />
                      <span className="flex-1">Dashboard</span>
                      <ChevronRight size={16} className="opacity-40" />
                    </Link>
                    <Link href="/dashboard/messages" onClick={() => setShowMobile(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5">
                      <MessageCircle size={18} /> <span className="flex-1">Messages</span>
                      <ChevronRight size={16} className="opacity-40" />
                    </Link>
                    <Link href="/profile" onClick={() => setShowMobile(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5">
                      <UserIcon size={18} /> <span className="flex-1">My Profile</span>
                      <ChevronRight size={16} className="opacity-40" />
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link href="/admin" onClick={() => setShowMobile(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5">
                    <Shield size={18} /> <span className="flex-1">Admin</span>
                    <ChevronRight size={16} className="opacity-40" />
                  </Link>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-white/10 p-4">
              {user ? (
                <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-3 py-3 text-sm font-semibold text-red-300 transition hover:bg-crimson-500/20">
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="mb-btn-primary w-full">Login</Link>
                  <Link href="/signup" className="mb-btn-ghost w-full">Sign Up</Link>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  )
}