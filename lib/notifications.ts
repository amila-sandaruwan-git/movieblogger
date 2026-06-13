// lib/notifications.ts - FULLY UPDATED with proper reply notifications
'use client'

import { createClient } from '@/lib/supabase/client'

// Event emitter for real-time notifications
class NotificationEmitter {
  private listeners: ((notification: any) => void)[] = [];
  
  emit(notification: any) {
    console.log('📡 Emitting notification to', this.listeners.length, 'listeners')
    this.listeners.forEach(listener => listener(notification));
  }
  
  on(listener: (notification: any) => void) {
    this.listeners.push(listener);
    console.log('📡 New listener registered, total:', this.listeners.length)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      console.log('📡 Listener removed, total:', this.listeners.length)
    };
  }
}

export const notificationEmitter = new NotificationEmitter();

// Type definitions
export interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'reply' | 'follow' | 'welcome' | 'message' | 'like'
  title: string
  message: string
  is_read: boolean
  created_at: string
  updated_at?: string
  metadata?: {
    post_id?: string
    comment_id?: string
    sender_id?: string
    sender_name?: string
    sender_username?: string
    post_title?: string
    content?: string
    message_id?: string
    [key: string]: any
  }
  post_id?: string | number
  comment_id?: string
}

export interface NotificationData {
  userId: string
  type: 'comment' | 'reply' | 'follow' | 'message' | 'welcome' | 'like'
  title: string
  message: string
  metadata?: {
    post_id?: string
    comment_id?: string
    sender_id?: string
    sender_name?: string
    sender_username?: string
    post_title?: string
    content?: string
    message_id?: string
    [key: string]: any
  }
}

// Cache for user profiles
const profileCache = new Map<string, { name: string; email: string; avatar_url?: string }>()
const postTitleCache = new Map<string, string>()

// Helper function to get user profile by ID
async function getUserProfile(userId: string): Promise<{ name: string; email: string; avatar_url?: string } | null> {
  if (profileCache.has(userId)) {
    return profileCache.get(userId)!
  }
  
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.warn('Error fetching user profile:', error.message)
      return null
    }
    
    if (data) {
      profileCache.set(userId, data)
      setTimeout(() => profileCache.delete(userId), 5 * 60 * 1000)
    }
    
    return data
  } catch (error) {
    console.warn('Error in getUserProfile:', error)
    return null
  }
}

// Helper function to get post title by ID
async function getPostTitle(postId: string): Promise<string | null> {
  if (!postId) return null
  
  if (postTitleCache.has(postId)) {
    return postTitleCache.get(postId)!
  }
  
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('movie_title')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.warn('Error fetching post title:', error.message)
      return null
    }
    
    if (data?.movie_title) {
      postTitleCache.set(postId, data.movie_title)
      setTimeout(() => postTitleCache.delete(postId), 5 * 60 * 1000)
    }
    
    return data?.movie_title || null
  } catch (error) {
    console.warn('Error in getPostTitle:', error)
    return null
  }
}

// Helper function to get post author ID (PUBLISHER)
async function getPostAuthor(postId: string): Promise<string | null> {
  if (!postId) return null
  
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()
    
    if (error) {
      console.warn('Error fetching post author:', error.message)
      return null
    }
    
    return data?.user_id || null
  } catch (error) {
    console.warn('Error in getPostAuthor:', error)
    return null
  }
}

// Helper function to get comment author ID
async function getCommentAuthor(commentId: string): Promise<string | null> {
  if (!commentId) return null
  
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single()
    
    if (error) {
      console.warn('Error fetching comment author:', error.message)
      return null
    }
    
    return data?.user_id || null
  } catch (error) {
    console.warn('Error in getCommentAuthor:', error)
    return null
  }
}

