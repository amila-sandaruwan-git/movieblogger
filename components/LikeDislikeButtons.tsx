// components/LikeDislikeButtons.tsx - ENHANCED with better real-time updates
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LikeDislikeButtonsProps {
  postId: string
  userId?: string
  onReactionChange?: (likes: number, dislikes: number) => void // Callback for parent component
}

export function LikeDislikeButtons({ postId, userId, onReactionChange }: LikeDislikeButtonsProps) {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Fetch initial data
  const fetchReactions = useCallback(async () => {
    if (!postId) return
    
    try {
      console.log('Fetching reactions for post:', postId)
      
      // Get counts
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId)
      
      if (error) {
        console.error('Error fetching reactions:', error)
        return
      }
      
      if (reactions) {
        const likeCount = reactions.filter(r => r.reaction_type === 'like').length
        const dislikeCount = reactions.filter(r => r.reaction_type === 'dislike').length
        
        console.log('Fetched counts:', { likeCount, dislikeCount })
        
        setLikes(likeCount)
        setDislikes(dislikeCount)
        
        // Notify parent component
        if (onReactionChange) {
          onReactionChange(likeCount, dislikeCount)
        }
        
        // Get user's reaction if logged in
        if (userId) {
          const userReaction = reactions.find(r => r.user_id === userId)
          setUserReaction(userReaction?.reaction_type || null)
        }
      }
    } catch (error) {
      console.error('Error in fetchReactions:', error)
    }
  }, [postId, userId, onReactionChange, supabase])

  // Set up real-time subscription
  useEffect(() => {
    if (!postId || isSubscribed) return

    console.log('Setting up real-time subscription for post:', postId)
    
    // Fetch initial data
    fetchReactions()

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`
        },
        async (payload) => {
          console.log('Real-time reaction change detected:', payload)
          
          // Refetch all reactions to get accurate counts
          await fetchReactions()
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
        }
      })

    // Cleanup subscription
    return () => {
      console.log('Cleaning up subscription for post:', postId)
      supabase.removeChannel(channel)
      setIsSubscribed(false)
    }
  }, [postId, supabase, fetchReactions, isSubscribed])

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!userId) {
      // Redirect to login
      const currentPath = window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    setIsLoading(true)
    console.log('Handling reaction:', { reactionType, userId, postId })

    try {
      // Check if user already has a reaction
      const { data: existingReaction, error: checkError } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing reaction:', checkError)
        throw checkError
      }

      let result
      
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          // Remove reaction
          console.log('Removing reaction')
          result = await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
        } else {
          // Update reaction
          console.log('Updating reaction from', existingReaction.reaction_type, 'to', reactionType)
          result = await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('post_id', postId)
            .eq('user_id', userId)
        }
      } else {
        // Add new reaction
        console.log('Adding new reaction')
        result = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType
          })
      }

      if (result.error) {
        console.error('Error in reaction operation:', result.error)
        throw result.error
      }

      console.log('Reaction operation successful')
      
      // The real-time subscription will trigger fetchReactions automatically
      // But we can also update locally for immediate feedback
      setUserReaction(
        existingReaction?.reaction_type === reactionType ? null : reactionType
      )

    } catch (error) {
      console.error('Error updating reaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleReaction('like')}
        disabled={isLoading}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
          userReaction === 'like'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label="Like"
      >
        <ThumbsUp size={16} className={userReaction === 'like' ? 'fill-current' : ''} />
        <span className="text-sm font-medium">{likes}</span>
      </button>
      
      <button
        onClick={() => handleReaction('dislike')}
        disabled={isLoading}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
          userReaction === 'dislike'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
        aria-label="Dislike"
      >
        <ThumbsDown size={16} className={userReaction === 'dislike' ? 'fill-current' : ''} />
        <span className="text-sm font-medium">{dislikes}</span>
      </button>
    </div>
  )
}