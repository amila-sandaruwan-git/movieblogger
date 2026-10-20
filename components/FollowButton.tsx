// components/FollowButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { notificationHelpers } from '@/lib/notifications'
import { AuthRequiredModal } from './AuthRequiredModal'

interface Props {
  targetUserId: string
  targetUserName?: string
  currentUserId: string | undefined
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  targetUserId,
  targetUserName,
  currentUserId,
  size = 'md',
  showCount = false,
  className = '',
  onFollowChange,
}: Props) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [authModal, setAuthModal] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadStatus()
    loadCount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, targetUserId])

  const loadStatus = async () => {
    if (!currentUserId || currentUserId === targetUserId) return
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()
    setFollowing(!!data)
  }

  const loadCount = async () => {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId)
    setFollowerCount(count || 0)
  }

  if (currentUserId === targetUserId) return null

  const toggle = async () => {
    if (!currentUserId) {
      setAuthModal(true)
      return
    }
    setLoading(true)
    try {
      if (following) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        setFollowing(false)
        setFollowerCount((c) => Math.max(0, c - 1))
        onFollowChange?.(false)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId })
        
        if (error) throw error

        setFollowing(true)
        setFollowerCount((c) => c + 1)
        onFollowChange?.(true)

        // Send notification to the person being followed
        await notificationHelpers.newFollower(currentUserId, targetUserId)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={toggle}
          disabled={loading}
          className={`flex items-center gap-2 font-medium rounded-lg transition disabled:opacity-50 ${
            following
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-black text-white dark:bg-white dark:text-black'
          } ${sizeClasses[size]}`}
        >
          {following ? (
            <>
              <Check size={14} /> Following
            </>
          ) : (
            <>
              <Users size={14} /> Follow
            </>
          )}
        </button>
        {showCount && followerCount > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {followerCount.toLocaleString()}
          </span>
        )}
      </div>

      <AuthRequiredModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        title="Login required to follow"
        message={
          targetUserName
            ? `Create a free account or login to follow ${targetUserName}.`
            : 'Create a free account or login to follow this author.'
        }
      />
    </>
  )
}