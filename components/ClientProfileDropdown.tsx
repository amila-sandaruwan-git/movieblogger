'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown, Film, Bookmark, Shield } from 'lucide-react'

interface Props { user: any; profile: any }

export function ClientProfileDropdown({ user, profile }: Props) {
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState({ reviews: 0, followers: 0, following: 0, saved: 0 })
  const [imageError, setImageError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadStats = async () => {
      const [rev, fol, fing, bmk] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'published'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      setStats({
        reviews: rev.count || 0,
        followers: fol.count || 0,
        following: fing.count || 0,
        saved: bmk.count || 0,
      })
    }
    loadStats()
  }, [user.id, supabase])

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const name = profile?.name || user.email?.split('@')[0] || 'User'
  const avatar = profile?.avatar_url

  const Avatar = ({ size }: { size: string }) => (
    <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 font-bold text-ink-950`}>
      {avatar && !imageError ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" onError={() => setImageError(true)} />
      ) : (
        <span>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  )

  const statItems = [
    { label: 'Reviews', value: stats.reviews },
    { label: 'Followers', value: stats.followers },
    { label: 'Following', value: stats.following },
    { label: 'Saved', value: stats.saved },
  ]

  const links = [
    { href: '/profile', label: 'My Profile', icon: <User size={16} /> },
    { href: '/dashboard/posts', label: 'My Reviews', icon: <Film size={16} /> },
    { href: '/dashboard/reading-list', label: 'Reading List', icon: <Bookmark size={16} /> },
    { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={16} /> },
  ]

  const itemCls =
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-1.5 rounded-full p-0.5 pr-2 transition hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="rounded-full ring-2 ring-white/10 transition group-hover:ring-gold-400/70">
          <Avatar size="h-9 w-9" />
        </span>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-4">
            <span className="rounded-full ring-2 ring-gold-400/40"><Avatar size="h-12 w-12 text-xl" /></span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 divide-x divide-white/10 border-b border-white/10 py-3 text-center">
            {statItems.map(s => (
              <div key={s.label} className="px-1">
                <p className="mb-display text-base font-semibold text-white">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="p-2">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={itemCls} role="menuitem">
                <span className="text-gold-400">{l.icon}</span> {l.label}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link href="/admin" onClick={() => setOpen(false)} className={itemCls} role="menuitem">
                <span className="text-gold-400"><Shield size={16} /></span> Admin Panel
              </Link>
            )}
          </div>

          <div className="border-t border-white/10 p-2">
            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 transition hover:bg-crimson-500/10"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}