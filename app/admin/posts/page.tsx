'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trash2, ExternalLink, Search, FileText } from 'lucide-react'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    
    // 1. Fetch all posts
    const { data: postsData, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (postsData) {
      // 2. Fetch profiles for those posts
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)

      const profilesMap: Record<string, any> = {}
      profilesData?.forEach(p => { profilesMap[p.id] = p })

      // 3. Combine them
      const combined = postsData.map(post => ({
        ...post,
        author: profilesMap[post.user_id] || { name: 'Unknown', email: '' }
      }))
      
      setPosts(combined)
    }
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return
    
    // Delete associated data first
    await supabase.from('post_reactions').delete().eq('post_id', id)
    await supabase.from('comments').delete().eq('post_id', id)
    await supabase.from('post_views').delete().eq('post_id', id)
    await supabase.from('reports').delete().eq('post_id', id)
    await supabase.from('posts').delete().eq('id', id)
    
    fetchPosts()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-skeleton h-10 w-64" />
        <div className="mb-skeleton h-12" />
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="mb-skeleton h-16" />)}
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = posts.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesSearch = !q
      || p.movie_title?.toLowerCase().includes(q)
      || p.author?.name?.toLowerCase().includes(q)
      || p.author?.email?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const statusStyle = (s: string) =>
    s === 'published'
      ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
      : s === 'scheduled'
        ? 'bg-sky-400/10 text-sky-300 ring-sky-400/30'
        : 'bg-white/10 text-gray-300 ring-white/20'

  return (
    <div>
      <div className="mb-6">
        <p className="mb-eyebrow mb-2">Moderation</p>
        <h1 className="mb-display text-3xl font-semibold text-white">Post Moderation</h1>
        <p className="mt-1 text-sm text-gray-400">{posts.length} total · {filtered.length} shown</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, author or email..." className="mb-input !pl-11" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mb-input md:w-48">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-semibold">Movie Title</th>
                <th className="p-4 font-semibold">Author</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">
                    <FileText size={28} className="mx-auto mb-3 text-gray-600" />
                    No posts found.
                  </td>
                </tr>
              ) : (
                filtered.map(post => (
                  <tr key={post.id} className="text-gray-300 transition hover:bg-white/[0.03]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-ink-700 ring-1 ring-white/10">
                          {post.movie_poster_url ? (
                            <img src={post.movie_poster_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-500"><FileText size={14} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{post.movie_title}</p>
                          <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{post.author.name}</p>
                      <p className="text-xs text-gray-500">{post.author.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${statusStyle(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/post/${post.id}`} target="_blank" className="rounded-lg p-2 text-sky-300 transition hover:bg-sky-400/10" title="View Post">
                          <ExternalLink size={17} />
                        </Link>
                        <button onClick={() => deletePost(post.id)} className="rounded-lg p-2 text-red-300 transition hover:bg-crimson-500/10" title="Delete Post">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}