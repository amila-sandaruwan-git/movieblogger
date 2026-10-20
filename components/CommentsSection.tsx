'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageCircle, Reply, Trash2, Award, Loader2 } from 'lucide-react'
import { notificationHelpers } from '@/lib/notifications'
import { AuthRequiredModal } from './AuthRequiredModal'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  is_edited: boolean
  is_post_author: boolean
  user_profile: { name: string; avatar_url: string | null }
}

interface Props {
  postId: string
  userId?: string
  isAuthenticated: boolean
  postAuthorId: string
  postAuthorName?: string
  postTitle?: string
  onCommentChange?: (total: number) => void
  highlightedCommentId?: string | null
}

export function CommentsSection({
  postId,
  userId,
  isAuthenticated,
  postAuthorId,
  onCommentChange,
  highlightedCommentId,
}: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState(false)
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null)
  
  const supabase = createClient()
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('comment_details')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (data) {
      setComments(data as Comment[])
      onCommentChange?.(data.length)
    }
    setLoading(false)
  }, [postId, supabase, onCommentChange])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Real-time: any insert/update/delete refetches
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase, fetchComments])

  // Handle scrolling and highlighting when a comment is clicked from a notification
  useEffect(() => {
    if (loading || !highlightedCommentId) return

    // 1. Find the comment
    const targetComment = comments.find((c) => c.id.toString() === highlightedCommentId.toString())
    if (!targetComment) return

    // 2. If it's a reply, expand its parent thread
    if (targetComment.parent_id) {
      setReplyTo(null) // Just ensure no reply form is open
    }

    // 3. Scroll to the comment after a short delay (to let the DOM render)
    setTimeout(() => {
      const element = commentRefs.current[highlightedCommentId]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // 4. Add the highlight effect
        setActiveHighlight(highlightedCommentId)
        setTimeout(() => setActiveHighlight(null), 3000) // Remove highlight after 3 seconds
      }
    }, 500)
  }, [loading, comments, highlightedCommentId])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      setAuthModal(true)
      return
    }
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: newComment.trim(),
          parent_id: null,
        })
        .select()
        .single()

      if (error) throw error

      const optimistic: Comment = {
        id: data.id,
        content: newComment.trim(),
        created_at: data.created_at,
        user_id: userId,
        parent_id: null,
        is_edited: false,
        is_post_author: false,
        user_profile: { name: 'You', avatar_url: null },
      }

      let nextCount = comments.length
      setComments((prev) => {
        if (prev.some((c) => c.id === optimistic.id)) {
          nextCount = prev.length
          return prev
        }
        nextCount = prev.length + 1
        return [...prev, optimistic]
      })

      if (nextCount !== comments.length) {
        onCommentChange?.(nextCount)
      }

      try {
        await notificationHelpers.newComment(postId, userId, data.id, newComment.trim())
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr)
      }

      setNewComment('')
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async (parentId: string) => {
    if (!userId) {
      setAuthModal(true)
      return
    }
    if (!replyContent.trim()) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: replyContent.trim(),
          parent_id: parentId,
        })
        .select()
        .single()

      if (error) throw error

      const optimistic: Comment = {
        id: data.id,
        content: replyContent.trim(),
        created_at: data.created_at,
        user_id: userId,
        parent_id: parentId,
        is_edited: false,
        is_post_author: false,
        user_profile: { name: 'You', avatar_url: null },
      }

      let nextCount = comments.length
      setComments((prev) => {
        if (prev.some((c) => c.id === optimistic.id)) {
          nextCount = prev.length
          return prev
        }
        nextCount = prev.length + 1
        return [...prev, optimistic]
      })

      if (nextCount !== comments.length) {
        onCommentChange?.(nextCount)
      }

      try {
        await notificationHelpers.newReply(postId, userId, parentId, data.id, replyContent.trim())
      } catch (notifErr) {
        console.warn('Notification failed:', notifErr)
      }

      setReplyContent('')
      setReplyTo(null)
    } catch (err) {
      console.error('Failed to post reply:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return

    const removedCount = comments.filter((c) => c.id === id || c.parent_id === id).length
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete comment:', error)
      return
    }

    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id))
    onCommentChange?.(Math.max(0, comments.length - removedCount))
  }

  const startReply = (id: string) => {
    if (!userId) {
      setAuthModal(true)
      return
    }
    setReplyTo(replyTo === id ? null : id)
  }

  const roots = comments.filter((c) => !c.parent_id)
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id)

  const commentDisabled = submitting || !userId || !newComment.trim()
  const replyDisabled = submitting || !userId || !replyContent.trim()

  return (
    <section className="mb-surface p-5 sm:p-8" id="comments-section">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
        <h3 className="mb-display flex items-center gap-2.5 text-xl font-semibold text-white">
          <MessageCircle size={20} className="text-gold-400" />
          Discussion
          <span className="rounded-full bg-gold-400/15 px-2.5 py-0.5 text-sm font-semibold text-gold-300">{comments.length}</span>
        </h3>
      </div>

      <form onSubmit={submitComment} className="border-b border-white/10 py-5">
        <textarea
          value={newComment}
          onChange={(e) => {
            if (!userId) {
              setAuthModal(true)
              return
            }
            setNewComment(e.target.value)
          }}
          onFocus={() => {
            if (!userId) setAuthModal(true)
          }}
          placeholder={userId ? 'Share your thoughts on this review...' : 'Login to comment...'}
          rows={3}
          readOnly={!userId}
          className="mb-input resize-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{userId ? 'Be kind and keep it about the film.' : 'You need an account to join in.'}</p>
          <button type="submit" disabled={commentDisabled} className="mb-btn-primary !py-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Post
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-5 py-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="mb-skeleton h-10 w-10 shrink-0 !rounded-full" />
              <div className="mb-skeleton h-16 flex-1" />
            </div>
          ))}
        </div>
      ) : roots.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-600">
            <MessageCircle size={24} />
          </span>
          <p className="text-gray-300">No comments yet</p>
          <p className="mt-1 text-sm text-gray-500">Be the first to start the conversation.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {roots.map((comment) => (
            <div
              key={comment.id}
              ref={(el) => { commentRefs.current[comment.id] = el; }}
            >
              <div className={`-m-3 rounded-xl p-3 transition-colors duration-500 ${
                activeHighlight === comment.id ? 'bg-gold-400/10 ring-1 ring-gold-400/40' : ''
              }`}>
                <CommentRow
                  comment={comment}
                  userId={userId}
                  postAuthorId={postAuthorId}
                  onReply={() => startReply(comment.id)}
                  onDelete={deleteComment}
                />
              </div>

              {replyTo === comment.id && userId && (
                <div className="ml-[3.25rem] mt-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    autoFocus
                    className="mb-input resize-none !py-2.5"
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => submitReply(comment.id)} disabled={replyDisabled} className="mb-btn-primary !px-4 !py-1.5 !text-xs">
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo(null)
                        setReplyContent('')
                      }}
                      className="mb-btn-ghost !px-4 !py-1.5 !text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {repliesOf(comment.id).map((reply) => (
                <div
                  key={reply.id}
                  className="ml-[3.25rem] mt-4 border-l border-white/10 pl-4"
                  ref={(el) => { commentRefs.current[reply.id] = el; }}
                >
                  <div className={`-m-3 rounded-xl p-3 transition-colors duration-500 ${
                    activeHighlight === reply.id ? 'bg-gold-400/10 ring-1 ring-gold-400/40' : ''
                  }`}>
                    <CommentRow
                      comment={reply}
                      userId={userId}
                      postAuthorId={postAuthorId}
                      onReply={() => startReply(comment.id)}
                      onDelete={deleteComment}
                      isReply
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <AuthRequiredModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        title="Login required to comment"
        message="Create a free account or login to join the discussion."
      />
    </section>
  )
}

