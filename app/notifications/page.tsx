// app/notifications/page.tsx - with reply to comment functionality and fixed follow notification handling
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  MessageSquare, 
  UserPlus, 
  Mail, 
  AlertCircle, 
  Heart,
  CheckCheck,
  Trash2,
  RefreshCw,
  Loader2,
  Reply,
  Send,
  X
} from 'lucide-react'
import { notificationEmitter } from '@/lib/notifications'
import AuthorAvatar from '@/components/AuthorAvatar'
import Link from 'next/link'

interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'reply' | 'follow' | 'welcome' | 'message' | 'like'
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata?: any
  post_id?: string
  comment_id?: string
}

interface Comment {
  id: string
  content: string
  user_id: string
  user?: {
    name: string
    avatar_url: string | null
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Reply states
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [postDetails, setPostDetails] = useState<Record<string, { title: string; authorId: string }>>({})
  
  const deletedIdsRef = useRef<Set<string>>(new Set())
  const isDeletingRef = useRef(false)
  const replyInputRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  // Function to mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (!error) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Fetch post details for reply functionality
  const fetchPostDetails = useCallback(async (postId: string) => {
    if (postDetails[postId]) return postDetails[postId]
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('movie_title, user_id')
        .eq('id', postId)
        .single()
      
      if (!error && data) {
        const details = { title: data.movie_title, authorId: data.user_id }
        setPostDetails(prev => ({ ...prev, [postId]: details }))
        return details
      }
    } catch (error) {
      console.error('Error fetching post details:', error)
    }
    return null
  }, [postDetails, supabase])

