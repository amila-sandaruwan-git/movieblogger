// components/BookmarkButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bookmark } from 'lucide-react'
import { AuthRequiredModal } from './AuthRequiredModal'

export function BookmarkButton({ postId, userId }: { postId: string; userId?: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    supabase.from('bookmarks').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle()
      .then(({ data }) => setIsBookmarked(!!data))
  }, [postId, userId])

  const toggle = async () => {
    if (!userId) {
      setAuthModal(true)
      return
    }
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', userId)
      setIsBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: userId })
      setIsBookmarked(true)
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`p-2 rounded-lg transition ${isBookmarked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
      >
        <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
      </button>

      <AuthRequiredModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        title="Login required to bookmark"
        message="Create a free account or login to save reviews to your reading list."
      />
    </>
  )
}