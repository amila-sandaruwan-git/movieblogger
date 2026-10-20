'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Search, X, ChevronLeft } from 'lucide-react'

export default function AdminMessagesPage() {
  const [threads, setThreads] = useState<any[]>([])
  const [activeThread, setActiveThread] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchThreads()
  }, [])

  // 1. Auto-scroll ONLY the chat box
  useEffect(() => {
    // Using setTimeout ensures the DOM is fully painted before scrolling
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }, [messages])

  // 2. Real-time listener for new messages
  useEffect(() => {
    if (!activeThread) return

    const channel = supabase
      .channel(`admin-chat-${activeThread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          // If the message belongs to this chat thread, add it to state
          if (
            (newMsg.sender_id === activeThread.id) || 
            (newMsg.receiver_id === activeThread.id)
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
  }, [activeThread, supabase])

  const fetchThreads = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, created_at')
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })

    if (data) {
      const userIds = new Set<string>()
      data.forEach(m => {
        if (m.sender_id !== session.user.id) userIds.add(m.sender_id)
        if (m.receiver_id !== session.user.id) userIds.add(m.receiver_id)
      })

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', Array.from(userIds))

      setThreads(profiles || [])
    }
    setLoading(false)
  }

  const loadMessages = async (otherUser: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    setActiveThread(otherUser)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true })

    setMessages(data || [])

    // Mark as read
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', otherUser.id).eq('receiver_id', session.user.id)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeThread) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    const msgContent = newMessage.trim()
    setNewMessage('')

    await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: activeThread.id,
      content: msgContent
    })

    await supabase.from('notifications').insert({
      user_id: activeThread.id,
      type: 'message',
      title: 'New Message from Admin',
      message: `Admin: ${msgContent.substring(0, 50)}${msgContent.length > 50 ? '...' : ''}`,
      metadata: { action: 'open_messages' }
    })
    
    // Add to thread list if it's a new chat
    if (!threads.find(t => t.id === activeThread.id)) {
      setThreads(prev => [activeThread, ...prev])
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(5)
    
    setSearchResults(data || [])
  }

  if (loading) {
    return <div className="mb-skeleton h-[60vh]" />
  }

  const initial = (u: any) => u?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] flex-col overflow-hidden">
      <div className="mb-5 flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-eyebrow mb-2">Inbox</p>
          <h1 className="mb-display text-3xl font-semibold text-white">Messages &amp; Support</h1>
        </div>
        <button
          onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]) }}
          className="mb-btn-primary !py-2"
        >
          {showSearch ? <X size={16} /> : <MessageSquare size={16} />}
          {showSearch ? 'Close Search' : 'New Message'}
        </button>
      </div>

      {showSearch && (
        <div className="relative z-10 mb-4 shrink-0 rounded-2xl border border-white/10 bg-ink-900 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search user by name or email..."
              autoFocus
              className="mb-input !pl-11"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute inset-x-4 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/60">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    loadMessages(user)
                    setShowSearch(false)
                    // Add to thread list visually immediately
                    if (!threads.find(t => t.id === user.id)) {
                      setThreads(prev => [user, ...prev])
                    }
                  }}
                  className="flex w-full items-center gap-3 border-b border-white/5 p-3 text-left transition last:border-0 hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-ink-950">{initial(user)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70">
        {/* Thread list */}
        <div className={`${activeThread ? 'hidden md:block' : 'block'} w-full shrink-0 overflow-y-auto border-r border-white/10 md:w-80`}>
          {threads.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">No active chats.</p>
          ) : (
            threads.map(t => (
              <button
                key={t.id}
                onClick={() => loadMessages(t)}
                className={`relative w-full border-b border-white/5 p-4 text-left transition hover:bg-white/5 ${activeThread?.id === t.id ? 'bg-white/[0.06]' : ''}`}
              >
                {activeThread?.id === t.id && <span className="absolute inset-y-0 left-0 w-0.5 bg-gold-400" />}
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 font-bold text-ink-950">{initial(t)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{t.name}</p>
                    <p className="truncate text-xs text-gray-500">{t.email}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Conversation */}
        <div className={`${activeThread ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-1 flex-col bg-ink-950/60`}>
          {activeThread ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-ink-900 p-4">
                <button onClick={() => setActiveThread(null)} aria-label="Back to chats" className="rounded-lg p-1 text-gray-400 transition hover:bg-white/10 hover:text-white md:hidden">
                  <ChevronLeft size={20} />
                </button>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-ink-950">{initial(activeThread)}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{activeThread.name}</p>
                  <p className="truncate text-xs text-gray-500">{activeThread.email}</p>
                </div>
              </div>

              {/* Inner scroll container for messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.map((m, i) => {
                  const isMe = m.sender_id !== activeThread.id
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isMe ? 'rounded-br-md bg-gold-400 text-ink-950' : 'rounded-bl-md bg-ink-700 text-gray-100'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-white/10 p-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="mb-input flex-1 !rounded-full !px-5"
                />
                <button type="submit" aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition hover:bg-gold-300 active:scale-95">
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-gray-600">
              <MessageSquare size={44} className="mb-4 opacity-50" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}