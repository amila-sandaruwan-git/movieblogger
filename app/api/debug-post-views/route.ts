// app/api/debug-post-views/route.ts - To verify what's being stored
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const supabase = await createClient()
    
    let query = supabase
      .from('post_views')
      .select(`
        id,
        post_id,
        user_id,
        user_email,
        created_at,
        session_id,
        view_type
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (postId) {
      query = query.eq('post_id', parseInt(postId))
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Get summary statistics
    const totalViews = data?.length || 0
    const viewsWithEmail = data?.filter(v => v.user_email !== null).length || 0
    const viewsWithoutEmail = data?.filter(v => v.user_email === null).length || 0
    const uniqueEmails = new Set(data?.map(v => v.user_email).filter(Boolean)).size
    const uniqueUserIds = new Set(data?.map(v => v.user_id).filter(Boolean)).size
    
    // Group by email to see frequency
    const emailFrequency: Record<string, number> = {}
    data?.forEach(view => {
      if (view.user_email) {
        emailFrequency[view.user_email] = (emailFrequency[view.user_email] || 0) + 1
      }
    })
    
    return NextResponse.json({
      summary: {
        total_views: totalViews,
        views_with_email: viewsWithEmail,
        views_without_email: viewsWithoutEmail,
        unique_emails: uniqueEmails,
        unique_user_ids: uniqueUserIds,
        email_view_frequency: emailFrequency
      },
      recent_views: data?.map(view => ({
        ...view,
        user_email: view.user_email ? maskEmail(view.user_email) : null,
        created_at: view.created_at
      }))
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function maskEmail(email: string) {
  if (!email) return email
  const [local, domain] = email.split('@')
  if (local.length <= 3) return `${local}@${domain}`
  return `${local.substring(0, 3)}...@${domain}`
}