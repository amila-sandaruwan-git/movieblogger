'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, UserPlus, FileText, Eye, CheckCircle2, FilePen, CalendarClock, Plus, Pencil, Send, Trash2 } from 'lucide-react'

export default function DashboardPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, scheduled: 0, views: 0, followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setPosts(postsData || [])

      const [fol, fing] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      ])

      const list = postsData || []
      setStats({
        total: list.length,
        published: list.filter(p => p.status === 'published').length,
        drafts: list.filter(p => p.status === 'draft').length,
        scheduled: list.filter(p => p.status === 'scheduled').length,
        views: list.reduce((s, p) => s + (p.view_count || 0), 0),
        followers: fol.count || 0,
        following: fing.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('post_reactions').delete().eq('post_id', id)
    await supabase.from('comments').delete().eq('post_id', id)
    await supabase.from('post_views').delete().eq('post_id', id)
    await supabase.from('posts').delete().eq('id', id)
    setPosts(posts.filter(p => p.id !== id))
  }

  const publishPost = async (id: string) => {
    await supabase.from('posts').update({ status: 'published', published_at: new Date().toISOString(), visibility: 'public' }).eq('id', id)
    setPosts(posts.map(p => p.id === id ? { ...p, status: 'published' } : p))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-skeleton h-12 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="mb-skeleton h-28" />)}
        </div>
        <div className="mb-skeleton h-72" />
      </div>
    )
  }

  const headline = [
    { label: 'Followers', value: stats.followers, icon: <Users size={18} />, tint: 'text-gold-400 bg-gold-400/10' },
    { label: 'Following', value: stats.following, icon: <UserPlus size={18} />, tint: 'text-sky-300 bg-sky-400/10' },
    { label: 'Total Posts', value: stats.total, icon: <FileText size={18} />, tint: 'text-emerald-300 bg-emerald-400/10' },
    { label: 'Total Views', value: stats.views, icon: <Eye size={18} />, tint: 'text-fuchsia-300 bg-fuchsia-400/10' },
  ]

  const breakdown = [
    { label: 'Published', value: stats.published, icon: <CheckCircle2 size={16} />, color: 'text-emerald-300', bar: 'bg-emerald-400' },
    { label: 'Drafts', value: stats.drafts, icon: <FilePen size={16} />, color: 'text-amber-300', bar: 'bg-amber-400' },
    { label: 'Scheduled', value: stats.scheduled, icon: <CalendarClock size={16} />, color: 'text-sky-300', bar: 'bg-sky-400' },
  ]

  const statusStyle: Record<string, string> = {
    published: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
    draft: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
    scheduled: 'bg-sky-400/10 text-sky-300 ring-sky-400/30',
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-eyebrow mb-2">Overview</p>
          <h1 className="mb-display text-3xl font-semibold text-white">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-400">Track your blog performance</p>
        </div>
        <Link href="/dashboard/new-post" className="mb-btn-primary">
          <Plus size={16} /> New Post
        </Link>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map(s => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-ink-900/70 p-5 transition hover:border-gold-400/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{s.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.tint}`}>{s.icon}</span>
            </div>
            <p className="mb-display mt-3 text-3xl font-semibold text-white">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {breakdown.map(b => {
          const pct = stats.total > 0 ? Math.round((b.value / stats.total) * 100) : 0
          return (
            <div key={b.label} className="rounded-2xl border border-white/10 bg-ink-900/70 p-5">
              <div className={`flex items-center gap-2 text-sm ${b.color}`}>{b.icon} {b.label}</div>
              <p className="mb-display mt-2 text-3xl font-semibold text-white">{b.value}</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent posts */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="mb-display text-xl font-semibold text-white">Recent Posts</h2>
          <Link href="/dashboard/posts" className="text-sm font-medium text-gold-400 transition hover:text-gold-300">View all</Link>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.slice(0, 8).map(post => (
              <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition hover:border-white/20">
                <div className="flex min-w-0 items-center gap-4">
                  {post.movie_poster_url ? (
                    <img src={post.movie_poster_url} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-ink-700 text-gray-500"><FileText size={14} /></div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{post.movie_title}</h3>
                    <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${statusStyle[post.status] || 'bg-white/10 text-gray-300 ring-white/20'}`}>
                        {post.status}
                      </span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/edit-post/${post.id}`} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-sky-300 transition hover:bg-sky-400/10">
                    <Pencil size={14} /> Edit
                  </Link>
                  {post.status !== 'published' && (
                    <button onClick={() => publishPost(post.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-400/10">
                      <Send size={14} /> Publish
                    </button>
                  )}
                  <button onClick={() => deletePost(post.id)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-300 transition hover:bg-crimson-500/10">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-ink-900/40 p-12 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">
              No posts yet.{' '}
              <Link href="/dashboard/new-post" className="font-semibold text-gold-400 hover:text-gold-300">Create your first</Link>
            </p>
          </div>
        )}
      </section>
    </div>
  )
}