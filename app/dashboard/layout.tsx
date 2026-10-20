'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BarChart3, FileText, Bookmark, PlusCircle, Home, 
  Menu, X, Settings, LogOut, ChevronRight, MessageSquare
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)

  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768
      setMobile(m)
      setSidebarOpen(!m)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      
      setUser(session.user)
      
      const { data: p } = await supabase
        .from('profiles')
        .select('name, avatar_url, email')
        .eq('id', session.user.id)
        .maybeSingle()
      
      setProfile(p)
      
      const { count } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        
      setBookmarkCount(count || 0)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const items = [
    { href: '/dashboard', label: 'Overview', icon: <BarChart3 size={18} /> },
    { href: '/dashboard/new-post', label: 'New Post', icon: <PlusCircle size={18} /> },
    { href: '/dashboard/posts', label: 'My Posts', icon: <FileText size={18} /> },
    { href: '/dashboard/reading-list', label: 'Reading List', icon: <Bookmark size={18} />, badge: bookmarkCount > 0 ? bookmarkCount : undefined },
    { href: '/dashboard/messages', label: 'Messages', icon: <MessageSquare size={18} /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={18} /> },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-ink-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
      </div>
    )
  }

  const expanded = mobile || sidebarOpen
  const currentLabel = items.find(i => i.href === pathname)?.label || 'Overview'

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-ink-950">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={`
          ${mobile
            ? `fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `sticky top-16 z-30 h-[calc(100vh-4rem)] shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`
          }
          flex flex-col border-r border-white/10 bg-ink-900
        `}
      >
        <div className={`flex h-16 shrink-0 items-center ${!expanded ? 'justify-center' : 'justify-between px-4'}`}>
          {expanded && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
                <Home size={16} />
              </span>
              <span className="mb-display font-semibold text-white">Dashboard</span>
            </div>
          )}
          {!mobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar" className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">
              <Menu size={20} />
            </button>
          )}
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" className="ml-auto rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
          )}
        </div>

        {expanded && (
          <div className="mx-3 mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 ring-2 ring-white/10">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.name || 'Avatar'} width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                <span className="font-bold text-ink-950">{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
              <p className="truncate text-xs text-gray-500">{profile?.email}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => mobile && setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  active
                    ? 'bg-gold-400 text-ink-950 shadow-[0_8px_24px_-12px_rgba(245,196,81,0.6)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${!expanded ? 'justify-center' : ''}`}
              >
                {item.icon}
                {expanded && (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-ink-950/20 text-ink-950' : 'bg-gold-400/15 text-gold-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={logout}
            title="Logout"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-300 transition hover:bg-crimson-500/10 ${!expanded ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {expanded && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {mobile && sidebarOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* ---------- Main ---------- */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-ink-950/80 px-4 py-3 backdrop-blur sm:px-6">
          {mobile && (
            <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" className="rounded-lg p-2 text-gray-300 transition hover:bg-white/10">
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard" className="transition hover:text-gold-400">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-white">{currentLabel}</span>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-surface p-5 sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  )
}