  // Handle reply submission from notification
  const handleReplyToComment = async (notification: Notification) => {
    if (!replyContent.trim() || !user || !notification.metadata?.post_id || !notification.metadata?.comment_id) {
      return
    }

    setIsSubmittingReply(true)
    
    try {
      // Insert the reply
      const { data: reply, error: replyError } = await supabase
        .from('comments')
        .insert({
          post_id: notification.metadata.post_id,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: notification.metadata.comment_id
        })
        .select()
        .single()

      if (replyError) {
        console.error('Error inserting reply:', replyError)
        alert('Failed to post reply. Please try again.')
      } else {
        console.log('✅ Reply posted from notification:', reply.id)
        
        // Get current user's profile
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()
        
        const replierName = userProfile?.name || 'Someone'
        
        // Get post title
        const postDetails = await fetchPostDetails(notification.metadata.post_id)
        const postTitle = postDetails?.title || 'the post'
        
        // Send notification to the original comment author
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: notification.metadata.sender_id,
            type: 'reply',
            title: 'New Reply',
            message: `${replierName} replied to your comment on "${postTitle}"`,
            metadata: {
              post_id: notification.metadata.post_id,
              comment_id: reply.id,
              parent_comment_id: notification.metadata.comment_id,
              sender_id: user.id,
              sender_name: replierName,
              content: replyContent.trim().substring(0, 100)
            },
            is_read: false,
            created_at: new Date().toISOString()
          })
        
        if (notifError) {
          console.error('Failed to send reply notification:', notifError)
        }
        
        // Clear reply form
        setReplyingToId(null)
        setReplyContent('')
        setSuccessMessage('Reply posted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      
    } catch (error) {
      console.error('Error in handleReplyToComment:', error)
      alert('Failed to post reply. Please try again.')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  // 🔔 REALTIME NOTIFICATION LISTENER
  useEffect(() => {
    if (!user?.id) return

    console.log('🔔 Setting up realtime listener on notifications page for user:', user.id)

    const channel = supabase
      .channel(`notifications_page_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New notification received on notifications page:', payload.new)
          const newNotification = payload.new as Notification
          
          if (isDeletingRef.current) return
          if (deletedIdsRef.current.has(newNotification.id)) return
          
          setNotifications(prev => {
            if (prev.some(n => n.id === newNotification.id)) return prev
            return [newNotification, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Notification deleted:', payload.old.id)
          const deletedId = payload.old.id
          
          setNotifications(prev => prev.filter(n => n.id !== deletedId))
          deletedIdsRef.current.add(deletedId)
          
          setTimeout(() => {
            deletedIdsRef.current.delete(deletedId)
          }, 30000)
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime subscription status on page:', status)
      })

    const unsubscribe = notificationEmitter.on((notification) => {
      if (notification.user_id === user.id) {
        if (deletedIdsRef.current.has(notification.id)) return
        
        setNotifications(prev => {
          if (prev.some(n => n.id === notification.id)) return prev
          return [notification, ...prev]
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      unsubscribe()
    }
  }, [user, supabase])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=/notifications')
      return
    }
    setUser(user)
    await fetchNotifications(user.id)
  }

  const fetchNotifications = async (userId: string, forceRefresh: boolean = false) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const filteredData = (data || []).filter(
        notification => !deletedIdsRef.current.has(notification.id)
      )
      
      setNotifications(filteredData)
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshNotifications = async () => {
    if (!user) return
    setIsRefreshing(true)
    setError(null)
    await fetchNotifications(user.id, true)
    setIsRefreshing(false)
    
    setSuccessMessage('Notifications refreshed')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const deleteNotification = async (notificationId: string) => {
    if (deletingIds.has(notificationId)) return
    
    setDeletingIds(prev => new Set(prev).add(notificationId))
    setError(null)
    isDeletingRef.current = true
    
    try {
      const notificationToDelete = notifications.find(n => n.id === notificationId)
      if (!notificationToDelete) {
        setError('Notification not found')
        return
      }
      
      if (notificationToDelete.user_id !== user?.id) {
        setError('You can only delete your own notifications')
        return
      }
      
      deletedIdsRef.current.add(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)
      
      if (deleteError) {
        setNotifications(prev => [notificationToDelete, ...prev])
        deletedIdsRef.current.delete(notificationId)
        throw deleteError
      }
      
      setSuccessMessage('Notification deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setTimeout(() => {
        deletedIdsRef.current.delete(notificationId)
      }, 60000)
      
    } catch (error: any) {
      deletedIdsRef.current.delete(notificationId)
      setError(error.message || 'Failed to delete notification. Please try again.')
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      
      setTimeout(() => {
        isDeletingRef.current = false
      }, 1000)
    }
  }

  const deleteAllReadNotifications = async () => {
    if (!user) return
    
    const readNotifications = notifications.filter(n => n.is_read)
    if (readNotifications.length === 0) {
      setSuccessMessage('No read notifications to delete')
      setTimeout(() => setSuccessMessage(null), 2000)
      return
    }
    
    if (!confirm(`Delete ${readNotifications.length} read notification${readNotifications.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      return
    }
    
    setError(null)
    setIsDeletingAll(true)
    isDeletingRef.current = true
    
    try {
      const deletedIds: string[] = []
      readNotifications.forEach(n => {
        deletedIdsRef.current.add(n.id)
        deletedIds.push(n.id)
      })
      
      setNotifications(prev => prev.filter(n => !n.is_read))
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true)
      
      if (error) throw error
      
      setSuccessMessage(`Deleted ${readNotifications.length} read notification${readNotifications.length !== 1 ? 's' : ''}`)
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setTimeout(() => {
        deletedIds.forEach(id => {
          deletedIdsRef.current.delete(id)
        })
      }, 60000)
      
    } catch (error: any) {
      setError('Failed to delete read notifications')
      await fetchNotifications(user.id, true)
    } finally {
      setIsDeletingAll(false)
      setTimeout(() => {
        isDeletingRef.current = false
      }, 1000)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-5 h-5" />
      case 'follow':
        return <UserPlus className="w-5 h-5" />
      case 'message':
        return <Mail className="w-5 h-5" />
      case 'welcome':
        return <AlertCircle className="w-5 h-5" />
      case 'like':
        return <Heart className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      case 'follow':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'message':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
      case 'welcome':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'like':
        return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      
      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: diffDays < 365 ? undefined : 'numeric'
      })
    }
  }

  // UPDATED: Handle notification click - different behavior based on notification type
  const handleNotificationClick = async (notification: Notification) => {
    // Don't navigate if we're replying
    if (replyingToId === notification.id) return
    
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    
    // Handle different notification types
    if (notification.type === 'follow') {
      // For follow notifications, just stay on the page (no navigation)
      // The notification is already marked as read above
      console.log('Follow notification marked as read, staying on notifications page')
      return
    } else if (notification.type === 'message') {
      router.push('/messages')
    } else if (notification.metadata?.post_id) {
      const url = notification.metadata?.comment_id 
        ? `/post/${notification.metadata.post_id}?comment=${notification.metadata.comment_id}`
        : `/post/${notification.metadata.post_id}`
      router.push(url)
    } else if (notification.type === 'welcome') {
      // Welcome notifications - just mark as read, no navigation
      return
    }
  }

  const cancelReply = () => {
    setReplyingToId(null)
    setReplyContent('')
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount = notifications.filter(n => n.is_read).length

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message Toast */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <CheckCheck className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Error Message Toast */}
        {error && (
          <div className="fixed top-4 right-4 z-50 animate-slideInRight">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 hover:bg-red-600 rounded-full p-1"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with your activity
              </p>
            </div>
            <button
              onClick={refreshNotifications}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              unreadCount > 0 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {unreadCount} unread
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {notifications.length} total
            </div>
            {readCount > 0 && (
              <button
                onClick={deleteAllReadNotifications}
                disabled={isDeletingAll}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isDeletingAll ? 'Deleting...' : 'Clear read'}
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => {
                const isReplying = replyingToId === notification.id
                const canReply = notification.type === 'comment' && notification.metadata?.comment_id
                
                return (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-start space-x-4 flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Icon */}
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white font-medium mb-1">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {notification.message}
                          </p>
                          
                          {notification.metadata?.content && (
                            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                                "{notification.metadata.content}"
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(notification.created_at)}
                            </span>
                            
                            {!notification.is_read && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Reply Button - Only for comment notifications */}
                        {canReply && !isReplying && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setReplyingToId(notification.id)
                              setReplyContent('')
                              setTimeout(() => {
                                replyInputRefs.current.get(notification.id)?.focus()
                              }, 100)
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                            title="Reply to comment"
                          >
                            <Reply className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          disabled={deletingIds.has(notification.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete notification"
                        >
                          {deletingIds.has(notification.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Reply Form - Inline */}
                    {isReplying && (
                      <div className="mt-4 ml-16">
                        <div className="flex gap-3">
                          <div className="shrink-0">
                            <AuthorAvatar 
                              src={user?.user_metadata?.avatar_url}
                              name={user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                              size="sm"
                            />
                          </div>
                          <div className="flex-1">
                            <textarea
                              ref={(el) => {
                                if (el) replyInputRefs.current.set(notification.id, el)
                              }}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              rows={3}
                              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                              disabled={isSubmittingReply}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleReplyToComment(notification)
                                }
                                if (e.key === 'Escape') {
                                  cancelReply()
                                }
                              }}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleReplyToComment(notification)}
                                disabled={isSubmittingReply || !replyContent.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-1"
                              >
                                {isSubmittingReply ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    Reply
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelReply}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm flex items-center gap-1"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Bell className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You'll see notifications here when someone comments, follows, or replies to you
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}