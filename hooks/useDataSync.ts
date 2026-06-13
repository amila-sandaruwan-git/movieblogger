// hooks/useDataSync.ts
'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SyncEvent {
  type: 'post' | 'user' | 'comment'
  id: string
  action: 'delete' | 'update' | 'create'
  data?: any
}

export function useDataSync() {
  const supabase = createClient()

  // Function to refresh data
  const refreshData = useCallback(() => {
    console.log('Refreshing data...')
    
    // Dispatch a custom event that components can listen to
    const event = new CustomEvent('data-refresh', { 
      detail: { timestamp: new Date().toISOString() }
    })
    window.dispatchEvent(event)
    
    // Optionally, you could also trigger a page refresh
    // window.location.reload()
  }, [])

  useEffect(() => {
    // Set up event listeners for custom events
    const handlePostDeleted = (event: CustomEvent<SyncEvent>) => {
      console.log('Post deleted event received:', event.detail)
      refreshData()
    }

    const handleUserDeleted = (event: CustomEvent<SyncEvent>) => {
      console.log('User deleted event received:', event.detail)
      refreshData()
    }

    const handleCommentDeleted = (event: CustomEvent<SyncEvent>) => {
      console.log('Comment deleted event received:', event.detail)
      refreshData()
    }

    // Listen for custom events
    window.addEventListener('post-deleted', handlePostDeleted as EventListener)
    window.addEventListener('user-deleted', handleUserDeleted as EventListener)
    window.addEventListener('comment-deleted', handleCommentDeleted as EventListener)
    window.addEventListener('data-refresh', refreshData as EventListener)

    // Set up Supabase realtime subscriptions
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', // Listen to all events
          schema: 'public', 
          table: 'posts' 
        },
        (payload) => {
          console.log('Posts table change:', payload)
          if (payload.eventType === 'DELETE') {
            window.dispatchEvent(new CustomEvent('post-deleted', { 
              detail: { 
                type: 'post', 
                id: payload.old.id,
                action: 'delete'
              } 
            }))
          }
        }
      )
      .subscribe()

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'profiles' 
        },
        (payload) => {
          console.log('Profiles table change:', payload)
          if (payload.eventType === 'DELETE') {
            window.dispatchEvent(new CustomEvent('user-deleted', { 
              detail: { 
                type: 'user', 
                id: payload.old.id,
                action: 'delete'
              } 
            }))
          }
        }
      )
      .subscribe()

    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'comments' 
        },
        (payload) => {
          console.log('Comments table change:', payload)
          if (payload.eventType === 'DELETE') {
            window.dispatchEvent(new CustomEvent('comment-deleted', { 
              detail: { 
                type: 'comment', 
                id: payload.old.id,
                action: 'delete'
              } 
            }))
          }
        }
      )
      .subscribe()

    return () => {
      // Clean up event listeners
      window.removeEventListener('post-deleted', handlePostDeleted as EventListener)
      window.removeEventListener('user-deleted', handleUserDeleted as EventListener)
      window.removeEventListener('comment-deleted', handleCommentDeleted as EventListener)
      window.removeEventListener('data-refresh', refreshData as EventListener)
      
      // Remove Supabase channels
      supabase.removeChannel(postsChannel)
      supabase.removeChannel(profilesChannel)
      supabase.removeChannel(commentsChannel)
    }
  }, [supabase, refreshData])

  return { refreshData }
}