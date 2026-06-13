// app/dashboard/reading-list/page.tsx - FIXED query syntax
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Eye, 
  Calendar, 
  User, 
  Bookmark, 
  BookmarkCheck,
  Clock,
  Film,
  Star,
  Trash2,
  Filter,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { formatDate, formatNumber } from '@/utils/helpers'

interface PostData {
  id: string
  movie_title: string
  movie_poster_url: string
  excerpt: string
  published_at: string
  view_count: number
  duration: number
  tmdb_rating: number | null
  user_id: string
}

interface AuthorData {
  name: string
  avatar_url: string | null
}

interface BookmarkWithPost {
  id: string
  post_id: string
  created_at: string
  post_data: PostData
  author_data: AuthorData
}

export default function ReadingListPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'recent' | 'rated'>('all')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing reading list page...')
        await fetchCurrentUser()
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize page')
      }
    }
    
    initialize()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      console.log('Current user set, fetching bookmarks...')
      fetchBookmarks()
    }
  }, [currentUser, filter])

  const fetchCurrentUser = async () => {
    try {
      console.log('Fetching current user...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error details:', userError)
        throw new Error(`Authentication failed: ${userError.message}`)
      }
      
      if (!user) {
        console.log('No user logged in')
        setError('Please log in to view your reading list')
        setIsLoading(false)
        return
      }
      
      console.log('User found:', user.id, user.email)
      setCurrentUser(user)
    } catch (err: any) {
      console.error('Error fetching user:', err)
      setError(err.message || 'Failed to fetch user data')
      setIsLoading(false)
    }
  }

  const fetchBookmarks = async () => {
    if (!currentUser?.id) {
      console.log('No user ID available, skipping fetch')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching bookmarks for user ID:', currentUser.id)
      
      // STEP 1: Fetch bookmarks
      const { data: bookmarksData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id, post_id, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (bookmarkError) {
        console.error('Bookmarks query error:', bookmarkError)
        throw new Error(`Failed to load bookmarks: ${bookmarkError.message}`)
      }

      console.log('Bookmarks found:', bookmarksData?.length || 0)

      if (!bookmarksData || bookmarksData.length === 0) {
        console.log('No bookmarks found for user')
        setBookmarks([])
        setIsLoading(false)
        return
      }

      // STEP 2: Extract post IDs
      const postIds = bookmarksData.map(b => b.post_id)
      console.log('Post IDs to fetch:', postIds)

      // STEP 3: Fetch posts - FIXED: Simplified query without comments in template literal
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          movie_title,
          movie_poster_url,
          excerpt,
          published_at,
          view_count,
          duration,
          tmdb_rating,
          user_id
        `)
        .in('id', postIds)
        .eq('status', 'published')
        .eq('visibility', 'public')

      // Apply filters
      if (filter === 'recent') {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        postsQuery = postsQuery.gte('published_at', oneWeekAgo.toISOString())
      } else if (filter === 'rated') {
        postsQuery = postsQuery.not('tmdb_rating', 'is', null)
      }

      const { data: postsData, error: postsError } = await postsQuery

      if (postsError) {
        console.error('Posts query error details:', {
          message: postsError.message,
          details: postsError.details,
          hint: postsError.hint,
          code: postsError.code
        })
        throw new Error(`Failed to load posts: ${postsError.message}`)
      }

      console.log('Posts found:', postsData?.length || 0)

      // STEP 4: Fetch author profiles
      const existingPosts = postsData || []
      const authorIds = [...new Set(existingPosts.map(post => post.user_id).filter(id => id))]
      
      console.log('Author IDs:', authorIds)

      const authorsMap = new Map<string, AuthorData>()
      if (authorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', authorIds)

        if (profilesError) {
          console.error('Profiles error (non-fatal):', profilesError.message)
        } else if (profilesData) {
          profilesData.forEach(profile => {
            authorsMap.set(profile.id, {
              name: profile.name || 'Unknown Author',
              avatar_url: profile.avatar_url
            })
          })
        }
      }

      // STEP 5: Combine data - FIXED: Remove spread operator issue
      const combinedData: BookmarkWithPost[] = []
      
      bookmarksData.forEach(bookmark => {
        const post = postsData?.find(p => p.id === bookmark.post_id)
        
        if (post) {
          const author = authorsMap.get(post.user_id) || {
            name: 'Unknown Author',
            avatar_url: null
          }

          // Create post data object without spread operator
          const postData: PostData = {
            id: post.id,
            movie_title: post.movie_title,
            movie_poster_url: post.movie_poster_url,
            excerpt: post.excerpt,
            published_at: post.published_at,
            view_count: post.view_count,
            duration: post.duration,
            tmdb_rating: post.tmdb_rating ? Number(post.tmdb_rating) : null,
            user_id: post.user_id
          }

          combinedData.push({
            id: bookmark.id,
            post_id: bookmark.post_id,
            created_at: bookmark.created_at,
            post_data: postData,
            author_data: author
          })
        } else {
          console.log(`Post ${bookmark.post_id} not found or not published`)
        }
      })

      console.log('Combined data count:', combinedData.length)
      setBookmarks(combinedData)

    } catch (err: any) {
      console.error('Unexpected error in fetchBookmarks:', err)
      setError(err.message || 'An unexpected error occurred while loading your reading list.')
      setBookmarks([])
    } finally {
      setIsLoading(false)
    }
  }

  const removeBookmark = async (bookmarkId: string) => {
    if (!currentUser) {
      alert('Please log in to manage bookmarks')
      return
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', currentUser.id)

      if (error) {
        console.error('Error removing bookmark:', error)
        alert('Failed to remove bookmark. Please try again.')
      } else {
        // Remove from local state
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const clearAllBookmarks = async () => {
    if (!currentUser) {
      alert('Please log in to manage bookmarks')
      return
    }

    if (!confirm('Are you sure you want to clear all bookmarks? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', currentUser.id)

      if (error) {
        console.error('Error clearing bookmarks:', error)
        alert('Failed to clear bookmarks. Please try again.')
      } else {
        setBookmarks([])
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Calculate stats
  const stats = {
    total: bookmarks.length,
    recent: bookmarks.filter(b => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(b.post_data.published_at) > weekAgo
    }).length,
    rated: bookmarks.filter(b => b.post_data.tmdb_rating !== null).length,
    avgDuration: bookmarks.length > 0 
      ? Math.round(bookmarks.reduce((acc, b) => acc + b.post_data.duration, 0) / bookmarks.length)
      : 0
  }

  // Filter bookmarks based on selected filter
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (filter === 'recent') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(bookmark.post_data.published_at) > weekAgo
    }
    
    if (filter === 'rated') {
      return bookmark.post_data.tmdb_rating !== null
    }
    
    return true
  })

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading your reading list...</p>
      </div>
    )
  }

  // Error display component
  if (error) {
    return (
      <div className="min-h-100 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {error.includes('log in') ? 'Authentication Required' : 'Error Loading Bookmarks'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchBookmarks}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Back to Dashboard
            </Link>
            {error.includes('log in') && (
              <Link
                href="/login"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Login
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <BookmarkCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reading List</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your saved movie reviews and articles
            </p>
          </div>
        </div>
        
        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {bookmarks.length} {bookmarks.length === 1 ? 'item' : 'items'}
            </span>
            <button
              onClick={clearAllBookmarks}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              disabled={!currentUser}
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Saved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.total)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recent (7 days)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.recent)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Ratings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.rated)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total > 0 ? formatDuration(stats.avgDuration) : '0m'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          disabled={!currentUser}
        >
          <Filter className="w-4 h-4" />
          All Bookmarks ({stats.total})
        </button>
        <button
          onClick={() => setFilter('recent')}
          className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            filter === 'recent'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          disabled={!currentUser}
        >
          <Calendar className="w-4 h-4" />
          Recent ({stats.recent})
        </button>
        <button
          onClick={() => setFilter('rated')}
          className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            filter === 'rated'
              ? 'bg-yellow-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          disabled={!currentUser}
        >
          <Star className="w-4 h-4" />
          With Ratings ({stats.rated})
        </button>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Movie Poster */}
                  <Link 
                    href={`/post/${bookmark.post_data.id}`}
                    className="shrink-0 group block w-full md:w-48"
                  >
                    {bookmark.post_data.movie_poster_url ? (
                      <div className="relative w-full h-64 md:h-48 rounded-lg overflow-hidden">
                        <Image
                          src={bookmark.post_data.movie_poster_url}
                          alt={bookmark.post_data.movie_title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 192px"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-64 md:h-48 bg-linear-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2 text-gray-400">🎬</div>
                          <span className="text-gray-300 text-sm">No poster</span>
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/post/${bookmark.post_data.id}`}
                          className="group block"
                        >
                          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                            {bookmark.post_data.movie_title}
                          </h3>
                        </Link>
                        
                        {/* Author info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              {bookmark.author_data.avatar_url ? (
                                <Image
                                  src={bookmark.author_data.avatar_url}
                                  alt={bookmark.author_data.name}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                  {bookmark.author_data.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {bookmark.author_data.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(bookmark.post_data.published_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ratings */}
                      <div className="flex flex-wrap gap-3">
                        {bookmark.post_data.tmdb_rating && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2">
                            <div className="text-xs text-yellow-800 dark:text-yellow-200">TMDB Rating</div>
                            <div className="font-bold text-yellow-600 dark:text-yellow-400">
                              {bookmark.post_data.tmdb_rating.toFixed(1)}/10
                            </div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              {'★'.repeat(Math.round(bookmark.post_data.tmdb_rating / 2))}
                              {'☆'.repeat(5 - Math.round(bookmark.post_data.tmdb_rating / 2))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Excerpt */}
                    {bookmark.post_data.excerpt && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                        {bookmark.post_data.excerpt}
                      </p>
                    )}

                    {/* Stats and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{formatNumber(bookmark.post_data.view_count)} views</span>
                        </div>
                        {bookmark.post_data.duration > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(bookmark.post_data.duration)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4" />
                          <span>Saved on {formatDate(bookmark.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/post/${bookmark.post_data.id}`}
                          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-300 flex items-center gap-2"
                        >
                          <ChevronRight className="w-4 h-4" />
                          Read Review
                        </Link>
                        <button
                          onClick={() => removeBookmark(bookmark.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          disabled={!currentUser}
                        >
                          <BookmarkCheck className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Bookmark className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {bookmarks.length === 0 ? 'Your reading list is empty' : 'No matching bookmarks found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {bookmarks.length === 0 
                ? currentUser 
                  ? 'Bookmark interesting movie reviews by clicking the bookmark icon while reading. They\'ll appear here for easy access.'
                  : 'Please log in to view and manage your reading list.'
                : `No bookmarks match the "${filter}" filter. Try selecting a different filter.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {currentUser ? (
                <>
                  <Link
                    href="/reviews"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Reviews
                  </Link>
                  <button
                    onClick={() => setFilter('all')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Show All Bookmarks
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/reviews"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Browse Reviews
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}