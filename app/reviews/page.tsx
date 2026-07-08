// app/reviews/page.tsx - FIXED VERSION
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ReviewsClient from '@/components/ReviewsClient'
import { createClient } from '@/lib/supabase/server'


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
}

interface UserProfile {
  id: string
  name: string
  avatar_url: string | null
}

interface Notification {
  id: string
  user_id: string
  type: 'comment' | 'follow' | 'welcome'
  message: string
  is_read: boolean
  created_at: string
  metadata?: any
}

// Define the props interface
interface ReviewsPageProps {
  searchParams: Promise<{
    search?: string
    genre?: string
    sort?: string
    year?: string
    movieLanguage?: string
    reviewLanguage?: string
  }>
}

// Format date function - same as homepage
function formatDate(dateString: string) {
  if (!dateString) return 'Recently'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffDay === 0) {
      if (diffHour === 0) {
        if (diffMin === 0) return 'Just now'
        return `${diffMin} min ago`
      }
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    }
    
    if (diffDay === 1) return 'Yesterday'
    if (diffDay < 7) return `${diffDay} days ago`
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'Recently'
  }
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch complete profile data for the user
  let profileName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  let profileAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        profileName = profile.name || profileName
        profileAvatar = profile.avatar_url || profileAvatar
      }
    } catch (error) {
      console.error('Error fetching profile for reviews page:', error)
    }
  }

  // Fetch notifications for the user - same as homepage
  let notifications: Notification[] = []
  let unreadCount = 0
  
  if (user) {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5) // Only show 5 most recent in dropdown - same as homepage

      if (data) {
        notifications = data as Notification[]
        unreadCount = data.filter((n: any) => !n.is_read).length
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Await searchParams first (Next.js 14+ pattern)
  const params = await searchParams
  
  // Read URL parameters safely
  const search = params?.search || ''
  const genre = params?.genre || ''
  const sort = params?.sort || ''
  const year = params?.year || ''
  const movieLanguage = params?.movieLanguage || ''
  const reviewLanguage = params?.reviewLanguage || ''

  // Fetch ALL published posts
  let posts: Post[] = []
  let userProfiles: Record<string, UserProfile> = {}
  
  try {
    // Start building the query
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public')

    // Apply genre filter on server side if provided
    if (genre) {
      // Decode the genre parameter
      const decodedGenre = decodeURIComponent(genre)
      query = query.contains('genre_tags', [decodedGenre])
    }

    // Apply initial sorting (will be overridden by client-side sorting if needed)
    if (sort === 'top-rated') {
      query = query.order('tmdb_rating', { ascending: false })
    } else {
      query = query.order('published_at', { ascending: false })
    }
      
    const { data: postsData, error: postsError } = await query
    
    if (postsError) {
      console.error('Error fetching published posts for reviews page:', postsError.message)
    } else if (postsData) {
      posts = postsData as Post[]
      
      // If we have posts, fetch user profiles
      if (posts.length > 0) {
        const userIds = [...new Set(posts.map(post => post.user_id))]
        
        try {
          // Try to fetch profiles from the profiles table
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url') // Only these columns exist in your table
            .in('id', userIds)
            
          if (!profilesError && profilesData) {
            profilesData.forEach((profile: any) => {
              userProfiles[profile.id] = {
                id: profile.id,
                name: profile.name || 'Movie Reviewer',
                avatar_url: profile.avatar_url
              }
            })
          } else {
            // Create placeholder profiles
            userIds.forEach(userId => {
              userProfiles[userId] = {
                id: userId,
                name: 'Movie Reviewer',
                avatar_url: null
              }
            })
          }
          
          // Ensure all user IDs have at least a placeholder profile
          userIds.forEach(userId => {
            if (!userProfiles[userId]) {
              userProfiles[userId] = {
                id: userId,
                name: 'Movie Reviewer',
                avatar_url: null
              }
            }
          })
          
        } catch (error: any) {
          console.error('Error in profile fetching:', error.message)
          // Create fallback profiles
          const userIds = [...new Set(posts.map(post => post.user_id))]
          userIds.forEach(userId => {
            userProfiles[userId] = {
              id: userId,
              name: 'Movie Reviewer',
              avatar_url: null
            }
          })
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching posts for reviews page:', error.message)
  }

  // Get unique values for filters
  const allGenres = Array.from(new Set(posts.flatMap(post => post.genre_tags || []))).sort()
  const allLanguages = Array.from(new Set(posts.map(post => post.movie_language).filter((lang): lang is string => lang !== null))).sort()
  const allReviewLanguages = Array.from(new Set(posts.map(post => post.review_language).filter((lang): lang is string => lang !== null))).sort()

  // Create a user object with profile data for ClientProfileDropdown
  const userWithProfile = user ? {
    ...user,
    id: user.id,
    user_metadata: {
      ...user.user_metadata,
      name: profileName,
      avatar_url: profileAvatar
    }
  } : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      

      {/* Page Header with active filter indicator */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 dark:text-white">
            Movie Reviews
            {genre && (
              <span className="text-xl text-gray-600 dark:text-gray-300 ml-3">
                - Filtered by: <span className="font-semibold">{decodeURIComponent(genre)}</span>
              </span>
            )}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {genre 
              ? `Showing reviews in the ${decodeURIComponent(genre)} genre`
              : 'Browse through all published movie reviews from our community of film enthusiasts.'}
          </p>
        </div>

        {/* Client Component with Interactive Features - WITHOUT notifications props */}
        <ReviewsClient
          initialPosts={posts}
          initialUserProfiles={userProfiles}
          allGenres={allGenres}
          allLanguages={allLanguages}
          allReviewLanguages={allReviewLanguages}
          initialSearch={search}
          initialGenre={genre}
          initialSort={sort || 'latest'}
          initialYear={year}
          initialMovieLanguage={movieLanguage}
          initialReviewLanguage={reviewLanguage}
          currentUser={user}
          // REMOVED: notifications and unreadCount - not needed in ReviewsClient
        />
      </div>

      {/* Footer */}
      <footer className="bg-linear-to-br from-gray-900 to-black text-white py-16 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl font-bold">MovieBlogger</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Your ultimate guide to the world of cinema. Discover reviews, news, and hidden gems from passionate movie lovers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Quick Links
              </h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/reviews" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-xl">❤️</span>
                Stay Updated
              </h4>
              <p className="text-gray-400 mb-4 text-sm">
                Get the latest movie news and reviews delivered to your inbox.
              </p>
              <div className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} MovieBlogger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}