'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Bookmark, Trash2, Calendar, Eye, Film } from 'lucide-react'

export default function ReadingListPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: bookmarks } = await supabase.from('bookmarks').select('id, post_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    if (!bookmarks || bookmarks.length === 0) { setLoading(false); return }

    const postIds = bookmarks.map(b => b.post_id)
    const { data: posts } = await supabase.from('posts').select('id, movie_title, movie_poster_url, excerpt, published_at, view_count, duration').in('id', postIds).eq('status', 'published')

    const combined = bookmarks.map(b => ({
      ...b,
      post: posts?.find(p => p.id === b.post_id),
    })).filter(b => b.post)

    setItems(combined)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-skeleton h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="mb-skeleton h-36" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-eyebrow mb-2">Saved for later</p>
        <h1 className="mb-display flex items-center gap-3 text-3xl font-semibold text-white">
          <Bookmark className="text-gold-400" /> Reading List
          <span className="rounded-full bg-gold-400/15 px-3 py-0.5 text-sm font-semibold text-gold-300">{items.length}</span>
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-ink-900/40 py-16 text-center">
          <Bookmark size={44} className="mx-auto mb-4 text-gray-600" />
          <p className="mb-5 text-gray-400">No bookmarks yet</p>
          <Link href="/reviews" className="mb-btn-primary">Browse Reviews</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="group flex gap-4 rounded-2xl border border-white/10 bg-ink-900/60 p-4 transition hover:border-gold-400/30">
              <Link href={`/post/${item.post.id}`} className="shrink-0">
                <div className="h-28 w-20 overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10">
                  {item.post.movie_poster_url ? (
                    <img src={item.post.movie_poster_url} alt={item.post.movie_title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500"><Film size={20} /></div>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/post/${item.post.id}`}>
                  <h3 className="mb-display truncate text-lg font-semibold text-white transition hover:text-gold-300">{item.post.movie_title}</h3>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-gray-400">{item.post.excerpt}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Saved {new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> {item.post.view_count || 0} views</span>
                </div>
              </div>

              <button onClick={() => remove(item.id)} aria-label="Remove bookmark" className="self-start rounded-lg p-2 text-gray-500 transition hover:bg-crimson-500/10 hover:text-red-300">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}