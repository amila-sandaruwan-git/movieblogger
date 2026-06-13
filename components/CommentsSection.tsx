// components/CommentsSection.tsx - Updated YouTube Threaded Style with Proper Reply Notifications
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Send, MessageCircle, User, Clock, Edit, Trash2, Reply, 
  ChevronDown, ChevronUp, MoreVertical, Award, LogIn, Pin, PinOff, Loader2
} from 'lucide-react'
import AuthorAvatar from '@/components/AuthorAvatar'
import { notificationHelpers } from '@/lib/notifications'
import Link from 'next/link'

interface CommentUser {
  id: string
  name: string
  avatar_url: string | null
  bio?: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  parent_id: string | null
  is_edited: boolean
  is_author_highlighted: boolean
  is_pinned: boolean
  pinned_at: string | null
  replies?: Comment[]
  user: CommentUser
  is_post_author?: boolean
}

interface CommentsSectionProps {
  postId: string
  userId?: string
  isAuthenticated: boolean
  postAuthorId: string
  postAuthorName?: string
  postTitle?: string
  highlightedCommentId?: string | null
  onCommentChange?: (total: number) => void
}

// Helper function to format comment content with proper line breaks
const formatCommentContent = (content: string) => {
  if (!content) return '';
  
  return content.split('\n').map((line, index, array) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '') {
      return <div key={index} className="h-2" />;
    }
    
    return (
      <div key={index} className="mb-1 last:mb-0">
        {trimmedLine}
        {index < array.length - 1 && array[index + 1]?.trim() !== '' && <br />}
      </div>
    );
  });
};

// Helper function to calculate total comments count
const calculateTotalComments = (commentsList: Comment[]): number => {
  return commentsList.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0)
  }, 0)
}

// Helper function to remove a comment from the tree recursively
const removeCommentFromTree = (commentsList: Comment[], commentIdToRemove: string): Comment[] => {
  return commentsList.filter(comment => {
    if (comment.id === commentIdToRemove) {
      return false
    }
    if (comment.replies && comment.replies.length > 0) {
      comment.replies = removeCommentFromTree(comment.replies, commentIdToRemove)
    }
    return true
  })
}

