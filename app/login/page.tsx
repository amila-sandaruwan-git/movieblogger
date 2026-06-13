// app/login/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { notificationHelpers } from '@/lib/notifications'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Clear any stale session data on page load
    const initializePage = async () => {
      try {
        // Check for success message from URL
        const message = searchParams.get('message')
        if (message) {
          setSuccessMessage(message)
          // Remove the message from URL without refreshing
          const url = new URL(window.location.href)
          url.searchParams.delete('message')
          window.history.replaceState({}, '', url.toString())
        }

        // Clear any stale session data
        const { data: { session } } = await supabase.auth.getSession()
        
        // If there's a session but it's not valid, clear it
        if (session) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            await supabase.auth.signOut()
            localStorage.clear()
            sessionStorage.clear()
          } else {
            // User is logged in, redirect to home
            router.push('/')
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      }
    }
    
    initializePage()
  }, [supabase.auth, router, searchParams])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      
      if (error) throw error
      
      // The OAuth redirect will happen automatically
      console.log('Google login initiated, redirecting to Google...')
      
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(err.message || 'Failed to login with Google. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // First, clear any existing session to avoid conflicts
      await supabase.auth.signOut()
      
      // Small delay to ensure sign out completes
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.toLowerCase().trim(), 
        password 
      })
      
      if (error) throw error
      
      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.')
      }
      
      // Success - redirect to home
      router.push('/')
      router.refresh()
      
    } catch (err: any) {
      console.error('Email login error:', err)
      
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (err.message.includes('Email not confirmed') || err.message.includes('verify your email')) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.')
      } else {
        setError(err.message || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const redirectUrl = `${window.location.origin}/update-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: redirectUrl,
      })
      
      if (error) throw error
      
      setResetEmailSent(true)
      
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setForgotPasswordMode(false)
    setResetEmailSent(false)
    setError(null)
    setSuccessMessage(null)
    setEmail('')
  }

  const handleResetAndRefresh = () => {
    localStorage.clear()
    sessionStorage.clear()
    supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {forgotPasswordMode ? 'Reset Password' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {forgotPasswordMode 
                ? 'Enter your email to receive reset instructions' 
                : 'Login to your account'}
            </p>
          </div>

          {/* Success Message from Email Verification */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm text-center">{successMessage}</p>
            </div>
          )}

          {resetEmailSent ? (
            // Success message after sending reset email
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-center mb-3">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 text-center mb-2">
                  Check Your Email
                </h3>
                <p className="text-green-700 dark:text-green-400 text-center text-sm">
                  We've sent password reset instructions to:<br />
                  <strong className="font-medium">{email}</strong>
                </p>
                <p className="text-green-600 dark:text-green-500 text-center text-xs mt-3">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Back to Login
              </button>
            </div>
          ) : forgotPasswordMode ? (
            // Forgot password form
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-gray-600 dark:text-gray-400 py-2 rounded-lg font-medium hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                ← Back to Login
              </button>
            </form>
          ) : (
            // Normal login form
            <>
              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 mb-4"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Forgot Password Link */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setForgotPasswordMode(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Reset Session Button - Helps with stuck sessions */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleResetAndRefresh}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline focus:outline-none"
                >
                  Having trouble logging in? Click here to reset session
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}