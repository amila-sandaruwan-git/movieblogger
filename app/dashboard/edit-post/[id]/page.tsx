'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Save, Send } from 'lucide-react'

const TinyMceEditor = dynamic(() => import('@/components/TinyMceEditor'), {
  ssr: false,
  loading: () => <div className="mb-skeleton h-64 w-full" />,
})

export default function EditPostPage() {
  const { id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data, error } = await supabase.from('posts').select('*').eq('id', id).eq('user_id', user.id).single()
      if (error || !data) { setError('Post not found'); setLoading(false); return }
      setPost(data)
      setLoading(false)
    }
    load()
  }, [id])

  const save = async (action: 'draft' | 'publish') => {
    if (!post.movie_title.trim() || !post.content.trim()) {
      setError('Movie title and content are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('posts').update({
        content: post.content,
        excerpt: post.excerpt,
        movie_title: post.movie_title,
        movie_background_title: post.movie_background_title,
        movie_poster_url: post.movie_poster_url,
        movie_backdrop_url: post.movie_backdrop_url,
        release_date: post.release_date,
        director: post.director,
        cast: post.cast,
        genre_tags: post.genre_tags,
        duration: post.duration,
        review_language: post.review_language,
        movie_language: post.movie_language,
        trailer_url: post.trailer_url,
        tags: post.tags,
        status: action === 'publish' ? 'published' : 'draft',
        visibility: action === 'publish' ? 'public' : 'private',
        published_at: action === 'publish' ? new Date().toISOString() : post.published_at,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
      router.push('/dashboard/posts')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-skeleton h-10 w-72" />
        <div className="mb-skeleton h-96" />
      </div>
    )
  }
  if (error && !post) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-crimson-500/10 text-red-300"><AlertCircle size={26} /></span>
        <p className="text-red-300">{error}</p>
        <Link href="/dashboard/posts" className="mb-btn-ghost mt-6"><ArrowLeft size={16} /> Back to My Posts</Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/dashboard/posts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gold-400">
        <ArrowLeft size={15} /> My Posts
      </Link>
      <p className="mb-eyebrow mb-2">Editing</p>
      <h1 className="mb-display mb-8 text-3xl font-semibold text-white">{post.movie_title}</h1>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-5 text-lg font-semibold text-white">Basic Info</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-label">Movie Title</label>
              <input type="text" value={post.movie_title} onChange={(e) => setPost({ ...post, movie_title: e.target.value })} className="mb-input" />
            </div>
            <div>
              <label className="mb-label">Excerpt</label>
              <textarea value={post.excerpt || ''} onChange={(e) => setPost({ ...post, excerpt: e.target.value })} rows={3} className="mb-input resize-none" />
            </div>
            <div>
              <label className="mb-label">Content</label>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <TinyMceEditor value={post.content} onChange={(c) => setPost({ ...post, content: c })} />
              </div>
            </div>
            <div>
              <label className="mb-label">Review Language</label>
              <select value={post.review_language || ''} onChange={(e) => setPost({ ...post, review_language: e.target.value })} className="mb-input">
                <option value="">Select</option>
                <option value="English">English</option>
                <option value="Sinhala">Sinhala</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={() => router.push('/dashboard')} className="mb-btn-ghost">Cancel</button>
          <button onClick={() => save('draft')} disabled={saving} className="mb-btn border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20">
            <Save size={16} /> Save Draft
          </button>
          <button onClick={() => save('publish')} disabled={saving} className="mb-btn-primary">
            <Send size={16} /> Publish
          </button>
        </div>
      </div>
    </div>
  )
}