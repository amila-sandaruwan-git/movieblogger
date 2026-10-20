'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Bell, CheckCheck, Trash2, Loader2, UserPlus, 
  MessageSquare, Reply, Film, Sparkles, MessageCircle 
} from 'lucide-react'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/login'); return }
    setUser(session.user)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Real-time updates for the page
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications-page-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const openNotification = async (n: any) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    
    // Check for specific actions first
    if (n.metadata?.action === 'open_messages') {
      router.push('/dashboard/messages')
      return
    }
    
    if (n.metadata?.action === 'open_admin_messages') {
      router.push('/admin/messages')
      return
    }

    if (n.type === 'follow' || n.type === 'welcome') return
    
    if (n.metadata?.post_id) {
      const url = n.metadata.comment_id
        ? `/post/${n.metadata.post_id}?comment=${n.metadata.comment_id}`
        : `/post/${n.metadata.post_id}`
      router.push(url)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-5 w-5" />
      case 'reply': return <Reply className="h-5 w-5" />
      case 'follow': return <UserPlus className="h-5 w-5" />
      case 'new_post': return <Film className="h-5 w-5" />
      case 'welcome': return <Sparkles className="h-5 w-5" />
      case 'message': return <MessageCircle className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-sky-500/15 text-sky-300 ring-sky-400/30'
      case 'reply': return 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30'
      case 'follow': return 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
      case 'new_post': return 'bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/30'
      case 'welcome': return 'bg-gold-400/15 text-gold-300 ring-gold-400/30'
      case 'message': return 'bg-teal-500/15 text-teal-300 ring-teal-400/30'
      default: return 'bg-white/10 text-gray-300 ring-white/20'
    }
  }

  const unread = notifications.filter(n => !n.is_read).length
  const visible = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 py-10">
        <div className="mb-container max-w-3xl space-y-4">
          <div className="mb-skeleton h-12 w-64" />
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="mb-skeleton h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950 py-10 text-white">
      <div className="mb-container max-w-3xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-eyebrow mb-2">Inbox</p>
            <h1 className="mb-display text-4xl font-semibold">Notifications</h1>
            <p className="mt-2 text-sm text-gray-400">
              {unread > 0 ? `You have ${unread} unread ${unread === 1 ? 'notification' : 'notifications'}` : 'You are all caught up!'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="mb-btn-ghost !py-2">
              <CheckCheck size={16} className="text-gold-400" /> Mark all read
            </button>
          )}
        </div>

        <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 font-medium capitalize transition ${
                filter === f ? 'bg-gold-400 text-ink-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              {f}{f === 'unread' && unread > 0 ? ` (${unread})` : ''}
            </button>
          ))}
        </div>

        <div className="mb-surface overflow-hidden">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center p-16 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-600">
                <Bell size={28} />
              </span>
              <p className="text-lg font-medium text-gray-300">
                {filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
              </p>
              <p className="mt-1 text-sm text-gray-500">New activity will show up here.</p>
            </div>
          ) : (
            visible.map(n => (
              <div
                key={n.id}
                onClick={() => openNotification(n)}
                className={`group relative flex cursor-pointer items-start gap-4 border-b border-white/5 p-5 transition last:border-b-0 hover:bg-white/[0.04] ${
                  !n.is_read ? 'bg-gold-400/[0.04]' : ''
                }`}
              >
                {!n.is_read && <span className="absolute inset-y-0 left-0 w-0.5 bg-gold-400" />}

                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${getNotificationBg(n.type)}`}>
                  {getNotificationIcon(n.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-base ${!n.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>{n.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">{n.message}</p>
                  <p className="mt-2 text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!n.is_read && <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-crimson-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    title="Delete"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}