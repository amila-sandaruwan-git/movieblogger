'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ban, CheckCircle, Search } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const toggleBan = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return
    await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', id)
    fetchUsers()
  }

  const changeRole = async (id: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    fetchUsers()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-skeleton h-10 w-64" />
        <div className="mb-skeleton h-12" />
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="mb-skeleton h-16" />)}
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = users.filter(u =>
    !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
  const bannedCount = users.filter(u => u.is_banned).length

  const roleStyle = (r: string) =>
    r === 'admin'
      ? 'border-gold-400/50 bg-gold-400/10 text-gold-300'
      : r === 'publisher'
        ? 'border-sky-400/40 bg-sky-400/10 text-sky-200'
        : 'border-white/10 bg-ink-900 text-gray-200'

  return (
    <div>
      <div className="mb-6">
        <p className="mb-eyebrow mb-2">People</p>
        <h1 className="mb-display text-3xl font-semibold text-white">User Management</h1>
        <p className="mt-1 text-sm text-gray-400">{users.length} users · {bannedCount} banned</p>
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="mb-input !pl-11" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wider text-gray-400">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-500">No users match your search.</td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="text-gray-300 transition hover:bg-white/[0.03]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 font-bold text-ink-950">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{user.name}</p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className={`mb-input !w-auto !rounded-lg !px-3 !py-1.5 text-sm ${roleStyle(user.role)}`}
                      >
                        <option value="user">User</option>
                        <option value="publisher">Publisher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson-500/10 px-2.5 py-1 text-xs font-medium text-red-300 ring-1 ring-crimson-500/30"><Ban size={13} /> Banned</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/30"><CheckCircle size={13} /> Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                          user.is_banned
                            ? 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'
                            : 'bg-crimson-500/10 text-red-300 hover:bg-crimson-500/20'
                        }`}
                      >
                        {user.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}