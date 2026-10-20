'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { Lock, Eye, EyeOff, Check, AlertCircle, ArrowLeft } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showPw, setShowPw] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Check if this is a Google account
        const { data: profile } = await supabase
          .from('profiles')
          .select('auth_provider')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.auth_provider === 'google') {
          setError('Password reset is not available for Google accounts. Please use Google login.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        setUserEmail(session.user.email || null);
      } else {
        const hash = window.location.hash
        if (!hash || !hash.includes('access_token')) {
          setError('Invalid or expired password reset link. Please request a new one.')
        }
      }
    }
    checkSession()
  }, [supabase.auth, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess('Password updated successfully! Redirecting to login...')
      
      // Update email_confirmed status in profile
      if (userEmail) {
        try {
          await supabase
            .from('profiles')
            .update({ email_confirmed: true })
            .eq('email', userEmail)
            .eq('auth_provider', 'email');
        } catch (profileError) {
          console.error('Profile update error:', profileError);
          // Don't throw - password update was successful even if profile update fails
        }
      }
      
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?message=Password updated successfully. Please login with your new password.')
      }, 2000)
      
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      const error = err as Error;
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  const iconCls = 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500'
  const blocked = !!error?.includes('not available')

  return (
    <AuthShell
      title="Reset your password"
      subtitle={userEmail ? `Choose a new password for ${userEmail}` : 'Choose a new password for your account.'}
      eyebrow="Account security"
      headline={<>A fresh start, <span className="text-gold-400">one password away.</span></>}
    >
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-label">New Password</label>
          <div className="relative">
            <Lock className={iconCls} />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="Enter new password (min. 6 characters)"
              className="mb-input !pl-11 !pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-label">Confirm New Password</label>
          <div className="relative">
            <Lock className={iconCls} />
            <input
              id="confirmPassword"
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm new password"
              className="mb-input !pl-11"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
            <Check size={16} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <button type="submit" disabled={loading || blocked} className="mb-btn-primary w-full !py-3">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 transition hover:text-gold-300">
          <ArrowLeft size={15} /> Back to Login
        </Link>
      </div>
    </AuthShell>
  )
}