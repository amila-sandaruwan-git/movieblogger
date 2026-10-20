// lib/notifications.ts
'use client'

import { createClient } from '@/lib/supabase/client'

// Event emitter for real-time notifications
class NotificationEmitter {
  private listeners: ((n: any) => void)[] = []

  emit(n: any) {
    this.listeners.forEach((l) => l(n))
  }

  on(l: (n: any) => void) {
    this.listeners.push(l)
    return () => {
      this.listeners = this.listeners.filter((x) => x !== l)
    }
  }
}

export const notificationEmitter = new NotificationEmitter()

// Strip undefined values so JSON serialization / Postgres jsonb doesn't reject the row
function sanitize(obj: any): any {
  if (obj === undefined) return null
  if (obj === null) return null
  if (Array.isArray(obj)) return obj.map(sanitize)
  if (typeof obj === 'object') {
    const out: Record<string, any> = {}
    for (const k in obj) {
      if (obj[k] !== undefined) out[k] = sanitize(obj[k])
    }
    return out
  }
  return obj
}

// Main function to create a notification
export async function createNotification(data: {
  userId: string
  type: 'comment' | 'reply' | 'follow' | 'welcome' | 'like' | 'new_post'
  title: string
  message: string
  metadata?: any
}) {
  const supabase = createClient()

  if (!data.userId) {
    console.warn('createNotification skipped: no recipient user_id provided')
    return { success: false, reason: 'Missing recipient userId' }
  }

  // Verify the sender is actually authenticated (RLS requires auth.uid() IS NOT NULL)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    console.warn('createNotification skipped: caller is not authenticated')
    return { success: false, reason: 'Caller not authenticated' }
  }

  const payload = {
    user_id: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    metadata: sanitize(data.metadata || {}),
    is_read: false,
    created_at: new Date().toISOString(),
  }

  // IMPORTANT: We do NOT use .select().single() here. 
  // We are inserting a row for ANOTHER user. 
  // If we used .select(), Postgres would try to read the row back, 
  // which violates the SELECT RLS policy (auth.uid() = user_id).
  const { error } = await supabase
    .from('notifications')
    .insert(payload)

  if (error) {
    // Log every field separately so Turbopack can't hide them as "{}"
    console.error(
      'Notification insert error ->',
      'MESSAGE:', error.message,
      '| CODE:', (error as any).code,
      '| DETAILS:', (error as any).details,
      '| HINT:', (error as any).hint
    )
    console.error(
      'Notification insert payload ->',
      JSON.stringify(payload, null, 2)
    )
    return { success: false, reason: error.message }
  }

  // Emit locally so the sender's UI updates if they have a widget listening
  const localNotification = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    ...payload,
  }
  notificationEmitter.emit(localNotification)

  return { success: true }
}

// --- Helper functions to fetch context for notifications ---

async function getProfileName(userId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle()
  return data?.name || 'Someone'
}

async function getPostAuthor(postId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('posts')
    .select('user_id, movie_title')
    .eq('id', postId)
    .maybeSingle()
  return data
}

async function getCommentAuthor(commentId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .maybeSingle()
  return data?.user_id
}

// --- Specific notification triggers ---

export const notificationHelpers = {
  async newComment(
    postId: string,
    commenterId: string,
    commentId?: string,
    content?: string
  ) {
    const post = await getPostAuthor(postId)
    if (!post || post.user_id === commenterId) {
      return { success: false, reason: 'Self-comment or post not found' }
    }

    const name = await getProfileName(commenterId)

    return createNotification({
      userId: post.user_id,
      type: 'comment',
      title: 'New Comment',
      message: `${name} commented on "${post.movie_title}"`,
      metadata: {
        post_id: postId,
        comment_id: commentId,
        sender_id: commenterId,
        sender_name: name,
        post_title: post.movie_title,
        content: content ? content.substring(0, 200) : undefined,
      },
    })
  },

  async newReply(
    postId: string,
    replierId: string,
    parentCommentId: string,
    replyId?: string,
    content?: string
  ) {
    const parentAuthor = await getCommentAuthor(parentCommentId)
    if (!parentAuthor || parentAuthor === replierId) {
      return { success: false, reason: 'Self-reply or comment not found' }
    }

    const name = await getProfileName(replierId)
    const post = await getPostAuthor(postId)

    return createNotification({
      userId: parentAuthor,
      type: 'reply',
      title: 'New Reply',
      message: `${name} replied to your comment on "${
        post?.movie_title || 'a review'
      }"`,
      metadata: {
        post_id: postId,
        comment_id: replyId,
        parent_comment_id: parentCommentId,
        sender_id: replierId,
        sender_name: name,
        post_title: post?.movie_title,
        content: content ? content.substring(0, 200) : undefined,
      },
    })
  },

  async newFollower(followerId: string, followingId: string) {
    if (followerId === followingId) {
      return { success: false, reason: 'Self-follow' }
    }

    const name = await getProfileName(followerId)

    return createNotification({
      userId: followingId,
      type: 'follow',
      title: 'New Follower',
      message: `${name} started following you`,
      metadata: {
        sender_id: followerId,
        sender_name: name,
      },
    })
  },

  async welcomeMessage(userId: string) {
    const name = await getProfileName(userId)

    return createNotification({
      userId,
      type: 'welcome',
      title: 'Welcome!',
      message: `Welcome to MovieBlogger, ${name}! 🎬`,
      metadata: { is_welcome: true },
    })
  },
}