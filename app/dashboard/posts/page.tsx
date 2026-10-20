'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Edit, Trash2, CheckCircle, XCircle, Search, Plus, FileText, Film } from 'lucide-react'

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const supabase = createClient()
  const router = useRouter()

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = posts.filter(p => {
    if (status !== 'all' && p.status !== status) return false
    if (search && !p.movie_title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const del = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('post_reactions').delete().eq('post_id', id)
    await supabase.from('post_reaction_stats').delete().eq('post_id', id)
    await supabase.from('comments').delete().eq('post_id', id)
    await supabase.from('post_views').delete().eq('post_id', id)
    await supabase.from('posts').delete().eq('id', id)
    setPosts(posts.filter(p => p.id !== id))
  }

  const publish = async (id: string) => {
    await supabase.from('posts').update({ status: 'published', published_at: new Date().toISOString(), visibility: 'public' }).eq('id', id)
    load()
  }

  const unpublish = async (id: string) => {
    await supabase.from('posts').update({ status: 'draft', visibility: 'private' }).eq('id', id)
    load()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
      case 'draft': return 'bg-amber-400/10 text-amber-300 ring-amber-400/30'
      case 'scheduled': return 'bg-sky-400/10 text-sky-300 ring-sky-400/30'
      default: return 'bg-white/10 text-gray-300 ring-white/20'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-skeleton h-10 w-48" />
        <div className="mb-skeleton h-12" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="mb-skeleton h-20" />)}
      </div>
    )
  }

  const actionBtn = 'rounded-lg p-2 transition'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-eyebrow mb-2">Library</p>
          <h1 className="mb-display text-3xl font-semibold text-white">My Posts</h1>
          <p className="mt-1 text-sm text-gray-400">{posts.length} total · {filtered.length} shown</p>
        </div>
        <Link href="/dashboard/new-post" className="mb-btn-primary"><Plus size={16} /> New Post</Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title..." className="mb-input !pl-11" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-input md:w-48">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-ink-900/40 p-14 text-center">
          <FileText size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">No posts found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Movie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(post => (
                  <tr key={post.id} className="transition hover:bg-white/[0.03]">
                    <td className="cursor-pointer px-4 py-3" onClick={() => router.push(`/dashboard/edit-post/${post.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-ink-700 ring-1 ring-white/10">
                          {post.movie_poster_url ? (
                            <img src={post.movie_poster_url} alt={post.movie_title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-500"><Film size={14} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">{post.movie_title}</div>
                          <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${statusColor(post.status)}`}>{post.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button title="View" onClick={() => window.open(`/post/${post.id}`, '_blank')} className={`${actionBtn} text-sky-300 hover:bg-sky-400/10`}><Eye size={16} /></button>
                        <button title="Edit" onClick={() => router.push(`/dashboard/edit-post/${post.id}`)} className={`${actionBtn} text-gold-400 hover:bg-gold-400/10`}><Edit size={16} /></button>
                        {post.status === 'published' ? (
                          <button title="Unpublish" onClick={() => unpublish(post.id)} className={`${actionBtn} text-orange-300 hover:bg-orange-400/10`}><XCircle size={16} /></button>
                        ) : (
                          <button title="Publish" onClick={() => publish(post.id)} className={`${actionBtn} text-emerald-300 hover:bg-emerald-400/10`}><CheckCircle size={16} /></button>
                        )}
                        <button title="Delete" onClick={() => del(post.id)} className={`${actionBtn} text-red-300 hover:bg-crimson-500/10`}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}