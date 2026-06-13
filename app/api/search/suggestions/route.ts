// app/api/search/suggestions/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase().trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = await createClient()

    // Search movies by title
    const { data: movies } = await supabase
      .from('posts')
      .select('id, movie_title, movie_poster_url')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .ilike('movie_title', `%${query}%`)
      .limit(5)

    // Search directors
    const { data: directors } = await supabase
      .from('posts')
      .select('director')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .ilike('director', `%${query}%`)
      .limit(5)

    // Search cast/actors
    const { data: postsWithCast } = await supabase
      .from('posts')
      .select('cast')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .limit(100)

    // Extract unique actors that match the query
    const uniqueActors = new Set<string>()
    postsWithCast?.forEach(post => {
      post.cast?.forEach((actor: string) => {
        if (actor.toLowerCase().includes(query)) {
          uniqueActors.add(actor)
        }
      })
    })
    const actors = Array.from(uniqueActors).slice(0, 5)

    // Format results
    const suggestions = [
      ...(movies?.map(movie => ({
        id: movie.id,
        title: movie.movie_title,
        type: 'movie' as const,
        posterUrl: movie.movie_poster_url || undefined
      })) || []),
      
      ...(directors?.map(dir => ({
        id: `director-${dir.director}`,
        title: dir.director,
        type: 'director' as const
      })) || []),
      
      ...(actors?.map(actor => ({
        id: `actor-${actor}`,
        title: actor,
        type: 'actor' as const
      })) || [])
    ]

    // Sort by relevance (exact matches first)
    suggestions.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query
      const bExact = b.title.toLowerCase() === query
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      const aStartsWith = a.title.toLowerCase().startsWith(query)
      const bStartsWith = b.title.toLowerCase().startsWith(query)
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      return 0
    })

    // Return top 10 suggestions
    return NextResponse.json(suggestions.slice(0, 10))

  } catch (error) {
    console.error('Error in search suggestions API:', error)
    return NextResponse.json([], { status: 500 })
  }
}