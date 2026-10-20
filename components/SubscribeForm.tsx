// components/SubscribeForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const checkUserSubscription = async () => {
      setIsLoadingUser(true)
      
      // 1. Get the current logged in user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        // If no user is logged in, check localStorage just in case they subscribed as a guest
        const localSub = localStorage.getItem('subscribed_email')
        if (localSub) {
          setEmail(localSub)
          setIsSubscribed(true)
        }
        setIsLoadingUser(false)
        return
      }

      const userEmail = session.user.email
      
      if (userEmail) {
        // 2. Check if this user's email is in the subscribers table
        const { data } = await supabase
          .from('subscribers')
          .select('email')
          .eq('email', userEmail)
          .eq('is_active', true)
          .maybeSingle()

        if (data) {
          setEmail(userEmail)
          setIsSubscribed(true)
        } else {
          // They are logged in but NOT subscribed. Show the form with their email pre-filled
          setEmail(userEmail)
          setIsSubscribed(false)
        }
      }
      
      setIsLoadingUser(false)
    }

    checkUserSubscription()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setStatus('error')
      setMessage('Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      setStatus('error')
      setMessage('Please enter a valid email address')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage(data.message || 'Successfully subscribed!')
      
      // Save to local storage so it remembers even if they log out
      localStorage.setItem('subscribed_email', email)
      setIsSubscribed(true)

    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Something went wrong. Please try again.')
    }
  }

  // Show a loading state while checking the database
  if (isLoadingUser) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking subscription...</span>
      </div>
    )
  }

  // Show the success state ONLY if their specific email is subscribed
  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-3 rounded-lg border border-green-800">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <div>
          <span className="text-sm font-medium block">You're subscribed!</span>
          <span className="text-xs text-green-500/80">{email} will receive updates.</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
              disabled={status === 'loading'}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={status === 'loading'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Subscribe
              </>
            )}
          </button>
        </div>
        
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{message}</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
            <XCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">{message}</span>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Get notified when new movie reviews are published. No spam, unsubscribe anytime.
        </p>
      </form>
    </div>
  )
}