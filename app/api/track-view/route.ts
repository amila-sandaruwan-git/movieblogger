import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const { data: { user } } = await supabase.auth.getUser()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const cookieStore = await cookies()
    let cookieId = cookieStore.get('movieviewer_id')?.value
    if (!cookieId) cookieId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)

    const sessionKey = user ? `user_${user.id}_${postId}` : `anon_${ip}_${cookieId}_${postId}`
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: existing } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', postId)
      .eq('session_key', sessionKey)
      .gt('viewed_at', dayAgo)
      .maybeSingle()

    if (!existing) {
      await supabase.from('post_views').insert({
        post_id: postId,
        user_id: user?.id || null,
        user_email: user?.email || null,
        ip_address: ip,
        cookie_id: cookieId,
        user_agent: request.headers.get('user-agent') || 'unknown',
        session_key: sessionKey,
      })

      const { data: post } = await supabase.from('posts').select('view_count').eq('id', postId).single()
      if (post) {
        await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', postId)
      }
    }

    const response = NextResponse.json({ success: true })
    if (!user) {
      response.cookies.set({
        name: 'movieviewer_id',
        value: cookieId,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }
    return response
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}