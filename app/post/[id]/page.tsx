// app/post/[id]/page.tsx - UNIFIED FRAME VERSION WITH FULL REVIEW POPUP (FIXED)
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ClientProfileDropdown } from '@/components/ClientProfileDropdown'
import { BookmarkButton } from '@/components/BookmarkButton'
import { LikeDislikeButtons } from '@/components/LikeDislikeButtons'
import { ReportButton } from '@/components/ReportButton'
import { CommentsSection } from '@/components/CommentsSection'
import { ShareButtons } from '@/components/ShareButtons'
import { ViewCount } from '@/components/ViewCount'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'
import { FollowButton } from '@/components/FollowButton'
import { FullReviewPopup } from '@/components/FullReviewPopup'
import { Suspense } from 'react'
import AuthorAvatar from '@/components/AuthorAvatar'
import TrailerPlayButton from '@/components/TrailerPlayButton'
import { Home, ChevronRight, Eye, User, Users, Calendar, MessageCircle, Quote, Play, Star, Film, Clock, Languages, Maximize2 } from 'lucide-react'
import { 
  formatDuration, 
  formatDate,
  formatShortDate,
  formatNumber
} from '@/utils/helpers'

// Dynamically import components
const PostContent = dynamic(() => import('@/components/PostContent'), {
  loading: () => <div className="animate-pulse h-96 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
})

const RelatedPostsClient = dynamic(() => import('@/components/RelatedPostsClient'), {
  loading: () => <div className="animate-pulse h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
})

interface Post {
  id: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'private' | 'scheduled'
  visibility: 'public' | 'private' | 'draft'
  created_at: string
  movie_title: string
  movie_background_title: string
  movie_poster_url: string
  movie_backdrop_url: string | null
  release_date: string
  director: string
  cast: string[]
  genre_tags: string[]
  duration: number
  review_language: string
  trailer_url: string
  tags: string[]
  scheduled_for: string | null
  published_at: string
  comments_enabled: boolean
  user_id: string
  tmdb_rating: number | null
  tmdb_id: number | null
  movie_language: string | null
  view_count: number
  rating: number | null
  rating_scale: '5' | '10' | null
}

interface UserProfile {
  id: string
  name: string
  avatar_url: string | null
  bio?: string | null
  follower_count?: number
  following_count?: number
}

