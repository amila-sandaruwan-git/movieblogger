'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { Mail, Lock, Check, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectParam = searchParams.get('redirect') || '/'

  useEffect(() => {
    const msg = searchParams.get('message')
    const err = searchParams.get('error')
    if (msg) setSuccess(msg)
    if (err) setError(err)
  }, [searchParams])

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectParam)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setGoogleLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })
      if (error) throw error
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Please verify your email before logging in. Check your inbox.')
      }
      router.push(redirectParam)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/update-password` }
      )
      if (error) throw error
      setResetSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const googleIcon = (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )

  const iconCls = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500'

  const errorBox = error && (
    <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <p>{error}</p>
    </div>
  )

  /* ---------- Reset link sent ---------- */
  if (resetSent) {
    return (
      <AuthShell title="Check your email" subtitle="We sent you a link to reset your password.">
        <div className="mb-surface p-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/10 text-gold-400">
            <MailCheck size={26} />
          </span>
          <p className="text-sm text-gray-300">
            A reset link is on its way to <strong className="text-white">{email}</strong>
          </p>
          <button
            onClick={() => { setForgot(false); setResetSent(false) }}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-400 transition hover:text-gold-300"
          >
            <ArrowLeft size={15} /> Back to login
          </button>
        </div>
      </AuthShell>
    )
  }

  /* ---------- Forgot password ---------- */
  if (forgot) {
    return (
      <AuthShell title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
        <form onSubmit={handleForgot} className="space-y-4">
          <div className="relative">
            <Mail className={iconCls} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="mb-input !pl-11" />
          </div>
          <button type="submit" disabled={loading} className="mb-btn-primary w-full !py-3">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <button
            type="button"
            onClick={() => { setForgot(false); setError(null) }}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={15} /> Back
          </button>
        </form>
        {errorBox}
      </AuthShell>
    )
  }

  /* ---------- Login ---------- */
  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your movie journey.">
      {success && (
        <div role="status" className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
          <Check size={16} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <button onClick={handleGoogle} disabled={googleLoading} className="mb-btn-ghost w-full !py-3">
        {googleLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" /> : googleIcon}
        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
      </button>

      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-gray-500">
        <span className="h-px flex-1 bg-white/10" />
        Or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={handleEmail} className="space-y-4">
        <div className="relative">
          <Mail className={iconCls} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required disabled={loading} className="mb-input !pl-11" />
        </div>
        <div className="relative">
          <Lock className={iconCls} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required disabled={loading} className="mb-input !pl-11" />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setForgot(true); setError(null) }}
            className="text-sm text-gray-400 transition hover:text-gold-300"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="mb-btn-primary w-full !py-3">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {errorBox}

      <p className="mt-8 text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectParam)}`} className="font-semibold text-gold-400 transition hover:text-gold-300">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}