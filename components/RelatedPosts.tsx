// components/RelatedPosts.tsx - FIXED VERSION
'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { formatShortDate } from '@/utils/helpers'

interface RelatedPostsProps {
  currentPostId: string
  currentMovieTitle: string
  genreTags?: string[]
  cast?: string[]
  director?: string
  releaseYear?: number
}

interface RelatedPost {
  id: string
  movie_title: string
  movie_poster_url: string | null
  published_at: string
  genre_tags?: string[] | null
  director?: string
  cast?: string[]
  release_date?: string
}

interface ScoredPost extends RelatedPost {
  similarityScore: number
}

export default function RelatedPosts({ 
  currentPostId, 
  currentMovieTitle,
  genreTags = [], 
  cast = [],
  director = '',
  releaseYear
}: RelatedPostsProps) {
  const [relatedPosts, setRelatedPosts] = useState<ScoredPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRelatedPosts()
  }, [currentPostId, genreTags, cast, director, releaseYear])

  const calculateSimilarityScore = (post: RelatedPost): number => {
    let score = 0
    
    // 1. Movie title similarity (highest priority)
    const currentTitleWords = currentMovieTitle.toLowerCase().split(/\s+/)
    const postTitleWords = post.movie_title.toLowerCase().split(/\s+/)
    
    // Check if any significant words match
    const matchingWords = currentTitleWords.filter(word => 
      word.length > 3 && postTitleWords.includes(word)
    )
    if (matchingWords.length > 0) {
      score += 40
    }
    
    // 2. Genre match
    if (post.genre_tags && genreTags.length > 0) {
      const matchingGenres = post.genre_tags.filter(genre => 
        genreTags.includes(genre)
      ).length
      score += matchingGenres * 20
    }
    
    // 3. Cast match
    if (post.cast && cast.length > 0) {
      const matchingCast = post.cast.filter(actor => 
        cast.some(c => 
          actor.toLowerCase().includes(c.toLowerCase()) || 
          c.toLowerCase().includes(actor.toLowerCase())
        )
      ).length
      score += matchingCast * 15
    }
    
    // 4. Director match
    if (director && post.director) {
      const currentDirectorWords = director.toLowerCase().split(/\s+/)
      const postDirectorWords = post.director.toLowerCase().split(/\s+/)
      
      if (currentDirectorWords[0] === postDirectorWords[0]) {
        score += 25
      }
    }
    
    // 5. Same year
    if (releaseYear && post.release_date) {
      const postYear = new Date(post.release_date).getFullYear()
      if (postYear === releaseYear) {
        score += 10
      }
    }
    
    return score
  }

  const fetchRelatedPosts = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      // Fetch all published posts except current one
      const { data, error } = await supabase
        .from('posts')
        .select('id, movie_title, movie_poster_url, published_at, genre_tags, director, cast, release_date')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .neq('id', currentPostId)
        .order('published_at', { ascending: false })
        .limit(20) // Get more posts to filter

      if (!error && data) {
        // Calculate similarity scores and create ScoredPost objects
        const scoredPosts: ScoredPost[] = data.map(post => ({
          ...post,
          similarityScore: calculateSimilarityScore(post)
        }))

        // Filter out posts with score 0 and sort by score
        const filteredPosts = scoredPosts
          .filter(post => post.similarityScore > 0)
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .slice(0, 3) // Take top 3

        // If not enough scored posts, add recent ones
        if (filteredPosts.length < 3) {
          const remaining = 3 - filteredPosts.length
          const recentPosts = scoredPosts
            .filter(post => !filteredPosts.some(fp => fp.id === post.id))
            .slice(0, remaining)
          filteredPosts.push(...recentPosts)
        }

        setRelatedPosts(filteredPosts)
      }
    } catch (error) {
      console.error('Error fetching related posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Reviews</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Reviews</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No related reviews found. Check out recent reviews instead.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Related Reviews</h3>
      <div className="space-y-4">
        {relatedPosts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="flex items-center gap-3 group"
          >
            {post.movie_poster_url ? (
              <img
                src={post.movie_poster_url}
                alt={post.movie_title}
                className="w-12 h-16 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                🎬
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm line-clamp-2">
                {post.movie_title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatShortDate(post.published_at)}
              </p>
              {/* Optional: Show similarity score for debugging */}
              {/* <p className="text-xs text-gray-400">Score: {post.similarityScore}</p> */}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}