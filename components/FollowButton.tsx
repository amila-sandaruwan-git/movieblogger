// components/FollowButton.tsx - FULLY UPDATED
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Check, Loader2 } from 'lucide-react'
import { notificationHelpers } from '@/lib/notifications'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
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
  onFollowChange 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (currentUserId && targetUserId) {
      checkFollowStatus()
      fetchFollowerCount()
    } else {
      fetchFollowerCount()
      setIsChecking(false)
    }
  }, [currentUserId, targetUserId])

  useEffect(() => {
    if (!targetUserId) return

    const channel = supabase
      .channel(`follows-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${targetUserId}`
        },
        () => {
          fetchFollowerCount()
          if (currentUserId) {
            checkFollowStatus()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [targetUserId, currentUserId])

  const checkFollowStatus = async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setIsFollowing(false)
      setIsChecking(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (error) {
        console.error('Error checking follow status:', error)
        setIsFollowing(false)
      } else {
        setIsFollowing(!!data)
      }
    } catch (error) {
      console.error('Error checking follow status:', error)
      setIsFollowing(false)
    } finally {
      setIsChecking(false)
    }
  }

  const fetchFollowerCount = async () => {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId)

      if (error) {
        console.error('Error fetching follower count:', error)
        setFollowerCount(0)
      } else {
        setFollowerCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching follower count:', error)
      setFollowerCount(0)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId) {
      const currentPath = window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    if (currentUserId === targetUserId) {
      console.log('Cannot follow yourself')
      return
    }

    setIsLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)

        if (error) {
          console.error('Error unfollowing:', error)
          throw error
        }
        
        setIsFollowing(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
        onFollowChange?.(false)
        
        console.log(`✅ Unfollowed user ${targetUserId}`)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          })

        if (error) {
          console.error('Error following:', error)
          throw error
        }
        
        setIsFollowing(true)
        setFollowerCount(prev => prev + 1)
        onFollowChange?.(true)

        console.log(`✅ Followed user ${targetUserId}`)

        // Send notification to the user being followed
        try {
          console.log('📨 Sending follow notification:', {
            followerId: currentUserId,
            followingId: targetUserId,
            followerName: targetUserName
          })
          
          const result = await notificationHelpers.newFollower(
            currentUserId,
            targetUserId
          )
          
          if (result.success) {
            console.log('✅ Follow notification sent successfully')
          } else {
            console.warn('⚠️ Follow notification not sent:', result.reason)
          }
        } catch (notifError: any) {
          console.error('❌ Failed to send follow notification:', notifError.message)
        }
      }
    } catch (error: any) {
      console.error('Error updating follow status:', error)
      alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: {
      button: 'px-3 py-1.5 text-sm',
      icon: 'w-3 h-3'
    },
    md: {
      button: 'px-4 py-2 text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      button: 'px-6 py-2.5 text-base',
      icon: 'w-5 h-5'
    }
  }

  if (currentUserId === targetUserId) {
    return null
  }

  if (!currentUserId) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => {
            const currentPath = window.location.pathname
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
          }}
          className={`flex items-center gap-2 font-medium rounded-lg transition-all duration-200 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-300 ${sizeClasses[size].button}`}
        >
          <Users className={sizeClasses[size].icon} />
          <span>Follow</span>
        </button>

        {showCount && followerCount > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {followerCount.toLocaleString()} follower{followerCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleFollow}
        disabled={isLoading || isChecking}
        className={`flex items-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isFollowing
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-300'
        } ${sizeClasses[size].button}`}
      >
        {isLoading ? (
          <Loader2 className={`${sizeClasses[size].icon} animate-spin`} />
        ) : isChecking ? (
          <div className={`${sizeClasses[size].icon} animate-pulse bg-current rounded-full`} />
        ) : isFollowing ? (
          <>
            <Check className={sizeClasses[size].icon} />
            <span>Following</span>
          </>
        ) : (
          <>
            <Users className={sizeClasses[size].icon} />
            <span>Follow</span>
          </>
        )}
      </button>

      {showCount && followerCount > 0 && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {followerCount.toLocaleString()} follower{followerCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}