// Main function to create notification
export async function createNotification(data: NotificationData) {
  try {
    const supabase = createClient()
    
    console.log('🔔 Creating notification for USER ID:', data.userId, 'Type:', data.type)
    
    // Prepare notification data
    const notificationData: any = {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add post_id and comment_id if they exist
    if (data.metadata?.post_id) {
      notificationData.post_id = parseInt(data.metadata.post_id) || data.metadata.post_id
    }
    
    if (data.metadata?.comment_id) {
      notificationData.comment_id = data.metadata.comment_id
    }

    console.log('📝 Inserting notification:', {
      user_id: notificationData.user_id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      has_post_id: !!notificationData.post_id,
      has_comment_id: !!notificationData.comment_id
    })

    // Insert notification
    const { data: result, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()

    if (error) {
      console.error('❌ Notification insert error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      
      // Create local notification as fallback
      const localNotification: Notification = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: data.metadata || {},
        post_id: data.metadata?.post_id,
        comment_id: data.metadata?.comment_id
      }
      
      console.log('✅ Created local notification fallback:', localNotification.id)
      notificationEmitter.emit(localNotification)
      return { 
        success: true, 
        data: localNotification,
        warning: 'Notification saved locally due to database error'
      }
    }
    
    console.log('✅ Notification created successfully:', result?.id)
    notificationEmitter.emit(result)
    return { success: true, data: result }
    
  } catch (error: any) {
    console.error('❌ Unexpected error in createNotification:', error)
    return { 
      success: false, 
      reason: 'Failed to create notification: ' + (error.message || 'Unknown error')
    }
  }
}

// Helper functions for specific notification types
export const notificationHelpers = {
  async newComment(
    postId: string, 
    commenterId: string,
    commentId?: string,
    commentContent?: string
  ) {
    console.log('🔍 newComment called:', { postId, commenterId, commentId })
    
    const postAuthorId = await getPostAuthor(postId)
    
    console.log('🔍 Found post author ID (PUBLISHER):', postAuthorId)
    
    if (!postAuthorId) {
      console.log('❌ No post author found, skipping notification')
      return { success: false, reason: 'No post author found' }
    }
    
    if (postAuthorId === commenterId) {
      console.log('✅ Commenter is the post author, no notification needed')
      return { success: false, reason: 'User commenting on their own post' }
    }
    
    const commenterProfile = await getUserProfile(commenterId)
    const commenterName = commenterProfile?.name || 'Someone'
    const postTitle = await getPostTitle(postId)
    
    const message = postTitle 
      ? `${commenterName} commented on your post "${postTitle}"`
      : `${commenterName} commented on your post`
    
    const result = await createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: 'New Comment',
      message: message,
      metadata: {
        post_id: postId,
        comment_id: commentId,
        sender_id: commenterId,
        sender_name: commenterName,
        sender_username: commenterProfile?.email?.split('@')[0] || 'user',
        post_title: postTitle || undefined,
        content: commentContent ? commentContent.substring(0, 200) + (commentContent.length > 200 ? '...' : '') : 'New comment'
      }
    })
    
    console.log('📨 Comment notification result:', result.success ? 'Success' : 'Failed')
    return result
  },

  // UPDATED: newReply now notifies ANY comment author, not just publisher
  async newReply(
    postId: string, 
    replierId: string,
    parentCommentId: string,
    replyId?: string,
    replyContent?: string
  ) {
    console.log('🔍 newReply called:', { postId, replierId, parentCommentId, replyId })
    
    // Get the parent comment author (who will receive the notification)
    const parentCommentAuthorId = await getCommentAuthor(parentCommentId)
    
    console.log('🔍 Parent comment author ID:', parentCommentAuthorId)
    console.log('🔍 Replier ID:', replierId)
    
    if (!parentCommentAuthorId) {
      console.log('❌ No parent comment author found')
      return { success: false, reason: 'No parent comment author found' }
    }
    
    // Don't notify if replying to your own comment
    if (parentCommentAuthorId === replierId) {
      console.log('✅ User replying to their own comment, no notification needed')
      return { success: false, reason: 'User replying to their own comment' }
    }
    
    console.log('↩️ Creating reply notification for:', {
      recipientId: parentCommentAuthorId,
      replierId: replierId
    })
    
    // Fetch replier's profile
    const replierProfile = await getUserProfile(replierId)
    const replierName = replierProfile?.name || 'Someone'
    
    // Fetch post title for context
    const postTitle = await getPostTitle(postId)
    
    // Prepare message - this works for ALL scenarios:
    // - User replies to publisher → publisher gets notified
    // - Publisher replies to user → user gets notified  
    // - User replies to another user → that user gets notified
    const message = postTitle 
      ? `${replierName} replied to your comment on "${postTitle}"`
      : `${replierName} replied to your comment`
    
    const result = await createNotification({
      userId: parentCommentAuthorId, // Send to the parent comment author (could be ANY user)
      type: 'reply',
      title: 'New Reply',
      message: message,
      metadata: {
        post_id: postId,
        comment_id: replyId,
        parent_comment_id: parentCommentId,
        sender_id: replierId,
        sender_name: replierName,
        sender_username: replierProfile?.email?.split('@')[0] || 'user',
        post_title: postTitle || undefined,
        content: replyContent ? replyContent.substring(0, 200) + (replyContent.length > 200 ? '...' : '') : 'New reply'
      }
    })
    
    console.log('📨 Reply notification result:', result.success ? 'Success' : 'Failed')
    return result
  },

  async newFollower(followerId: string, followingId: string) {
    console.log('🔍 newFollower called:', { followerId, followingId })
    
    if (!followingId || followingId === followerId) {
      console.log('❌ No valid user to follow or following self')
      return { success: false, reason: 'No valid follow action' }
    }
    
    console.log('👥 Creating follow notification for PUBLISHER:', { publisherId: followingId, followerId })
    
    const followerProfile = await getUserProfile(followerId)
    const followerName = followerProfile?.name || 'Someone'
    
    const result = await createNotification({
      userId: followingId,
      type: 'follow',
      title: 'New Follower',
      message: `${followerName} started following you`,
      metadata: {
        sender_id: followerId,
        sender_name: followerName,
        sender_username: followerProfile?.email?.split('@')[0] || 'user',
        avatar_url: followerProfile?.avatar_url
      }
    })
    
    console.log('📨 Follow notification result:', result.success ? 'Success' : 'Failed')
    return result
  },

  async welcomeMessage(userId: string) {
    if (!userId) {
      return { success: false, error: 'No userId provided' }
    }
    
    console.log('🎉 Creating welcome notification for new user:', userId)
    
    const userProfile = await getUserProfile(userId)
    const userName = userProfile?.name || 'New User'
    
    const result = await createNotification({
      userId,
      type: 'welcome',
      title: 'Welcome!',
      message: `Welcome to MovieReel, ${userName}! 🎬`,
      metadata: {
        is_welcome: true
      }
    })
    
    console.log('📨 Welcome notification result:', result.success ? 'Success' : 'Failed')
    return result
  },

  async clearCache() {
    profileCache.clear()
    postTitleCache.clear()
    console.log('🧹 Notification cache cleared')
  },

  async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      return { success: false, reason: error.message }
    }
  },

  async markAsRead(notificationId: string) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
      
      if (error) throw error
      
      return { success: true }
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      return { success: false, reason: error.message }
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
      
      if (error) throw error
      
      return { success: true }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, reason: error.message }
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      
      if (error) throw error
      
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      return { success: false, reason: error.message }
    }
  },

  async sendTestNotification(userId: string, type: 'comment' | 'follow' | 'welcome' = 'welcome') {
    console.log('🧪 Sending test notification to user:', userId, 'Type:', type)
    
    const userProfile = await getUserProfile(userId)
    const userName = userProfile?.name || 'Test User'
    
    let title = ''
    let message = ''
    let metadata: any = { is_test: true }
    
    switch (type) {
      case 'comment':
        title = 'Test Comment'
        message = `Test: Someone commented on your post`
        metadata.post_title = 'Test Post Title'
        metadata.content = 'This is a test comment'
        break
      case 'follow':
        title = 'Test Follower'
        message = `Test: Someone started following you`
        break
      case 'welcome':
      default:
        title = 'Welcome!'
        message = `Test: Welcome to MovieReel, ${userName}!`
        metadata.is_welcome = true
        break
    }
    
    const result = await createNotification({
      userId,
      type,
      title,
      message,
      metadata
    })
    
    console.log('🧪 Test notification result:', result.success ? 'Success' : 'Failed')
    return result
  }
}

if (typeof window !== 'undefined') {
  (window as any).notificationHelpers = notificationHelpers
}