// Extended user interface for current user
interface ExtendedUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
    full_name?: string
  }
}

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: PostPageProps) {
  const [postId, setPostId] = useState<string>('')
  const [post, setPost] = useState<Post | null>(null)
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null)
  const [authorStats, setAuthorStats] = useState({ totalPosts: 0, totalFollowers: 0, totalFollowing: 0 })
  const [authorPosts, setAuthorPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [isParamsLoaded, setIsParamsLoaded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [isFullReviewOpen, setIsFullReviewOpen] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // Unwrap params promise
  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params
        setPostId(unwrappedParams.id)
        setIsParamsLoaded(true)
      } catch (error) {
        console.error('Error unwrapping params:', error)
        setError('Failed to load post parameters')
        setIsLoading(false)
      }
    }
    
    unwrapParams()
  }, [params])

  // Fetch all data when params are loaded
  useEffect(() => {
    if (isParamsLoaded && postId) {
      fetchAllData()
    }
  }, [isParamsLoaded, postId])

  // Real-time updates for follower counts
  useEffect(() => {
    if (!authorProfile?.id) return

    const channel = supabase
      .channel(`author-follows-${authorProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${authorProfile.id}`
        },
        async () => {
          const stats = await getAuthorStats(authorProfile.id)
          setAuthorStats(stats)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authorProfile?.id])

  // Real-time subscription for comment count
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`comment-count-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        async () => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
          
          if (count !== null) {
            setCommentCount(count)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  // Fetch view count directly from post_views table (same method as homepage)
  const fetchViewCount = async (postId: string) => {
    try {
      const { data: viewsData, error } = await supabase
        .from('post_views')
        .select('post_id')
        .eq('post_id', parseInt(postId))
      
      if (error) {
        console.error('Error fetching view count:', error)
        return 0
      }
      
      return viewsData?.length || 0
    } catch (error) {
      console.error('Error fetching view count:', error)
      return 0
    }
  }

  const fetchAllData = async () => {
    if (!postId) {
      setError('No post ID provided')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) console.error('Auth error:', userError)

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()
        
        const extendedUser: ExtendedUser = {
          id: user.id,
          email: user.email,
          user_metadata: {
            name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url
          }
        }
        
        setCurrentUser(extendedUser)
      } else {
        setCurrentUser(null)
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError) {
        console.error('Post fetch error:', postError)
        setError('Unable to load post. Please try again.')
        setIsLoading(false)
        return
      }

      if (!postData) {
        setError('Post data is empty')
        setIsLoading(false)
        return
      }

      if (postData.status !== 'published' || postData.visibility !== 'public') {
        setError(`This post is ${postData.status} and ${postData.visibility}. Only published/public posts are accessible.`)
        setIsLoading(false)
        return
      }

      setPost(postData as Post)
      
      const actualViewCount = await fetchViewCount(postId)
      setViewCount(actualViewCount)

      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      
      setCommentCount(count || 0)

      const { data: authorProfileData, error: authorError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio, follower_count, following_count')
        .eq('id', postData.user_id)
        .maybeSingle()

      if (authorError) {
        console.error('Error fetching author profile:', authorError)
      }

      if (authorProfileData) {
        setAuthorProfile(authorProfileData as UserProfile)
      } else {
        const { data: userData } = await supabase.auth.getUser()
        
        if (userData?.user && userData.user.id === postData.user_id) {
          setAuthorProfile({
            id: postData.user_id,
            name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'User',
            avatar_url: userData.user.user_metadata?.avatar_url || null,
            bio: null
          })
        } else {
          setAuthorProfile({
            id: postData.user_id,
            name: 'Movie Reviewer',
            avatar_url: null,
            bio: null
          })
        }
      }

      const stats = await getAuthorStats(postData.user_id)
      setAuthorStats(stats)

      const { data: authorPostsData } = await supabase
        .from('posts')
        .select('id, movie_title, movie_poster_url, published_at, view_count')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('user_id', postData.user_id)
        .neq('id', postId)
        .order('published_at', { ascending: false })
        .limit(5)

      setAuthorPosts(authorPostsData || [])
      await trackView(postId)

    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(`Failed to load post: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuthorStats = async (authorId: string) => {
    try {
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authorId)
        .eq('status', 'published')
        .eq('visibility', 'public')

      const { count: totalFollowers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', authorId)

      const { count: totalFollowing } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', authorId)

      return {
        totalPosts: totalPosts || 0,
        totalFollowers: totalFollowers || 0,
        totalFollowing: totalFollowing || 0
      }
    } catch (error) {
      console.error('Error getting author stats:', error)
      return {
        totalPosts: 0,
        totalFollowers: 0,
        totalFollowing: 0
      }
    }
  }

  const trackView = async (postId: string) => {
    try {
      let sessionId = sessionStorage.getItem('view_session_id')
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
        sessionStorage.setItem('view_session_id', sessionId)
      }
      
      const viewedKey = `viewed_${postId}_${sessionId}`
      if (typeof window !== 'undefined' && !sessionStorage.getItem(viewedKey)) {
        
        let ip = 'unknown'
        try {
          const ipResponse = await fetch('/api/client-ip')
          if (ipResponse.ok) {
            const ipData = await ipResponse.json()
            ip = ipData.ip || 'unknown'
          }
        } catch (error) {
          console.error('Failed to get IP:', error)
        }
        
        const viewData = {
          post_id: parseInt(postId),
          user_id: currentUser?.id || null,
          user_email: currentUser?.email || null,
          ip_address: ip,
          user_agent: navigator.userAgent,
          session_id: sessionId,
          view_type: 'page_view'
        }
        
        const { error } = await supabase
          .from('post_views')
          .insert([viewData])
        
        if (!error) {
          const newViewCount = await fetchViewCount(postId)
          setViewCount(newViewCount)
          sessionStorage.setItem(viewedKey, 'true')
          
          setTimeout(() => {
            sessionStorage.removeItem(viewedKey)
          }, 24 * 60 * 60 * 1000)
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const handleCommentChange = (total: number) => {
    setCommentCount(total)
  }

  const renderUserRating = () => {
    if (!post?.rating) return null
    
    const rating = post.rating
    const maxRating = post.rating_scale === '10' ? 10 : 5
    const starCount = Math.round(rating)
    
    return (
      <div className="mt-4 p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Reviewer's Rating</h4>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }).map((_, i) => (
              <span
                key={i}
                className={`text-2xl ${i < starCount ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
            {rating.toFixed(1)}/{maxRating}
          </span>
        </div>
      </div>
    )
  }

  const handleAuthorClick = () => {
    setIsProfileModalOpen(true)
  }

  const handleGenreClick = (genre: string) => {
    const encodedGenre = encodeURIComponent(genre.trim())
    router.push(`/reviews?genre=${encodedGenre}`)
  }

  if (!isParamsLoaded) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
                <div className="h-96 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
                <div className="h-96 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
                <div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/30 rounded-2xl p-8 border border-white/20">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The post you are looking for does not exist.'}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Home size={16} />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Breadcrumb Navigation - Glass Style */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link href="/" className="flex items-center hover:text-black dark:hover:text-white backdrop-blur-sm px-2 py-1 rounded-lg transition-colors">
            <Home size={14} className="mr-1" />
            Home
          </Link>
          <ChevronRight size={14} />
          <Link href="/reviews" className="hover:text-black dark:hover:text-white backdrop-blur-sm px-2 py-1 rounded-lg transition-colors">
            Reviews
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white font-medium truncate backdrop-blur-sm px-2 py-1 rounded-lg">
            {post.movie_title}
          </span>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Hero Section with glass-style short description */}
        <div className="relative rounded-2xl overflow-hidden mb-6 group shadow-2xl">
          <div className="relative w-full h-125 md:h-137.5">
            {post.movie_backdrop_url ? (
              <img
                src={post.movie_backdrop_url}
                alt={post.movie_title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : post.movie_poster_url ? (
              <img
                src={post.movie_poster_url}
                alt={post.movie_title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4 text-white/50">🎬</div>
                  <span className="text-white/70 text-xl">No image available</span>
                </div>
              </div>
            )}
            
            {/* Gradient overlay for better text visibility */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent"></div>
          </div>
          
          {/* Trailer button - fully clickable and visible */}
          {post.trailer_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <TrailerPlayButton 
                trailerUrl={post.trailer_url}
                movieTitle={post.movie_title}
              />
            </div>
          )}
          
          {/* Banner content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-linear-to-t from-black/80 via-transparent to-transparent">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
              {/* Left side - Movie info */}
              <div className="text-white lg:w-1/2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-lg">
                  {post.movie_title}
                </h1>
                
                {/* Movie metadata chips - Glass style */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {post.release_date && (
                    <span className="backdrop-blur-md bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                      📅 {new Date(post.release_date).getFullYear()}
                    </span>
                  )}
                  {post.duration > 0 && (
                    <span className="backdrop-blur-md bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                      ⏱️ {formatDuration(post.duration)}
                    </span>
                  )}
                  {post.review_language && (
                    <span className="backdrop-blur-md bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                      ✍️ {post.review_language}
                    </span>
                  )}
                </div>
                
                {/* Genre tags - Glass style with guaranteed clickability */}
                {post.genre_tags && post.genre_tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {post.genre_tags.map((genre, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleGenreClick(genre)}
                        className="inline-flex items-center justify-center backdrop-blur-md bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium border-2 border-white/40 hover:bg-white/50 hover:scale-105 transition-all duration-200 cursor-pointer shadow-lg"
                        style={{ 
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                        }}
                      >
                        <span className="relative">#{genre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right side - Glass-style short description */}
              {post.excerpt && (
                <div className="lg:w-1/2 lg:max-w-md w-full">
                  <div className="backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-xl p-5 shadow-2xl">
                    <div className="flex items-start gap-3 mb-3">
                      <Quote className="text-white/90 w-5 h-5 shrink-0" />
                      <h3 className="text-white/90 font-semibold text-sm uppercase tracking-wider">Short Description</h3>
                    </div>
                    <p className="text-white text-base leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Ratings positioned at top right on banner - Glass style */}
          <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-3" style={{ zIndex: 10 }}>
            {post.rating && (
              <div className="backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-xl p-3 text-center shadow-xl">
                <div className="text-xs font-semibold text-white/90 mb-1 flex items-center justify-center gap-1">
                  <Star size={12} className="text-yellow-300" /> Reviewer
                </div>
                <div className="text-xl font-bold text-white">
                  {post.rating.toFixed(1)}/{post.rating_scale === '10' ? 10 : 5}
                </div>
              </div>
            )}
            
            {post.tmdb_rating && (
              <div className="backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-xl p-3 text-center shadow-xl">
                <div className="text-xs font-semibold text-white/90 mb-1">
                  TMDB
                </div>
                <div className="text-xl font-bold text-white">
                  {post.tmdb_rating.toFixed(1)}/10
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Published Date - Glass style */}
        <div className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 border-b border-white/20 dark:border-white/10 pb-3">
          <Calendar size={16} className="text-blue-500" />
          <span className="text-sm font-medium">Published:</span>
          <span className="text-sm text-gray-900 dark:text-white">{formatDate(post.published_at)}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - UNIFIED FRAME */}
          <div className="lg:col-span-2 space-y-8">
            {/* SINGLE UNIFIED GLASS FRAME containing all content */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/30 rounded-xl shadow-sm border border-white/20 dark:border-white/10 overflow-hidden">
              
              {/* Action Bar Section */}
              <div className="p-4 md:p-6 border-b border-white/20 dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Suspense fallback={<div className="h-8 w-20 bg-white/20 dark:bg-gray-700/50 rounded animate-pulse"></div>}>
                      <LikeDislikeButtons postId={postId} userId={currentUser?.id} />
                    </Suspense>
                    
                    <Suspense fallback={<div className="h-8 w-8 bg-white/20 dark:bg-gray-700/50 rounded animate-pulse"></div>}>
                      <BookmarkButton postId={postId} userId={currentUser?.id} />
                    </Suspense>
                    
                    <ShareButtons 
                      title={post.movie_title}
                      url={`${siteUrl}/post/${postId}`}
                    />
                    
                    {/* Expand Button - Opens Full Review Popup */}
                    
                    
                    {/* Comment count display with real-time updates */}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <MessageCircle size={18} />
                      <span className="text-sm font-medium">{commentCount}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* View Count - Same method as homepage (direct count from post_views) */}
                    <div className="backdrop-blur-md bg-linear-to-r from-blue-500/20 to-purple-600/20 rounded-lg px-4 py-2 border border-white/20">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatNumber(viewCount)} view{viewCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    {currentUser && (
                      <ReportButton 
                        postId={postId}
                        userId={currentUser?.id}
                        isAuthenticated={!!currentUser}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Author Info Section */}
              <div className="p-4 md:p-6 border-b border-white/20 dark:border-white/10">
                <div className="flex items-start gap-4">
                  {/* Publisher Avatar */}
                  <button
                    onClick={handleAuthorClick}
                    className="cursor-pointer hover:opacity-80 transition-opacity shrink-0 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white rounded-full"
                    aria-label={`View ${authorProfile?.name || 'publisher'} profile`}
                  >
                    <AuthorAvatar 
                      src={authorProfile?.avatar_url}
                      name={authorProfile?.name || 'Movie Reviewer'}
                      size="lg"
                    />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {/* Publisher Name */}
                        <button
                          onClick={handleAuthorClick}
                          className="font-semibold text-xl text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left truncate block focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white rounded px-1"
                          aria-label={`View ${authorProfile?.name || 'publisher'} profile`}
                        >
                          {authorProfile?.name || 'Movie Reviewer'}
                        </button>
                        
                        {/* Follow Button */}
                        {authorProfile && authorProfile.id !== currentUser?.id && (
                          <FollowButton
                            targetUserId={authorProfile.id}
                            targetUserName={authorProfile.name}
                            currentUserId={currentUser?.id}
                            size="sm"
                            showCount={false}
                            onFollowChange={(isFollowing) => {
                              setAuthorStats(prev => ({
                                ...prev,
                                totalFollowers: isFollowing 
                                  ? prev.totalFollowers + 1 
                                  : Math.max(0, prev.totalFollowers - 1)
                              }))
                            }}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Stats Grid - WITHOUT BACKGROUND COLORS */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center rounded-lg p-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <User size={14} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Posts
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(authorStats.totalPosts)}
                        </div>
                      </div>
                      
                      <div className="text-center rounded-lg p-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users size={14} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Followers
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(authorStats.totalFollowers)}
                        </div>
                      </div>
                      
                      <div className="text-center rounded-lg p-2">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users size={14} className="rotate-180" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Following
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(authorStats.totalFollowing)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Publisher Bio */}
                    {authorProfile?.bio && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mt-4">
                        {authorProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Review Content Section - CLICKABLE to open full page popup */}
              <div className="p-4 md:p-8">
                <button
                  onClick={() => setIsFullReviewOpen(true)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
                      Full Review: {post.movie_title}
                    </h2>
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center">
                      <Maximize2 size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                    </div>
                  </div>
                </button>
                
                {renderUserRating()}

                {/* Preview of the review (first 500 characters) - CLICKABLE */}
                <div 
                  className="mt-6 prose prose-lg max-w-none dark:prose-invert cursor-pointer"
                  onClick={() => setIsFullReviewOpen(true)}
                >
                  <div dangerouslySetInnerHTML={{ 
                    __html: post.content.length > 500 
                      ? post.content.substring(0, 500) + '...' 
                      : post.content 
                  }} />
                  {post.content.length > 500 && (
                    <div className="mt-4 text-red-500 hover:text-red-600 font-medium flex items-center gap-2">
                      Read full review
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section - Separate from main frame */}
            {post.comments_enabled && (
              <Suspense fallback={<div className="h-64 bg-white/10 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl animate-pulse"></div>}>
                <CommentsSection 
                  postId={postId}
                  userId={currentUser?.id}
                  isAuthenticated={!!currentUser}
                  postAuthorId={post.user_id}
                  postAuthorName={authorProfile?.name}
                  postTitle={post.movie_title}
                  onCommentChange={handleCommentChange}
                />
              </Suspense>
            )}
          </div>

          {/* Sidebar - Glass style (kept separate for layout) */}
          <div className="space-y-8">
            {/* Movie Details Card - Glass style */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/30 rounded-xl p-6 shadow-sm border border-white/20 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Film size={18} className="text-blue-500" />
                Movie Details
              </h3>
              <div className="space-y-4">
                {post.director && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">Director:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex-1">{post.director}</p>
                  </div>
                )}
                {post.cast && post.cast.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">Cast:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex-1">
                      {post.cast.slice(0, 4).join(', ')}
                      {post.cast.length > 4 && ` +${post.cast.length - 4} more`}
                    </p>
                  </div>
                )}
                {post.movie_language && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">Language:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex-1">{post.movie_language}</p>
                  </div>
                )}
                {post.release_date && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">Release Date:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex-1">
                      {new Date(post.release_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Author's Other Reviews - Glass style */}
            {authorPosts && authorPosts.length > 0 && (
              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-800/30 rounded-xl p-6 shadow-sm border border-white/20 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  More from {authorProfile?.name || 'Author'}
                </h3>
                <div className="space-y-4">
                  {authorPosts.map((authorPost: any) => (
                    <Link
                      key={authorPost.id}
                      href={`/post/${authorPost.id}`}
                      className="flex items-center gap-3 group"
                    >
                      {authorPost.movie_poster_url ? (
                        <img
                          src={authorPost.movie_poster_url}
                          alt={authorPost.movie_title}
                          className="w-12 h-16 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-white/10 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                          🎬
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm line-clamp-2">
                          {authorPost.movie_title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatShortDate(authorPost.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts */}
            <RelatedPostsClient 
              currentPostId={postId}
              currentMovieTitle={post.movie_title}
              genreTags={post.genre_tags || []}
              cast={post.cast || []}
              director={post.director}
              releaseYear={post.release_date ? new Date(post.release_date).getFullYear() : undefined}
            />
          </div>
        </div>
      </main>

      {/* Footer - Glass style */}
      <footer className="backdrop-blur-xl bg-gray-900/80 text-white py-12 mt-12 border-t border-white/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">MovieBlogger</h3>
              <p className="text-gray-300 max-w-md">
                Your ultimate guide to the world of cinema. Reviews, news, and more.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="/reviews" className="hover:text-white transition-colors">
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="hover:text-white transition-colors">
                    News
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Join our newsletter</h4>
              <p className="text-gray-300 mb-4 text-sm">
                Get the latest movie news and reviews delivered to your inbox.
              </p>
              <div className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:text-white backdrop-blur-sm"
                />
                <button className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} MovieBlogger. All rights reserved.</p>
            <p className="mt-2">Movie data from TMDB. All trademarks belong to their respective owners.</p>
          </div>
        </div>
      </footer>

      {/* Author Profile Modal */}
      {isProfileModalOpen && authorProfile && (
        <AuthorProfileModal
          userId={authorProfile.id}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Full Review Popup */}
      <FullReviewPopup
        isOpen={isFullReviewOpen}
        onClose={() => setIsFullReviewOpen(false)}
        title={post.movie_title}
        content={post.content}
        movieTitle={post.movie_title}
      />
    </div>
  )
}