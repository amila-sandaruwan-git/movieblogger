// components/AuthorProfileModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Film, Users } from 'lucide-react'
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
  const supabase = createClient()

  useEffect(() => {
    if (!isOpen || !userId) return
    document.body.style.overflow = 'hidden'
    loadData()
    return () => { document.body.style.overflow = '' }
  }, [isOpen, userId])

  const loadData = async () => {
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
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          <button onClick={onClose} className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/80 text-white flex items-center justify-center">
            <X size={20} />
          </button>

          <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{profile?.name || 'User'}</h1>
          </div>

          <div className="px-6 pb-6 -mt-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-700 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600 dark:text-gray-300">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {currentUserId && currentUserId !== userId && (
              <div className="flex justify-center mt-4">
                <FollowButton targetUserId={userId} currentUserId={currentUserId} size="lg" />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{stats.posts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{stats.followers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold dark:text-white">{stats.following}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
              </div>
            </div>

            <div className="flex justify-center border-t border-gray-200 dark:border-gray-700 mt-6">
              <button onClick={() => setTab('about')}
                className={`px-6 py-3 font-medium ${tab === 'about' ? 'border-b-2 border-black dark:border-white dark:text-white' : 'text-gray-500'}`}>
                About
              </button>
              <button onClick={() => setTab('posts')}
                className={`px-6 py-3 font-medium ${tab === 'posts' ? 'border-b-2 border-black dark:border-white dark:text-white' : 'text-gray-500'}`}>
                Movie Reviews
              </button>
            </div>

            <div className="mt-6">
              {tab === 'about' && (
                <div className="text-center max-w-2xl mx-auto">
                  {profile?.bio ? (
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No bio available</p>
                  )}
                </div>
              )}
              {tab === 'posts' && (
                posts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {posts.map(p => (
                      <Link key={p.id} href={`/post/${p.id}`} onClick={onClose}
                        className="group block rounded-xl overflow-hidden border dark:border-gray-700">
                        <div className="aspect-[2/3] relative bg-gray-100 dark:bg-gray-800">
                          {p.movie_poster_url ? (
                            <img src={p.movie_poster_url} alt={p.movie_title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Film size={32} className="text-gray-400" /></div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium dark:text-white line-clamp-2 text-sm">{p.movie_title}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(p.published_at).toLocaleDateString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
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