// app/api/view-breakdown/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface PostView {
  user_id: string | null
  user_email: string | null
  session_id: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const postIdNum = parseInt(postId)
    if (isNaN(postIdNum)) {
      return NextResponse.json(
        { error: 'Invalid Post ID format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('post_views')
      .select('user_id, user_email, session_id')
      .eq('post_id', postIdNum)

    if (error) {
      console.error('Error fetching view breakdown:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const views = (data as PostView[]) || []
    
    // Calculate breakdown
    let authenticatedViews = 0
    let anonymousViews = 0
    const uniqueUserIds = new Set<string>()
    const uniqueEmailsSet = new Set<string>()
    const uniqueSessionsSet = new Set<string>()
    
    views.forEach((view: PostView) => {
      if (view.user_id) {
        authenticatedViews++
        uniqueUserIds.add(view.user_id)
      } else {
        anonymousViews++
      }
      
      if (view.user_email) {
        uniqueEmailsSet.add(view.user_email)
      }
      
      if (view.session_id) {
        uniqueSessionsSet.add(view.session_id)
      }
    })

    return NextResponse.json({
      authenticated_views: authenticatedViews,
      anonymous_views: anonymousViews,
      unique_authenticated_users: uniqueUserIds.size,
      unique_emails: uniqueEmailsSet.size,
      unique_sessions: uniqueSessionsSet.size
    })

  } catch (error) {
    console.error('Unexpected error in view-breakdown API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}