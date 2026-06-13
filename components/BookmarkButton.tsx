// components/BookmarkButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, BookmarkCheck } from 'lucide-react'

interface BookmarkButtonProps {
  postId: string
  userId?: string
}

export function BookmarkButton({ postId, userId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (userId) checkBookmarkStatus()
  }, [postId, userId])

  const checkBookmarkStatus = async () => {
    if (!userId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    setIsBookmarked(!!data)
  }

  const toggleBookmark = async () => {
    if (!userId) {
      // Show login prompt
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    try {
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
        setIsBookmarked(false)
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: userId
          })
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading || !userId}
      className={`p-2 rounded-lg transition-all ${
        isBookmarked
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      } ${!userId ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
    >
      {isBookmarked ? (
        <BookmarkCheck size={20} className="fill-current" />
      ) : (
        <Bookmark size={20} />
      )}
    </button>
  )
}