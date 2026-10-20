'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ExternalLink, AlertTriangle, Trash2, MessageSquareWarning } from 'lucide-react'
import Link from 'next/link'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    setErrorMsg(null)

    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (reportsError) {
      setErrorMsg(`Database Error: ${reportsError.message}`)
      setLoading(false)
      return
    }

    if (reportsData && reportsData.length > 0) {
      const grouped: Record<string, any> = {}
      
      reportsData.forEach(report => {
        const pId = report.post_id.toString() 
        if (!grouped[pId]) {
          grouped[pId] = { post_id: pId, reports: [], count: 0 }
        }
        grouped[pId].reports.push(report)
        grouped[pId].count++
      })

      const postIds = Object.keys(grouped)
      
      // Fetch post titles AND author IDs
      const { data: postsData } = await supabase
        .from('posts')
        .select('id, movie_title, user_id')
        .in('id', postIds)
        
      const postMap: Record<string, any> = {}
      postsData?.forEach(p => { postMap[p.id.toString()] = p })

      const finalReports = Object.values(grouped).map((g: any) => ({
        ...g,
        movie_title: postMap[g.post_id]?.movie_title || 'Deleted Post',
        author_id: postMap[g.post_id]?.user_id
      }))

      finalReports.sort((a, b) => b.count - a.count)
      setReports(finalReports)
    } else {
      setReports([])
    }
    setLoading(false)
  }

  const sendWarning = async (postId: string, authorId: string, movieTitle: string) => {
    const message = prompt(
      `Enter a warning message for the author of "${movieTitle}":`, 
      "Your post has been reported multiple times. Please review our community guidelines. Further violations may result in your account being suspended."
    )
    if (!message) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // 1. Insert message into the chat
      await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: authorId,
        content: `⚠️ **Admin Warning:** ${message}`
      })

      // 2. Send notification (with action to open messages)
      await supabase.from('notifications').insert({
        user_id: authorId,
        type: 'message',
        title: 'Warning from Admin',
        message: `You received a warning regarding your post: "${movieTitle}"`,
        metadata: { 
          post_id: postId, 
          action: 'open_messages'
        }
      })

      alert('Warning sent successfully!')
      resolveAll(postId) // Automatically dismiss reports once warned
    } catch (err: any) {
      alert('Failed to send warning: ' + err.message)
    }
  }

  const resolveAll = async (postId: string) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('post_id', postId)
    fetchReports()
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return
    await supabase.from('reports').delete().eq('post_id', postId)
    await supabase.from('posts').delete().eq('id', postId)
    fetchReports()
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="mb-skeleton h-10 w-64" />
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="mb-skeleton h-40" />)}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-eyebrow mb-2">Moderation</p>
        <h1 className="mb-display text-3xl font-semibold text-white">Report Center</h1>
        <p className="mt-1 text-sm text-gray-400">
          {reports.length} {reports.length === 1 ? 'post' : 'posts'} with pending reports
        </p>
      </div>

      {errorMsg && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-4 text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <p>{errorMsg}</p>
        </div>
      )}

      {reports.length === 0 && !errorMsg ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 bg-ink-900/40 p-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
            <CheckCircle size={26} />
          </span>
          <p className="text-gray-300">No pending reports found.</p>
          <p className="mt-1 text-sm text-gray-500">The community is behaving!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map(group => {
            const flagged = group.count >= 3
            return (
              <div
                key={group.post_id}
                className={`rounded-2xl border bg-ink-900/70 p-5 sm:p-6 ${flagged ? 'border-crimson-500/60 shadow-[0_0_40px_-20px_rgba(229,72,77,0.6)]' : 'border-white/10'}`}
              >
                <div className="mb-4 flex flex-col justify-between gap-4 border-b border-white/10 pb-4 md:flex-row">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${flagged ? 'bg-crimson-500 text-white' : 'bg-amber-400 text-ink-950'}`}>
                        {group.count} {group.count === 1 ? 'REPORT' : 'REPORTS'}
                      </span>
                      {flagged && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-red-300">
                          <AlertTriangle size={15} /> Flagged
                        </span>
                      )}
                    </div>
                    <h3 className="mb-display truncate text-xl font-semibold text-white">&ldquo;{group.movie_title}&rdquo;</h3>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link href={`/post/${group.post_id}`} target="_blank" className="mb-btn-ghost !px-3.5 !py-2 text-sky-300">
                      <ExternalLink size={15} /> View Post
                    </Link>
                    <button onClick={() => sendWarning(group.post_id, group.author_id, group.movie_title)} className="mb-btn !px-3.5 !py-2 border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20">
                      <MessageSquareWarning size={15} /> Warn Author
                    </button>
                    <button onClick={() => resolveAll(group.post_id)} className="mb-btn !px-3.5 !py-2 border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20">
                      <CheckCircle size={15} /> Dismiss
                    </button>
                    <button onClick={() => deletePost(group.post_id)} className="mb-btn-danger !px-3.5 !py-2">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.reports.map((report: any, i: number) => (
                    <div key={i} className="rounded-xl border border-white/5 bg-white/[0.04] p-3 text-sm text-gray-300">
                      &ldquo;{report.reason}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}