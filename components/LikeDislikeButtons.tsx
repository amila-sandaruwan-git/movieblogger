// components/LikeDislikeButtons.tsx


'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { AuthRequiredModal } from './AuthRequiredModal'

interface Props {
  postId: string
  userId?: string
  onChange?: (likes: number, dislikes: number) => void
}

export function LikeDislikeButtons({ postId, userId, onChange }: Props) {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [loading, setLoading] = useState(false)
  const [authModal, setAuthModal] = useState<'like' | 'dislike' | null>(null)
  const supabase = createClient()

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from('post_reactions')
      .select('reaction_type, user_id')
      .eq('post_id', postId)

    if (data) {
      const likeCount = data.filter((r) => r.reaction_type === 'like').length
      const dislikeCount = data.filter(
        (r) => r.reaction_type === 'dislike'
      ).length
      setLikes(likeCount)
      setDislikes(dislikeCount)
      onChange?.(likeCount, dislikeCount)

      if (userId) {
        const mine = data.find((r) => r.user_id === userId)
        setUserReaction(
          (mine?.reaction_type as 'like' | 'dislike' | undefined) || null
        )
      }
    }
  }, [postId, userId, onChange, supabase])

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`post-reactions-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchReactions()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase, fetchReactions])

  const handle = async (type: 'like' | 'dislike') => {
    if (!userId) {
      setAuthModal(type)
      return
    }
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        if (existing.reaction_type === type) {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
        } else {
          await supabase
            .from('post_reactions')
            .update({ reaction_type: type })
            .eq('post_id', postId)
            .eq('user_id', userId)
        }
      } else {
        await supabase.from('post_reactions').insert({
          post_id: postId,
          user_id: userId,
          reaction_type: type,
        })
      }
      // Optimistic local update — realtime will also fire and re-sync
      await fetchReactions()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handle('like')}
          disabled={loading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
            userReaction === 'like'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <ThumbsUp size={16} />
          <span className="text-sm">{likes}</span>
        </button>
        <button
          onClick={() => handle('dislike')}
          disabled={loading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
            userReaction === 'dislike'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <ThumbsDown size={16} />
          <span className="text-sm">{dislikes}</span>
        </button>
      </div>

      <AuthRequiredModal
        isOpen={!!authModal}
        onClose={() => setAuthModal(null)}
        title={
          authModal === 'dislike'
            ? 'Login required to dislike'
            : 'Login required to like'
        }
        message="Create a free account or login to react to this review."
      />
    </>
  )
}