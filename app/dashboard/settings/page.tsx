'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const requestDeletion = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') return
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 7)
    await supabase.from('account_deletion_requests').insert({
      user_id: user.id,
      requested_at: new Date().toISOString(),
      scheduled_deletion_date: deletionDate.toISOString(),
      status: 'pending',
    })
    alert('Deletion scheduled for ' + deletionDate.toLocaleDateString())
    setDeleting(false)
    setConfirmText('')
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="mb-skeleton h-10 w-48" />
        <div className="mb-skeleton h-48" />
        <div className="mb-skeleton h-56" />
      </div>
    )
  }

  const rows = [
    { label: 'Name', value: profile?.name },
    { label: 'Email', value: profile?.email },
    { label: 'Role', value: profile?.role, capitalize: true },
    { label: 'Member since', value: profile?.created_at && new Date(profile.created_at).toLocaleDateString() },
  ]

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="mb-eyebrow mb-2">Account</p>
        <h1 className="mb-display text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your account</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-xl font-bold text-ink-950 ring-2 ring-white/10">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
          <h2 className="mb-display text-xl font-semibold text-white">Profile Info</h2>
        </div>
        <dl className="divide-y divide-white/5 text-sm">
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-gray-500">{r.label}</dt>
              <dd className={`truncate font-medium text-white ${r.capitalize ? 'capitalize' : ''}`}>{r.value || '—'}</dd>
            </div>
          ))}
        </dl>
        <Link href="/profile" className="mb-btn-ghost mt-5 !py-2">Edit profile</Link>
      </section>

      <section className="rounded-2xl border border-crimson-500/30 bg-crimson-500/[0.06] p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-crimson-500/15 text-red-300">
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="mb-display text-lg font-semibold text-red-200">Delete Account</h2>
            <p className="mb-4 mt-1 text-sm text-red-300/80">
              This will schedule your account for deletion in 7 days. Type &quot;DELETE MY ACCOUNT&quot; to confirm.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="mb-input mb-3 max-w-sm !border-crimson-500/40 focus:!border-crimson-500 focus:!ring-crimson-500/20"
            />
            <button onClick={requestDeletion} disabled={deleting || confirmText !== 'DELETE MY ACCOUNT'} className="mb-btn-danger">
              {deleting && <Loader2 size={16} className="animate-spin" />}
              Schedule Deletion
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}