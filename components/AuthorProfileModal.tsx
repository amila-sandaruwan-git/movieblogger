'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Film, Users, Facebook, Instagram, Twitter, Linkedin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { FollowButton } from '@/components/FollowButton'

interface Props {
  userId: string
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export function AuthorProfileModal({ userId, isOpen, onClose, currentUserId }: Props) {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [tab, setTab] = useState<'about' | 'posts'>('about')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen || !userId) return
    document.body.style.overflow = 'hidden'
    setTab('about')
    loadData()

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, userId])

  const loadData = async () => {
    setLoading(true)
    setProfile(null)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(p)
    const { data: ps } = await supabase.from('posts').select('id, movie_title, movie_poster_url, published_at').eq('user_id', userId).eq('status', 'published').order('published_at', { ascending: false }).limit(12)
    setPosts(ps || [])
    const [pl, fol, fing] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    setStats({ posts: pl.count || 0, followers: fol.count || 0, following: fing.count || 0 })
    setLoading(false)
  }

  if (!isOpen) return null

  const socials = [
    { key: 'facebook_url', label: 'Facebook', Icon: Facebook },
    { key: 'instagram_url', label: 'Instagram', Icon: Instagram },
    { key: 'twitter_url', label: 'Twitter', Icon: Twitter },
    { key: 'linkedin_url', label: 'LinkedIn', Icon: Linkedin },
  ].filter(s => profile?.[s.key])

  const statItems = [
    { label: 'Posts', value: stats.posts },
    { label: 'Followers', value: stats.followers },
    { label: 'Following', value: stats.following },
  ]

  return (
    <>
      <div className="animate-fade-up fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${profile?.name || 'Author'} profile`}
          className="animate-fade-up mb-scroll pointer-events-auto relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/70"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-gold-400 hover:text-ink-950"
          >
            <X size={20} />
          </button>

          {/* ---------- Banner ---------- */}
          <div className="relative h-40 overflow-hidden bg-ink-800 sm:h-48">
            {profile?.banner_url ? (
              <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-ink-700 via-ink-800 to-gold-600/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
          </div>

          <div className="-mt-14 px-5 pb-8 sm:px-8">
            {/* ---------- Identity ---------- */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-ink-900 bg-ink-700 shadow-xl ring-2 ring-gold-400/40">
                {loading ? (
                  <div className="mb-skeleton h-full w-full !rounded-full" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="mb-display text-4xl font-semibold text-gold-400">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="mb-skeleton mt-4 h-8 w-48" />
              ) : (
                <h2 className="mb-display mt-4 text-3xl font-semibold text-white">{profile?.name || 'User'}</h2>
              )}

              {profile?.role && profile.role !== 'user' && (
                <span className="mt-2 rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-0.5 text-xs font-semibold capitalize text-gold-300">
                  {profile.role}
                </span>
              )}

              {socials.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {socials.map(({ key, label, Icon }) => (
                    <a
                      key={key}
                      href={profile[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-400 transition hover:border-gold-400/50 hover:text-gold-300"
                    >
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              )}

              {currentUserId && currentUserId !== userId && (
                <div className="mt-5">
                  <FollowButton targetUserId={userId} currentUserId={currentUserId} size="lg" />
                </div>
              )}
            </div>

            {/* ---------- Stats ---------- */}
            <div className="mx-auto mt-7 grid max-w-md grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] py-4">
              {statItems.map(s => (
                <div key={s.label} className="text-center">
                  <div className="mb-display text-2xl font-semibold text-gold-400">{s.value}</div>
                  <div className="text-xs uppercase tracking-widest text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ---------- Tabs ---------- */}
            <div role="tablist" className="mt-8 flex justify-center border-b border-white/10">
              {([
                { id: 'about', label: 'About' },
                { id: 'posts', label: 'Movie Reviews' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-6 py-3 text-sm font-semibold transition ${
                    tab === t.id
                      ? 'border-gold-400 text-gold-300'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-7">
              {tab === 'about' && (
                <div className="mx-auto max-w-2xl text-center">
                  {profile?.bio ? (
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{profile.bio}</p>
                  ) : (
                    <p className="italic text-gray-500">No bio available</p>
                  )}
                  {profile?.created_at && (
                    <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} /> Member since {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {tab === 'posts' && (
                posts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {posts.map(p => (
                      <Link
                        key={p.id}
                        href={`/post/${p.id}`}
                        onClick={onClose}
                        className="group block overflow-hidden rounded-lg border border-white/10 bg-ink-800/60 transition hover:-translate-y-1 hover:border-gold-400/40"
                      >
                        <div className="relative aspect-[2/3] bg-ink-700">
                          {p.movie_poster_url ? (
                            <img src={p.movie_poster_url} alt={p.movie_title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><Film size={22} className="text-ink-500" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-1 text-xs font-medium text-white transition group-hover:text-gold-300">{p.movie_title}</p>
                          <p className="mt-0.5 text-[10px] text-gray-500">{new Date(p.published_at).toLocaleDateString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Users size={44} className="mx-auto mb-3 text-gray-700" />
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}