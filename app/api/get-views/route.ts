// app/api/get-views/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
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
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}