export function CommentsSection({ 
  postId, 
  userId, 
  isAuthenticated, 
  postAuthorId,
  postAuthorName,
  postTitle,
  highlightedCommentId,
  onCommentChange
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentMap, setCommentMap] = useState<Map<string, Comment>>(new Map())
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserProfile, setCurrentUserProfile] = useState<CommentUser | null>(null)
  const [highlightedComment, setHighlightedComment] = useState<string | null>(highlightedCommentId || null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const highlightedCommentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const replyInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  
  const supabase = useMemo(() => createClient(), [])

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current.get(openMenuId)
        const buttonElement = document.getElementById(`menu-btn-${openMenuId}`)
        
        if (menuElement && !menuElement.contains(event.target as Node) && 
            buttonElement && !buttonElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  // Effect to handle highlighted comment
  useEffect(() => {
    if (highlightedCommentId) {
      setHighlightedComment(highlightedCommentId)
      
      const comment = commentMap.get(highlightedCommentId)
      if (comment?.parent_id) {
        setExpandedReplies(prev => new Set(prev).add(comment.parent_id!))
      }
      
      setTimeout(() => {
        const element = highlightedCommentRefs.current.get(highlightedCommentId)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          })
          
          element.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-l-4', 'border-yellow-500')
          
          setTimeout(() => {
            element.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20', 'border-l-4', 'border-yellow-500')
            setHighlightedComment(null)
          }, 5000)
        }
      }, 1000)
    }
  }, [highlightedCommentId, commentMap])

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    const diffWeek = Math.floor(diffDay / 7)
    
    if (diffWeek > 0) {
      return diffWeek === 1 ? '1 week ago' : `${diffWeek} weeks ago`
    }
    if (diffDay > 0) {
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
    }
    if (diffHour > 0) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`
    }
    if (diffMin > 0) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`
    }
    return 'Just now'
  }, [])

  // Get current user profile
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      if (!userId) return
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, bio')
          .eq('id', userId)
          .single()
        
        if (error) {
          console.error('Error fetching user profile:', error)
          return
        }
        
        if (profile) {
          setCurrentUserProfile({
            id: profile.id,
            name: profile.name || 'User',
            avatar_url: profile.avatar_url,
            bio: profile.bio
          })
        }
      } catch (error) {
        console.error('Error in fetchCurrentUserProfile:', error)
      }
    }
    
    if (isAuthenticated) {
      fetchCurrentUserProfile()
    }
  }, [userId, isAuthenticated, supabase])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comment_details')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.error('Supabase comments error:', commentsError)
        throw commentsError
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([])
        setCommentMap(new Map())
        setIsLoading(false)
        if (onCommentChange) {
          onCommentChange(0)
        }
        return
      }

      const transformedComments: Comment[] = commentsData.map(item => ({
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_id: item.user_id,
        parent_id: item.parent_id,
        is_edited: item.is_edited,
        is_author_highlighted: item.is_post_author,
        is_pinned: item.is_pinned || false,
        pinned_at: item.pinned_at,
        user: item.user_profile,
        replies: []
      }))

      const commentTree = new Map<string, Comment>()
      const rootComments: Comment[] = []
      
      transformedComments.forEach(comment => {
        commentTree.set(comment.id, comment)
        
        if (comment.parent_id) {
          const parent = commentTree.get(comment.parent_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(comment)
          }
        } else {
          rootComments.push(comment)
        }
      })
      
      commentTree.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }
      })
      
      rootComments.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        if (a.is_pinned && b.is_pinned) {
          return new Date(b.pinned_at || 0).getTime() - new Date(a.pinned_at || 0).getTime()
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      setComments(rootComments)
      setCommentMap(commentTree)
      
      if (onCommentChange) {
        const total = calculateTotalComments(rootComments)
        onCommentChange(total)
      }
      
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, supabase, onCommentChange])

  // Initial fetch
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // Real-time subscription for comments (INSERT, UPDATE, DELETE)
  useEffect(() => {
    console.log('Setting up real-time subscription for comments...')
    
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time comment INSERT detected:', payload)
          fetchComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time comment UPDATE detected:', payload)
          fetchComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Real-time comment DELETE detected:', payload)
          const deletedCommentId = payload.old.id
          
          setComments(prevComments => {
            const newComments = removeCommentFromTree(prevComments, deletedCommentId)
            if (onCommentChange) {
              const newTotal = calculateTotalComments(newComments)
              setTimeout(() => onCommentChange(newTotal), 0)
            }
            return newComments
          })
        }
      )
      .subscribe((status) => {
        console.log('Comments subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
        }
      })

    return () => {
      console.log('Cleaning up comments subscription')
      supabase.removeChannel(channel)
    }
  }, [postId, supabase, fetchComments, onCommentChange])

  // Handle new comment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated || !userId) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: newComment.trim(),
          parent_id: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting comment:', error)
        alert('Failed to post comment. Please try again.')
      } else {
        setNewComment('')
        
        if (postAuthorId && postAuthorId !== userId && currentUserProfile) {
          await notificationHelpers.newComment(
            postId,
            userId,
            data.id,
            newComment.trim()
          )
        }
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('Failed to post comment. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reply submission - UPDATED: Properly notifies parent comment author (works for both directions)
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !isAuthenticated || !userId) {
      return
    }

    setIsSubmittingReply(parentId)
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: replyContent.trim(),
          parent_id: parentId
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting reply:', error)
        alert('Failed to post reply. Please try again.')
      } else {
        console.log('✅ Reply inserted:', data.id)
        setReplyTo(null)
        setReplyContent('')
        setActiveReplyId(null)
        
        // Get parent comment to find who to notify
        const parentComment = commentMap.get(parentId)
        
        if (parentComment && parentComment.user_id !== userId) {
          // Get replier's name for the notification
          const { data: replierProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', userId)
            .single()
          
          const replierName = replierProfile?.name || 'Someone'
          
          // Get post title for context
          const { data: post } = await supabase
            .from('posts')
            .select('movie_title')
            .eq('id', postId)
            .single()
          
          const postTitle = post?.movie_title || 'the post'
          
          // Create notification for the parent comment author
          // This works for BOTH scenarios:
          // 1. User replies to publisher → publisher gets notified
          // 2. Publisher replies to user → user gets notified
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: parentComment.user_id,
              type: 'reply',
              title: 'New Reply',
              message: `${replierName} replied to your comment on "${postTitle}"`,
              metadata: {
                post_id: postId,
                comment_id: data.id,
                parent_comment_id: parentId,
                sender_id: userId,
                sender_name: replierName,
                content: replyContent.trim().substring(0, 100)
              },
              is_read: false,
              created_at: new Date().toISOString()
            })
          
          if (notifError) {
            console.error('❌ Failed to create reply notification:', notifError)
          } else {
            console.log('✅ Reply notification sent to:', parentComment.user_id)
          }
        }
      }
      
    } catch (error) {
      console.error('Error in handleReply:', error)
      alert('Failed to post reply. Please check your connection and try again.')
    } finally {
      setIsSubmittingReply(null)
    }
  }

  // Handle update
  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          is_edited: true
        })
        .eq('id', commentId)

      if (error) {
        console.error('Error updating comment:', error)
        alert('Failed to update comment. Please try again.')
      } else {
        setEditingComment(null)
        setEditContent('')
        setOpenMenuId(null)
      }
    } catch (error) {
      console.error('Error in handleUpdate:', error)
      alert('Failed to update comment. Please try again.')
    }
  }

  // Handle delete with animation
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setDeletingCommentId(commentId)
    setOpenMenuId(null)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setComments(prevComments => {
      const newComments = removeCommentFromTree(prevComments, commentId)
      if (onCommentChange) {
        const newTotal = calculateTotalComments(newComments)
        setTimeout(() => onCommentChange(newTotal), 0)
      }
      return newComments
    })
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) {
        console.error('Error deleting comment:', error)
        alert('Failed to delete comment. Please try again.')
        fetchComments()
      } else {
        console.log('✅ Comment deleted successfully:', commentId)
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('Failed to delete comment. Please try again.')
      fetchComments()
    } finally {
      setDeletingCommentId(null)
    }
  }

  // Handle pin/unpin comment
  const handlePinComment = async (commentId: string, currentPinStatus: boolean) => {
    if (userId !== postAuthorId) {
      alert('Only the post author can pin comments')
      return
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_pinned: !currentPinStatus,
          pinned_at: !currentPinStatus ? new Date().toISOString() : null
        })
        .eq('id', commentId)

      if (error) {
        console.error('Error pinning comment:', error)
        alert('Failed to pin comment. Please try again.')
      } else {
        setOpenMenuId(null)
      }
    } catch (error) {
      console.error('Error in handlePinComment:', error)
      alert('Failed to pin comment. Please try again.')
    }
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const toggleMenu = (commentId: string) => {
    setOpenMenuId(openMenuId === commentId ? null : commentId)
  }

  const activateReply = (commentId: string) => {
    setActiveReplyId(commentId)
    setReplyTo(commentId)
    setReplyContent('')
    setTimeout(() => {
      replyInputRefs.current.get(commentId)?.focus()
    }, 100)
  }

  const cancelReply = () => {
    setActiveReplyId(null)
    setReplyTo(null)
    setReplyContent('')
  }

  const renderComment = (comment: Comment, depth = 0) => {
    const isOwner = userId === comment.user_id
    const isPostAuthor = userId === postAuthorId
    const isCommentAuthor = comment.user_id === postAuthorId
    const hasReplies = comment.replies && comment.replies.length > 0
    const showReplies = expandedReplies.has(comment.id)
    const isHighlighted = highlightedComment === comment.id
    const isPinned = comment.is_pinned
    const isReplying = isSubmittingReply === comment.id
    const isDeleting = deletingCommentId === comment.id
    const isMenuOpen = openMenuId === comment.id
    const isReplyActive = activeReplyId === comment.id

    // Limit nesting depth to 3 levels (YouTube style) 
    const maxDepth = 3
    const showThreadLine = depth > 0 && depth < maxDepth
    const nextDepth = Math.min(depth + 1, maxDepth)

    return (
      <div 
        key={comment.id} 
        ref={(el) => {
          if (el) {
            highlightedCommentRefs.current.set(comment.id, el)
          } else {
            highlightedCommentRefs.current.delete(comment.id)
          }
        }}
        className={`
          group/comment
          ${depth > 0 ? 'relative' : ''}
          ${isHighlighted ? 'transition-all duration-300' : ''}
          ${isDeleting ? 'animate-comment-delete' : ''}
          py-3 first:pt-0
        `}
        id={`comment-${comment.id}`}
      >
        {/* Thread line for nested comments */}
        {showThreadLine && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
            style={{ left: '-20px' }}
          />
        )}
        
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            <AuthorAvatar 
              src={comment.user.avatar_url}
              name={comment.user.name}
              size="md"
            />
          </div>
          
          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {comment.user.name}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                  {comment.is_edited && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                  {isCommentAuthor && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                      <Award size={10} />
                      Publisher
                    </span>
                  )}
                  {isPinned && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      <Pin size={10} />
                      Pinned
                    </span>
                  )}
                </div>
                
                {/* Content */}
                <div className="mt-1 text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                  {formatCommentContent(comment.content)}
                </div>
                
                {/* Action Buttons - YouTube Style */}
                <div className="flex items-center gap-4 mt-2">
                  {isAuthenticated && !isReplyActive && (
                    <button
                      onClick={() => activateReply(comment.id)}
                      disabled={isReplying || isDeleting}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <Reply size={14} />
                      Reply
                    </button>
                  )}
                  
                  {/* Three dots menu */}
                  {(isOwner || isPostAuthor) && !isDeleting && (
                    <div className="relative">
                      <button
                        id={`menu-btn-${comment.id}`}
                        onClick={() => toggleMenu(comment.id)}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical size={14} className="text-gray-500" />
                      </button>
                      {isMenuOpen && (
                        <div 
                          ref={(el) => {
                            if (el) menuRefs.current.set(comment.id, el)
                          }}
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1"
                        >
                          {isPostAuthor && (
                            <button
                              onClick={() => handlePinComment(comment.id, isPinned)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              {isPinned ? (
                                <>
                                  <PinOff size={14} />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin size={14} />
                                  Pin
                                </>
                              )}
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => {
                                setEditingComment(comment.id)
                                setEditContent(comment.content)
                                setOpenMenuId(null)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Inline Reply Form - YouTube Style */}
                {isReplyActive && isAuthenticated && (
                  <div className="mt-3">
                    <div className="flex gap-3">
                      <div className="shrink-0">
                        <AuthorAvatar 
                          src={currentUserProfile?.avatar_url}
                          name={currentUserProfile?.name}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1">
                        <textarea
                          ref={(el) => {
                            if (el) replyInputRefs.current.set(comment.id, el)
                          }}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to ${comment.user.name}...`}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          disabled={isReplying}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleReply(comment.id)
                            }
                            if (e.key === 'Escape') {
                              cancelReply()
                            }
                          }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={isReplying || !replyContent.trim()}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                          >
                            {isReplying ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Replying...
                              </>
                            ) : (
                              'Reply'
                            )}
                          </button>
                          <button
                            onClick={cancelReply}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Replies Section - Threaded */}
                {hasReplies && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {showReplies ? (
                        <>
                          <ChevronUp size={14} />
                          Hide {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          Show {comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'}
                        </>
                      )}
                    </button>
                    
                    {showReplies && (
                      <div className="mt-2 space-y-3 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                        {comment.replies!.map(reply => renderComment(reply, nextDepth + 1))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="comment-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
        </div>
      </div>
    )
  }

  const totalComments = calculateTotalComments(comments)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      {/* Animation Styles */}
      <style jsx>{`
        .comment-loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .comment-loading-dots span {
          width: 10px;
          height: 10px;
          background-color: #9ca3af;
          border-radius: 50%;
          display: inline-block;
          animation: comment-loading-bounce 1.4s infinite ease-in-out both;
        }

        .comment-loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .comment-loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes comment-loading-bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes commentDelete {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          30% {
            opacity: 0.8;
            transform: translateX(-10px);
            background-color: #fee2e2;
          }
          100% {
            opacity: 0;
            transform: translateX(-100%);
            height: 0;
            padding: 0;
            margin: 0;
            overflow: hidden;
          }
        }

        .animate-comment-delete {
          animation: commentDelete 0.4s ease-in-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        <MessageCircle size={20} className="text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
        </h3>
      </div>

      {/* Comment Form - YouTube Style */}
      {isAuthenticated ? (
        <div className="py-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <AuthorAvatar 
                src={currentUserProfile?.avatar_url}
                name={currentUserProfile?.name}
                size="md"
              />
            </div>
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={1}
                  className="w-full px-0 py-2 text-sm bg-transparent border-b border-gray-300 focus:border-b-2 focus:border-b-blue-500 dark:border-gray-600 dark:text-white focus:outline-none resize-none transition-colors"
                  required
                  disabled={isSubmitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as any)
                    }
                  }}
                />
                
                {/* Loading overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                      <div className="comment-loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Posting...
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewComment('')}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Comment
                    </>
                  ) : (
                    'Comment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <MessageCircle size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Join the Discussion
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sign in to view and participate in the conversation
          </p>
          <Link
            href={`/login?redirect=/post/${postId}`}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
          >
            <LogIn size={16} />
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 mt-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAuthenticated 
                ? "No comments yet. Be the first to comment!" 
                : "No comments yet. Sign in to start the discussion!"}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned Comments Section */}
            {comments.filter(c => c.is_pinned).length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1 mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Pin size={12} />
                  Pinned Comments
                </div>
                {comments.filter(c => c.is_pinned).map(comment => renderComment(comment))}
              </div>
            )}
            
            {/* All Comments */}
            {comments.filter(c => !c.is_pinned).map(comment => renderComment(comment))}
          </>
        )}
      </div>
    </div>
  )
}