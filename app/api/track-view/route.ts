// app/api/track-view/route.ts - FIXED VERSION
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Get post ID from query parameters
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, view_count')
      .eq('id', postId)
      .single()
    
    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }
    
    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Get current user (if logged in)
    const { data: { user } } = await supabase.auth.getUser()
    
    let profileId: string | null = null
    let cookieId: string | null = null
    
    // If user is logged in, get their profile ID
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        profileId = profile.id
      }
    } else {
      // Anonymous user: Use cookie tracking
      const cookieStore = await cookies()
      const existingCookie = cookieStore.get('movieviewer_id')
      
      if (existingCookie) {
        cookieId = existingCookie.value
      } else {
        // Create new anonymous viewer ID
        cookieId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      }
    }
    
    // Create session key
    const sessionKey = profileId 
      ? `user_${profileId}_${postId}`
      : `anon_${ip}_${cookieId || 'nocookie'}_${postId}`
    
    // Check 24-hour window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Check if already viewed in last 24 hours
    const { data: existingView } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .eq('session_key', sessionKey)
      .gt('viewed_at', twentyFourHoursAgo)
      .maybeSingle()
    
    let counted = false
    let userType = profileId ? 'authenticated' : 'anonymous'
    let newCount = post.view_count
    
    // If NOT viewed, count it
    if (!existingView) {
      // Insert view record
      const { error: insertError } = await supabase
        .from('post_views')
        .insert({
          post_id: postId,
          profile_id: profileId,
          ip_address: ip,
          cookie_id: cookieId,
          user_agent: userAgent,
          session_key: sessionKey,
          viewed_at: new Date().toISOString(),
          is_unique: true,
          user_type: userType
        })
      
      if (!insertError) {
        counted = true
        
        // Update post count
        newCount = (post.view_count || 0) + 1
        
        await supabase
          .from('posts')
          .update({ view_count: newCount })
          .eq('id', postId)
      }
    }
    
    // Create response object
    const responseData = {
      success: true,
      counted,
      user_type: userType,
      count: newCount,
      session_key: sessionKey
    }
    
    // If we created a new cookie for anonymous user, set it in response
    if (!profileId && cookieId) {
      const response = NextResponse.json(responseData)
      response.cookies.set({
        name: 'movieviewer_id',
        value: cookieId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
      return response
    }
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Track view error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current view count
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    const { data: post } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', postId)
      .single()
    
    return NextResponse.json({
      count: post?.view_count || 0
    })
  } catch (error) {
    return NextResponse.json(
      { count: 0 },
      { status: 500 }
    )
  }
}