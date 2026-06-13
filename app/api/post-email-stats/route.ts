// app/api/post-email-stats/route.ts - UPDATED to count ALL user emails
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    
    // Get ALL email views for this post (not just publisher)
    const { data, error } = await supabase
      .from('post_views')
      .select('user_email, created_at')
      .eq('post_id', postIdNum)
      .not('user_email', 'is', null) // Get all records with emails
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email stats:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email stats' },
        { status: 500 }
      )
    }

    // If no data, return empty stats
    if (!data || data.length === 0) {
      return NextResponse.json({
        total_email_views: 0,
        unique_emails_count: 0,
        unique_emails_list: [],
        views_by_email: {},
        recent_views: []
      })
    }

    // Count unique emails (THIS COUNTS ALL UNIQUE EMAILS)
    const uniqueEmails = new Set(data.map(v => v.user_email))
    
    // Count views per email
    const viewsByEmail: Record<string, number> = {}
    data.forEach(view => {
      if (view.user_email) {
        viewsByEmail[view.user_email] = (viewsByEmail[view.user_email] || 0) + 1
      }
    })

    // Get top viewers (sorted by view count)
    const topViewers = Object.entries(viewsByEmail)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, count }))

    // Get recent views (last 20)
    const recentViews = data.slice(0, 20).map(view => ({
      user_email: view.user_email,
      created_at: view.created_at
    }))

    // Calculate returning viewers (emails with more than 1 view)
    const returningViewers = Object.values(viewsByEmail).filter(count => count > 1).length
    
    // Calculate average views per email
    const avgViewsPerEmail = data.length / uniqueEmails.size

    return NextResponse.json({
      // Summary stats
      total_email_views: data.length,
      unique_emails_count: uniqueEmails.size,
      returning_viewers_count: returningViewers,
      avg_views_per_email: parseFloat(avgViewsPerEmail.toFixed(1)),
      
      // Detailed data
      unique_emails_list: Array.from(uniqueEmails),
      views_by_email: viewsByEmail,
      top_viewers: topViewers,
      recent_views: recentViews,
      
      // Timestamps
      first_view: data[data.length - 1]?.created_at || null,
      last_view: data[0]?.created_at || null
    })

  } catch (error) {
    console.error('Unexpected error in post-email-stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}