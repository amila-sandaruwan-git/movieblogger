// app/update-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleResetFlow = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
        }
        
        if (session) {
          console.log('User is authenticated:', session.user.email)
          setIsReady(true)
          return
        }
        
        // Check for recovery hash in URL
        if (window.location.hash) {
          console.log('Recovery hash detected, waiting for Supabase to process...')
          
          // Wait for Supabase to auto-process the hash
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Check again for session
          const { data: { session: newSession } } = await supabase.auth.getSession()
          
          if (newSession) {
            console.log('Recovery session established:', newSession.user.email)
            setIsReady(true)
            return
          }
        }
        
        // No valid session
        console.log('No valid session found')
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please request a new password reset link.'
        })
        
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        
      } catch (error) {
        console.error('Error in reset flow:', error)
        setMessage({
          type: 'error',
          text: 'An error occurred. Please request a new password reset link.'
        })
      }
    }
    
    handleResetFlow()
  }, [router, supabase.auth])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Basic validation
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session. Please request a new reset link.')
      }
      
      console.log('Updating password in Supabase Auth...')
      
      // Update password in Supabase Auth (NOT in profiles table)
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Auth update error:', error)
        
        // Try to refresh session and retry
        if (error.message.includes('session') || error.message.includes('storage')) {
          const { data: { session: refreshedSession }, error: refreshError } = 
            await supabase.auth.refreshSession()
          
          if (refreshError) {
            throw new Error('Session expired. Please request a new reset link.')
          }
          
          if (refreshedSession) {
            // Retry with refreshed session
            const { error: retryError } = await supabase.auth.updateUser({
              password: password
            })
            
            if (retryError) throw retryError
          }
        } else {
          throw error
        }
      }
      
      console.log('Password updated successfully in Auth!')
      
      // Don't update profiles table - passwords don't belong there!
      // The auth.users table already has the new password
      
      setMessage({ 
        type: 'success', 
        text: '✓ Password updated successfully! Redirecting to login...' 
      })

      // Sign out to clear recovery session
      await supabase.auth.signOut()

      // Redirect to login
      setTimeout(() => {
        router.push('/login?message=Password updated successfully. Please login with your new password.')
      }, 2000)
      
    } catch (error: any) {
      console.error('Password update failed:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please request a new reset link.' 
      })
      setLoading(false)
    }
  }

  // Loading state
  if (!isReady && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (message?.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Reset Link Invalid</h2>
            <p className="text-gray-600 mb-6">{message.text}</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (message?.type === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-6">{message.text}</p>
          </div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Password</h2>
          <p className="mt-2 text-gray-600">Enter your new password below</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                  placeholder="Enter new password (min. 6 characters)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                  placeholder="Confirm your new password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}