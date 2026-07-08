// components/SubscribeForm.tsx - FIXED without jsx import
'use client'

import { useState, useEffect } from 'react'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Check if user is already subscribed (from localStorage)
  useEffect(() => {
    const subscribed = localStorage.getItem('subscribed_email')
    if (subscribed) {
      setIsSubscribed(true)
    }
  }, [])

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
        body: JSON.stringify({ email, name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage(data.message || 'Successfully subscribed!')
      
      // Store in localStorage to remember
      localStorage.setItem('subscribed_email', email)
      setIsSubscribed(true)
      
      // Clear form
      setEmail('')
      setName('')

    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Something went wrong. Please try again.')
    }
  }

  if (isSubscribed) {
    return (
      <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-3 rounded-lg">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm">You're subscribed! Thank you for joining.</span>
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
            className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
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