function CommentRow({
  comment,
  userId,
  postAuthorId,
  onReply,
  onDelete,
  isReply = false,
}: {
  comment: Comment
  userId?: string
  postAuthorId: string
  onReply: () => void
  onDelete: (id: string) => void
  isReply?: boolean
}) {
  const isOwner = userId === comment.user_id
  const isPostAuthor = comment.user_id === postAuthorId

  return (
    <div className="flex gap-3">
      <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 font-semibold text-ink-950 ring-2 ring-white/10 ${isReply ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'}`}>
        {comment.user_profile?.avatar_url ? (
          <img
            src={comment.user_profile.avatar_url}
            alt={comment.user_profile.name}
            className="h-full w-full object-cover"
          />
        ) : (
          comment.user_profile?.name?.charAt(0).toUpperCase() || 'U'
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-semibold text-white">
            {comment.user_profile?.name || 'User'}
          </span>
          {isPostAuthor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2 py-0.5 text-[11px] font-semibold text-gold-300 ring-1 ring-gold-400/30">
              <Award size={10} /> Publisher
            </span>
          )}
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>

        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
          {comment.content}
        </p>

        <div className="mt-2.5 flex items-center gap-4">
          {!isReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-gold-400"
            >
              <Reply size={14} /> Reply
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-red-300"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}