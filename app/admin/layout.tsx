'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, LayoutDashboard, Users, FileText, Flag, 
  LogOut, Menu, X, ArrowLeft, MessagesSquare, ChevronRight 
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        return
      }
      
      setIsAdmin(true)
      setLoading(false)
    }
    checkAdmin()
  }, [router, supabase])

  const handleLogout = async () => {
    // 1. Sign out of Supabase
    await supabase.auth.signOut()
    // 2. Forcefully redirect to the main login page
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 text-gray-400">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400 text-ink-950">
          <Shield size={22} />
        </span>
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        <p className="text-sm">Verifying Admin Access...</p>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { href: '/admin/posts', label: 'All Posts', icon: <FileText size={18} /> },
    { href: '/admin/reports', label: 'Reports', icon: <Flag size={18} /> },
    { href: '/admin/messages', label: 'Messages', icon: <MessagesSquare size={18} /> },
  ]

  const currentLabel = navItems.find(i => i.href === pathname)?.label || 'Admin'

  return (
    <div className="flex min-h-screen bg-ink-950 text-white">
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-ink-900 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Shield size={18} />
            </span>
            <div className="leading-tight">
              <span className="mb-display block text-base font-semibold text-white">MovieBlogger</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-400">Admin</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="text-gray-400 transition hover:text-white md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-gold-400 text-ink-950 shadow-[0_8px_24px_-12px_rgba(245,196,81,0.6)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white">
            <ArrowLeft size={18} /> Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-crimson-500/10"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="min-w-0 flex-1 md:ml-64">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink-950/80 px-4 py-3 backdrop-blur md:px-8">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="-ml-2 rounded-lg p-2 text-gray-300 transition hover:bg-white/10 md:hidden">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Admin</span>
            <ChevronRight size={14} />
            <span className="font-medium text-white">{currentLabel}</span>
          </div>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}