// components/ReportButton.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag } from 'lucide-react'

interface Props {
  postId: string
  userId?: string
  isAuthenticated: boolean
}

export function ReportButton({ postId, userId, isAuthenticated }: Props) {
  const [isReported, setIsReported] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return
    const check = async () => {
      const { data } = await supabase
        .from('reports')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle()
      setIsReported(!!data)
    }
    check()
  }, [postId, userId, supabase])

  const handleReport = async () => {
    if (!isAuthenticated || !userId) return
    
    if (isReported) {
      alert('You have already reported this post. Our team is reviewing it.')
      return
    }

    const reason = prompt('Why are you reporting this post? (Spam, Harassment, Inappropriate, etc.)')
    if (!reason) return

    setLoading(true)
    try {
      await supabase.from('reports').insert({
        post_id: postId,
        user_id: userId,
        reason: reason,
        status: 'pending'
      })
      setIsReported(true)
      alert('Thank you. Your report has been submitted to the moderators.')
    } catch (error) {
      console.error(error)
      alert('Failed to submit report.')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <button
      onClick={handleReport}
      disabled={loading || isReported}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-sm ${
        isReported 
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 cursor-not-allowed' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      }`}
      title={isReported ? 'Reported' : 'Report this post'}
    >
      <Flag size={16} /> {isReported ? 'Reported' : 'Report'}
    </button>
  )
}