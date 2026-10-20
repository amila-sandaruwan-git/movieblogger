'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Shield, MessagesSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function UserMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    init()
  }, [])

  // 1. Auto-scroll ONLY the inner box
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }, [messages])

  // 2. Real-time listener for user messages
  useEffect(() => {
    if (!userId || !adminId) return

    const channel = supabase
      .channel(`user-chat-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (
            (newMsg.sender_id === adminId && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === adminId)
          ) {
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, adminId, supabase])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { router.push('/login'); return }

    setUserId(session.user.id)

    // Get admin ID
    const { data: adminData } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()
    if (adminData) {
      setAdminId(adminData.id)
      fetchMessages(session.user.id, adminData.id)
    } else {
      setLoading(false)
    }
  }

  const fetchMessages = async (uid: string, admin: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},receiver_id.eq.${admin}),and(sender_id.eq.${admin},receiver_id.eq.${uid})`)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])
    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !adminId || !userId) return

    const msg = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: adminId,
      content: msg
    })

    await supabase.from('notifications').insert({
      user_id: adminId,
      type: 'message',
      title: 'New Message from User',
      message: `${userId.substring(0, 8)}... replied to your support chat.`,
      metadata: { action: 'open_admin_messages', sender_id: userId }
    })
  }

  if (loading) {
    return <div className="mb-skeleton h-[60vh]" />
  }
  if (!adminId) {
    return (
      <div className="flex flex-col items-center py-16 text-center text-gray-400">
        <Shield size={32} className="mb-3 text-gray-600" />
        No admin found to message.
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-240px)] min-h-[420px] flex-col">
      <div className="mb-5 shrink-0">
        <p className="mb-eyebrow mb-2">Support</p>
        <h1 className="mb-display text-3xl font-semibold text-white">Messages &amp; Warnings</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/15 text-gold-400 ring-1 ring-gold-400/30">
            <Shield size={18} />
          </span>
          <div>
            <p className="font-semibold text-white">Admin Support</p>
            <p className="text-xs text-gray-500">Replies usually arrive here</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="mt-12 flex flex-col items-center text-center text-gray-500">
              <MessagesSquare size={32} className="mb-3 opacity-50" />
              <p>No messages yet. Say hello to the admin!</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.sender_id !== adminId
              const warning = !isMe && m.content.startsWith('⚠️')
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[70%] ${
                      isMe
                        ? 'rounded-br-md bg-gold-400 text-ink-950'
                        : warning
                          ? 'rounded-bl-md border border-crimson-500/40 bg-crimson-500/10 text-red-100'
                          : 'rounded-bl-md bg-ink-700 text-gray-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-white/10 p-4">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Reply to Admin..."
            className="mb-input flex-1 !rounded-full !px-5"
          />
          <button type="submit" aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition hover:bg-gold-300 active:scale-95">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}