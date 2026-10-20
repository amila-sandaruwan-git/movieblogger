'use client'

import { useState, useEffect, useRef } from 'react'
import { HelpCircle, X, Send, ChevronLeft, Headset } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [message, setMessage] = useState('')
  
  // Chat History state
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isChatActive, setIsChatActive] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. LISTEN FOR LOGOUT (Clear everything instantly)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserId(null)
        setAdminId(null)
        setChatMessages([])
        setIsChatActive(false)
        setIsOpen(false)
        setStep(0)
        setMessage('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // 2. Load user session and previous chat history when widget opens
  useEffect(() => {
    if (!isOpen) return

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      setUserId(session.user.id)

      // Fetch admin ID
      const { data: adminData } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single()
      if (adminData) {
        setAdminId(adminData.id)

        // Fetch past messages
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${adminData.id}),and(sender_id.eq.${adminData.id},receiver_id.eq.${session.user.id})`)
          .order('created_at', { ascending: true })

        if (data && data.length > 0) {
          setChatMessages(data)
          setIsChatActive(true) 
        } else {
          setChatMessages([])
          setIsChatActive(false)
        }
      }
    }
    init()
  }, [isOpen, supabase])

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  // 3. Real-time listener for chat replies while widget is open
  useEffect(() => {
    if (!userId || !adminId || !isChatActive) return

    const channel = supabase
      .channel(`widget-chat-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (
            (newMsg.sender_id === adminId && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === adminId)
          ) {
            setChatMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, adminId, isChatActive, supabase])

  const handleStartChat = async () => {
    if (!userId || !adminId) {
      alert("Please log in to contact support.")
      return
    }
    setLoading(true)

    // Send the initial message containing their chosen reason
    const initialMessage = `Support Request: ${message}`
    
    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: adminId,
      content: initialMessage
    })

    // Send notification to admin
    await supabase.from('notifications').insert({
      user_id: adminId,
      type: 'message',
      title: 'New Support Request',
      message: `A user needs help: ${message}`,
      metadata: { action: 'open_admin_messages', sender_id: userId }
    })

    setIsChatActive(true)
    setLoading(false)
    setMessage('')
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !userId || !adminId) return

    const msg = message.trim()
    setMessage('')

    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: adminId,
      content: msg
    })

    await supabase.from('notifications').insert({
      user_id: adminId,
      type: 'message',
      title: 'New Message from User',
      message: `User replied to support chat.`,
      metadata: { action: 'open_admin_messages', sender_id: userId }
    })
  }

  const showQuestionFlow = !isChatActive

  // Hide widget on admin pages (kept AFTER all hooks so the hook order never changes between routes)
  if (pathname.startsWith('/admin')) return null

  const bubble = 'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed'
  const botBubble = 'self-start rounded-2xl rounded-bl-md bg-ink-700 px-3.5 py-2.5 text-sm text-gray-100'
  const choiceBtn = 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:border-gold-400/50 hover:bg-gold-400/10'

  return (
    <>
      {/* Floating Button - Left Side */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400 text-ink-950 shadow-[0_10px_30px_-8px_rgba(245,196,81,0.6)] transition-transform hover:scale-110 active:scale-95"
        aria-label="Help & Support"
      >
        <HelpCircle size={26} />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start bg-black/60 p-4 backdrop-blur-sm sm:p-6 md:p-10"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="animate-slide-in-right flex h-[520px] max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/70"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Support chat"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-gold-500/20 to-transparent px-4 py-3.5">
              <div className="flex items-center gap-3">
                {showQuestionFlow && step > 0 && (
                  <button onClick={() => setStep(step - 1)} aria-label="Back" className="rounded-lg p-1 text-gray-300 transition hover:bg-white/10 hover:text-white">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 text-ink-950">
                  <Headset size={17} />
                </span>
                <div>
                  <h3 className="mb-display font-semibold leading-tight text-white">Support Assistant</h3>
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> We usually reply fast
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col justify-end space-y-3 overflow-y-auto p-4">
              {/* Existing chat */}
              {!showQuestionFlow && (
                <>
                  <div className="mb-1 text-center text-xs text-gray-500">You are connected to Admin Support</div>
                  {chatMessages.map((m, i) => {
                    const isMe = m.sender_id !== adminId
                    return (
                      <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${bubble} ${
                          isMe
                            ? 'rounded-br-md bg-gold-400 text-ink-950'
                            : m.content.startsWith('⚠️')
                              ? 'rounded-bl-md border border-crimson-500/40 bg-crimson-500/10 text-red-100'
                              : 'rounded-bl-md bg-ink-700 text-gray-100'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={scrollRef} />
                </>
              )}

              {/* New request flow */}
              {showQuestionFlow && (
                <>
                  {step === 0 && (
                    <>
                      <div className={botBubble}>Hi there! 👋 How can we help you today?</div>
                      <button onClick={() => setStep(1)} className={choiceBtn}>Ask a question</button>
                      <button onClick={() => setStep(2)} className={choiceBtn}>Report a problem</button>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <div className={botBubble}>What is the main topic of your question?</div>
                      <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your topic..."
                        className="mb-input"
                      />
                      <button onClick={() => setStep(3)} disabled={!message.trim()} className="mb-btn-primary w-full">Next</button>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <div className={botBubble}>Please describe the issue you&apos;re facing.</div>
                      <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Describe the issue..."
                        className="mb-input"
                      />
                      <button onClick={() => setStep(3)} disabled={!message.trim()} className="mb-btn-primary w-full">Next</button>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <div className={botBubble}>Do you want to connect to an Admin via chat?</div>
                      <div className="flex gap-2">
                        <button onClick={handleStartChat} disabled={loading} className="mb-btn-primary flex-1">
                          {loading ? 'Connecting...' : 'Yes, Chat'}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="mb-btn-ghost flex-1">No</button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Input (chat mode only) */}
            {!showQuestionFlow && (
              <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-white/10 bg-ink-900 p-3">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="mb-input flex-1 !rounded-full !px-4 !py-2.5"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  aria-label="Send"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400 text-ink-950 transition hover:bg-gold-300 disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}