import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase().trim()
    if (!query || query.length < 2) return NextResponse.json([])

    const supabase = await createClient()

    const { data: movies } = await supabase
      .from('posts')
      .select('id, movie_title, movie_poster_url')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .ilike('movie_title', `%${query}%`)
      .limit(5)

    const { data: directors } = await supabase
      .from('posts')
      .select('director')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .ilike('director', `%${query}%`)
      .limit(5)

    const suggestions = [
      ...(movies || []).map(m => ({ id: m.id, title: m.movie_title, type: 'movie', posterUrl: m.movie_poster_url })),
      ...(directors || []).filter(d => d.director).map(d => ({ id: `director-${d.director}`, title: d.director, type: 'director' })),
    ]

    return NextResponse.json(suggestions.slice(0, 10))
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}