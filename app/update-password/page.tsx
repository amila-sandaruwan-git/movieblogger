// app/update-password/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ready, setReady] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setReady(true); return }
      if (window.location.hash) {
        await new Promise(r => setTimeout(r, 1500))
        const { data: { session: s2 } } = await supabase.auth.getSession()
        if (s2) { setReady(true); return }
      }
      setMessage({ type: 'error', text: 'Invalid or expired reset link.' })
      setTimeout(() => router.push('/login'), 3000)
    }
    check()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (password.length < 6) { setMessage({ type: 'error', text: 'Min 6 characters' }); return }
    if (password !== confirm) { setMessage({ type: 'error', text: 'Passwords do not match' }); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage({ type: 'success', text: 'Password updated! Redirecting...' })
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login?message=Password updated. Please login.'), 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!ready && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
      </div>
    )
  }

  if (message?.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Reset Link Invalid</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{message.text}</p>
          <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    )
  }

  if (message?.type === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2 text-green-600">Password Updated!</h2>
          <p className="text-gray-600 dark:text-gray-400">{message.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Create New Password</h2>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}