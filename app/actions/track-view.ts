// app/actions/track-view.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'

export async function trackUniqueView(postId: string) {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    const cookiesStore = await cookies()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get or create session ID for anonymous users
    let sessionId = cookiesStore.get('session_id')?.value
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Get IP address
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               headersList.get('x-real-ip') ||
               'anonymous'
    
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // Check if this user has already viewed this post
    // For logged-in users: check by user_id
    // For anonymous users: check by IP + session combo
    const { data: existingView } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .or(
        user?.id 
          ? `user_id.eq.${user.id}`
          : `and(ip_address.eq.${ip},session_id.eq.${sessionId})`
      )
      .maybeSingle()
    
    // If no existing view found, create a new one
    if (!existingView) {
      const { error: insertError } = await supabase
        .from('post_views')
        .insert({
          post_id: postId,
          user_id: user?.id || null,
          ip_address: ip,
          session_id: sessionId,
          user_agent: userAgent,
          is_unique: true,
          viewed_at: new Date().toISOString()
        })
      
      if (!insertError) {
        // Update the cached view_count in posts table
        const { data: postData } = await supabase
          .from('posts')
          .select('view_count')
          .eq('id', postId)
          .single()
        
        if (postData) {
          await supabase
            .from('posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', postId)
        }
        
        return { success: true, isNewView: true }
      }
    }
    
    return { success: true, isNewView: false }
  } catch (error) {
    console.error('Error tracking view:', error)
    return { success: false, error: 'Failed to track view' }
  }
}

// Function to get unique view count
export async function getUniqueViewCount(postId: string) {
  try {
    const supabase = await createClient()
    
    // Count only unique views (where is_unique = true)
    const { count, error } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_unique', true)
    
    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting view count:', error)
    return 0
  }
}