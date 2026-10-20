'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, FileText, MessageSquare, Flag, ArrowRight } from 'lucide-react'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, posts: 0, comments: 0, reports: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, postsRes, commentsRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      
      setStats({
        users: usersRes.count || 0,
        posts: postsRes.count || 0,
        comments: commentsRes.count || 0,
        reports: reportsRes.count || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-skeleton h-10 w-64" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="mb-skeleton h-32" />)}
        </div>
      </div>
    )
  }

  const cards = [
    { label: 'Total Users', value: stats.users, icon: <Users size={20} />, tint: 'bg-sky-400/10 text-sky-300', href: '/admin/users' },
    { label: 'Total Posts', value: stats.posts, icon: <FileText size={20} />, tint: 'bg-emerald-400/10 text-emerald-300', href: '/admin/posts' },
    { label: 'Total Comments', value: stats.comments, icon: <MessageSquare size={20} />, tint: 'bg-fuchsia-400/10 text-fuchsia-300', href: null },
    { label: 'Pending Reports', value: stats.reports, icon: <Flag size={20} />, tint: 'bg-crimson-500/10 text-red-300', href: '/admin/reports' },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-eyebrow mb-2">Control room</p>
        <h1 className="mb-display text-3xl font-semibold text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-gray-400">A snapshot of what&apos;s happening on MovieBlogger.</p>
      </div>

      {stats.reports > 0 && (
        <Link
          href="/admin/reports"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-crimson-500/40 bg-crimson-500/10 p-4 transition hover:bg-crimson-500/15"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson-500/20 text-red-300"><Flag size={18} /></span>
            <p className="text-sm text-red-100">
              <strong className="font-semibold">{stats.reports}</strong> {stats.reports === 1 ? 'report needs' : 'reports need'} your attention.
            </p>
          </div>
          <ArrowRight size={18} className="text-red-300 transition group-hover:translate-x-1" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{c.label}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.tint}`}>{c.icon}</span>
              </div>
              <p className="mb-display mt-4 text-4xl font-semibold text-white">{c.value.toLocaleString()}</p>
            </>
          )
          const cls = 'rounded-2xl border border-white/10 bg-ink-900/70 p-6 transition'
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cls} hover:-translate-y-1 hover:border-gold-400/40`}>{body}</Link>
          ) : (
            <div key={c.label} className={cls}>{body}</div>
          )
        })}
      </div>

      <section>
        <h2 className="mb-display mb-4 text-xl font-semibold text-white">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: '/admin/users', label: 'Manage users', desc: 'Roles, bans and access', icon: <Users size={18} /> },
            { href: '/admin/posts', label: 'Moderate posts', desc: 'Review and remove content', icon: <FileText size={18} /> },
            { href: '/admin/messages', label: 'Open inbox', desc: 'Support chats and warnings', icon: <MessageSquare size={18} /> },
          ].map(a => (
            <Link key={a.href} href={a.href} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-ink-900/70 p-5 transition hover:border-gold-400/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">{a.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{a.label}</p>
                <p className="text-xs text-gray-500">{a.desc}</p>
              </div>
              <ArrowRight size={16} className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-gold-400" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}