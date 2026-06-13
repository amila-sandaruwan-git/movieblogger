// components/PostClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { Heart, Bookmark, Flag, MessageCircle, Send, MoreVertical, Edit, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  is_edited: boolean
  user: {
    name: string
    avatar_url: string | null
  }
}

interface PostClientProps {
  postId: string
  initialLikeCount: number
  initialDislikeCount: number
  initialBookmarkCount: number
  initialUserReaction: 'like' | 'dislike' | null
  initialIsBookmarked: boolean
  initialUserReported: boolean
  commentsEnabled: boolean
  userId?: string
}

export default function PostClient({
  postId,
  initialLikeCount,
  initialDislikeCount,
  initialBookmarkCount,
  initialUserReaction,
  initialIsBookmarked,
  initialUserReported,
  commentsEnabled,
  userId
}: PostClientProps) {
  const supabase = createClient()
  
  // State management
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount)
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount)
  const [userReaction, setUserReaction] = useState(initialUserReaction)
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [userReported, setUserReported] = useState(initialUserReported)
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportType, setReportType] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  // Fetch comments on mount
  useEffect(() => {
    if (commentsEnabled) {
      fetchComments()
    }
  }, [commentsEnabled])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setComments(data as Comment[])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!userId) {
      // Redirect to login or show login modal
      return
    }

    try {
      const currentReaction = userReaction
      let newLikeCount = likeCount
      let newDislikeCount = dislikeCount

      // Remove existing reaction if exists
      if (currentReaction) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        // Decrement counts
        if (currentReaction === 'like') {
          newLikeCount = Math.max(0, likeCount - 1)
        } else {
          newDislikeCount = Math.max(0, dislikeCount - 1)
        }
      }

      // If clicking same reaction, just remove it
      if (currentReaction === type) {
        setUserReaction(null)
        setLikeCount(newLikeCount)
        setDislikeCount(newDislikeCount)
        
        // Update post counts
        await supabase
          .from('posts')
          .update({
            like_count: newLikeCount,
            dislike_count: newDislikeCount
          })
          .eq('id', postId)
        return
      }

      // Add new reaction
      await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: type
        })

      // Update counts
      if (type === 'like') {
        newLikeCount = newLikeCount + 1
      } else {
        newDislikeCount = newDislikeCount + 1
      }

      setUserReaction(type)
      setLikeCount(newLikeCount)
      setDislikeCount(newDislikeCount)

      // Update post counts
      await supabase
        .from('posts')
        .update({
          like_count: newLikeCount,
          dislike_count: newDislikeCount
        })
        .eq('id', postId)

    } catch (error) {
      console.error('Error updating reaction:', error)
    }
  }

  const handleBookmark = async () => {
    if (!userId) return

    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        setBookmarkCount(prev => Math.max(0, prev - 1))
        setIsBookmarked(false)
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: userId
          })

        setBookmarkCount(prev => prev + 1)
        setIsBookmarked(true)
      }

      // Update post bookmark count
      await supabase
        .from('posts')
        .update({
          bookmark_count: bookmarkCount + (isBookmarked ? -1 : 1)
        })
        .eq('id', postId)

    } catch (error) {
      console.error('Error updating bookmark:', error)
    }
  }

  const handleReport = async () => {
    if (!userId) return

    try {
      if (userReported) {
        // Remove report (if allowed)
        await supabase
          .from('reports')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)

        setUserReported(false)
      } else {
        // Submit report
        await supabase
          .from('reports')
          .insert({
            post_id: postId,
            user_id: userId,
            report_type: reportType || 'other',
            description: reportDescription,
            status: 'pending'
          })

        setUserReported(true)
        setShowReportModal(false)
        setReportType('')
        setReportDescription('')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
    }
  }

  const handleComment = async () => {
    if (!userId || !newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: newComment.trim()
        })

      if (!error) {
        setNewComment('')
        fetchComments()
        
        // Update comment count
        await supabase
          .from('posts')
          .update({
            comment_count: (comments.length + 1)
          })
          .eq('id', postId)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const reportTypes = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'harassment', label: 'Harassment or hate speech' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'copyright', label: 'Copyright infringement' },
    { value: 'privacy', label: 'Privacy violation' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <>
      {/* Interactive Actions Bar */}
      <div className="sticky bottom-6 left-0 right-0 z-40">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Like Button */}
                <button
                  onClick={() => handleReaction('like')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    userReaction === 'like'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ThumbsUp size={20} />
                  <span className="font-semibold">{likeCount}</span>
                </button>

                {/* Dislike Button */}
                <button
                  onClick={() => handleReaction('dislike')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    userReaction === 'dislike'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <ThumbsDown size={20} />
                  <span className="font-semibold">{dislikeCount}</span>
                </button>

                {/* Comment Button */}
                {commentsEnabled && (
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MessageCircle size={20} />
                    <span className="font-semibold">{comments.length}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Bookmark Button */}
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg transition-all ${
                    isBookmarked
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>

                {/* Share Button */}
                <button
                  onClick={sharePost}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                {/* Report Button */}
                <button
                  onClick={() => userId ? setShowReportModal(true) : null}
                  className={`p-2 rounded-lg transition-all ${
                    userReported
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Flag size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {commentsEnabled && (
        <div className="mt-8">
          {/* Add Comment */}
          {userId && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500"></div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts on this review..."
                    className="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleComment}
                      disabled={!newComment.trim() || loading}
                      className="px-6 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {comment.user.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {comment.user.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold dark:text-white">{comment.user.name}</h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString()}
                          {comment.is_edited && ' (edited)'}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                  {userId === comment.user_id && (
                    <div className="relative group">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <MoreVertical size={20} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl hidden group-hover:block">
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                          <Edit size={16} />
                          <span>Edit</span>
                        </button>
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center space-x-2">
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Report this post</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Reason for reporting</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a reason</option>
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Additional details (optional)</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide more information..."
                  className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportType}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}