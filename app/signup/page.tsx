'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Film, Check, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) return setError('Please enter your name')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const emailRedirectUrl = `${window.location.origin}/login?message=${encodeURIComponent(
        'Email verified! You can now log in.'
      )}&redirect=${encodeURIComponent(redirectParam)}`

      const { error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            full_name: name.trim(),
          },
          emailRedirectTo: emailRedirectUrl,
        },
      })
      if (error) throw error

      setSuccess('Verification email sent! Check your inbox, then log in.')
      setTimeout(
        () =>
          router.push(
            `/login?message=${encodeURIComponent('Verification email sent!')}&redirect=${encodeURIComponent(redirectParam)}`
          ),
        3000
      )
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    'Write and publish your own movie reviews',
    'Follow reviewers and build a reading list',
    'Join the conversation in every comment thread',
  ]

  const iconCls = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500'

  return (
    <div className="grid min-h-screen bg-ink-950 lg:grid-cols-2">
      {/* ---------- Cinematic side panel ---------- */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img src="/banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Film size={18} />
            </span>
            <span className="mb-display text-xl font-semibold text-white">
              Movie<span className="text-gold-400">Blogger</span>
            </span>
          </Link>

          <div>
            <p className="mb-eyebrow mb-4">Join the community</p>
            <h2 className="mb-display max-w-md text-4xl font-semibold leading-tight text-white">
              Every great film deserves a great <span className="text-gold-400">conversation.</span>
            </h2>
            <ul className="mt-8 space-y-3">
              {perks.map(p => (
                <li key={p} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-400">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* ---------- Form ---------- */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-fade-up w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-ink-950">
              <Film size={18} />
            </span>
            <span className="mb-display text-xl font-semibold text-white">
              Movie<span className="text-gold-400">Blogger</span>
            </span>
          </Link>

          <h1 className="mb-display text-3xl font-semibold text-white">Create your account</h1>
          <p className="mb-8 mt-2 text-sm text-gray-400">Start sharing your take on the movies you love.</p>

          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="mb-btn-ghost w-full !py-3"
          >
            {googleLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-gray-500">
            <span className="h-px flex-1 bg-white/10" />
            Or sign up with email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className={iconCls} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required disabled={loading} className="mb-input !pl-11" />
            </div>

            <div className="relative">
              <Mail className={iconCls} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required disabled={loading} className="mb-input !pl-11" />
            </div>

            <div className="relative">
              <Lock className={iconCls} />
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6)" required disabled={loading} className="mb-input !pl-11 !pr-11" />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Lock className={iconCls} />
              <input type={showPw ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm Password" required disabled={loading} className="mb-input !pl-11" />
            </div>

            <button type="submit" disabled={loading || googleLoading} className="mb-btn-primary w-full !py-3">
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div role="status" className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
              <Check size={16} className="mt-0.5 shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
              className="font-semibold text-gold-400 transition hover:text-gold-300"
            >
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}