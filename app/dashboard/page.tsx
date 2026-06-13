// app/dashboard/page.tsx - Dark theme design matching sidebar with session fix
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useClientSession } from '@/hooks/useClientSession'

interface Post {
  id: string
  content: string
  excerpt: string
  rating: number
  rating_scale: '5' | '10'
  status: 'draft' | 'published' | 'private' | 'scheduled'
  visibility: 'public' | 'private'
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
  movie_language: string
  trailer_url: string
  tags: string[]
  scheduled_for: string | null
  published_at: string
  comments_enabled: boolean
  tmdb_id?: number
  tmdb_rating?: number
  imdb_id?: string
}

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalComments: number
  followersCount: number
  followingCount: number
  views: {
    allTime: number
    today: number
    yesterday: number
    thisMonth: number
    lastMonth: number
  }
}

export default function DashboardPage() {
  // Session sync hook - fixes the tab switch issue
  const { user: clientUser, isLoading: sessionLoading, sessionChecked } = useClientSession()
  
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    scheduledPosts: 0,
    totalComments: 0,
    followersCount: 0,
    followingCount: 0,
    views: {
      allTime: 0,
      today: 0,
      yesterday: 0,
      thisMonth: 0,
      lastMonth: 0
    }
  })
  const [viewsTimeframe, setViewsTimeframe] = useState<'24h' | '7d' | '30d' | '3m' | '12m' | 'all'>('30d')
  const [viewsData, setViewsData] = useState<number[]>([])
  
  const supabase = createClient()
  const router = useRouter()

  // Redirect if no user after session check
  useEffect(() => {
    if (sessionChecked && !clientUser) {
      router.push('/login')
    }
  }, [clientUser, sessionChecked, router])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    generateViewsData()
  }, [viewsTimeframe])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setPosts(postsData || [])

      const publishedPosts = postsData?.filter(post => post.status === 'published') || []
      const draftPosts = postsData?.filter(post => post.status === 'draft') || []
      const scheduledPosts = postsData?.filter(post => post.status === 'scheduled') || []

      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id)

      let totalComments = 0
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_author_id', user.id)
        
        if (!error) {
          totalComments = count || 0
        }
      } catch (error) {
        console.warn('Comments table not available yet:', error)
        totalComments = 0
      }

      const allTimeViews = postsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayViews = postsData?.filter(post => {
        const postDate = new Date(post.created_at)
        postDate.setHours(0, 0, 0, 0)
        return postDate.getTime() === today.getTime()
      }).reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const yesterdayViews = postsData?.filter(post => {
        const postDate = new Date(post.created_at)
        postDate.setHours(0, 0, 0, 0)
        return postDate.getTime() === yesterday.getTime()
      }).reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const thisMonthViews = postsData?.filter(post => {
        const postDate = new Date(post.created_at)
        return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear
      }).reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
      const lastMonthViews = postsData?.filter(post => {
        const postDate = new Date(post.created_at)
        return postDate.getMonth() === lastMonth && postDate.getFullYear() === lastMonthYear
      }).reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

      const realStats: DashboardStats = {
        totalPosts: postsData?.length || 0,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        scheduledPosts: scheduledPosts.length,
        totalComments: totalComments,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        views: {
          allTime: allTimeViews,
          today: todayViews,
          yesterday: yesterdayViews,
          thisMonth: thisMonthViews,
          lastMonth: lastMonthViews
        }
      }

      setStats(realStats)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateViewsData = () => {
    const days = viewsTimeframe === '24h' ? 1 : 
                 viewsTimeframe === '7d' ? 7 : 
                 viewsTimeframe === '30d' ? 30 : 
                 viewsTimeframe === '3m' ? 90 : 
                 viewsTimeframe === '12m' ? 12 : 12
    
    const data = []
    for (let i = 0; i < days; i++) {
      data.push(Math.floor(Math.random() * 91) + 10)
    }
    setViewsData(data)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovieYear = (releaseDate: string) => {
    if (!releaseDate) return 'N/A'
    return new Date(releaseDate).getFullYear()
  }

  const handleEditPost = (postId: string) => {
    router.push(`/dashboard/edit-post/${postId}`)
  }

  const handleViewPost = (postId: string) => {
    window.open(`/post/${postId}`, '_blank')
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  const handlePublishPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          visibility: 'public'
        })
        .eq('id', postId)

      if (error) throw error

      fetchDashboardData()
    } catch (error) {
      console.error('Error publishing post:', error)
      alert('Failed to publish post')
    }
  }

  const handleUnpublishPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'draft',
          visibility: 'private'
        })
        .eq('id', postId)

      if (error) throw error

      fetchDashboardData()
    } catch (error) {
      console.error('Error unpublishing post:', error)
      alert('Failed to unpublish post')
    }
  }

  const handleRevertScheduledPost = async (postId: string) => {
    try {
      const { error } = await supabase        .from('posts')
        .update({ 
          status: 'draft',
          scheduled_for: null
        })
        .eq('id', postId)

      if (error) throw error

      fetchDashboardData()
    } catch (error) {
      console.error('Error reverting scheduled post:', error)
      alert('Failed to revert scheduled post')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-400">
          Track your blog performance and manage your content.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Followers */}
        <div className="bg-linear-to-br from-purple-600 to-pink-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold mb-1 opacity-90">Followers</h3>
              <p className="text-2xl font-bold">{stats.followersCount.toLocaleString()}</p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
          <p className="text-xs opacity-80 mt-2">People following you</p>
        </div>

        {/* Following */}
        <div className="bg-linear-to-br from-blue-600 to-cyan-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold mb-1 opacity-90">Following</h3>
              <p className="text-2xl font-bold">{stats.followingCount.toLocaleString()}</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
          <p className="text-xs opacity-80 mt-2">People you follow</p>
        </div>

        {/* Total Posts */}
        <div className="bg-linear-to-br from-green-600 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold mb-1 opacity-90">Total Posts</h3>
              <p className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</p>
            </div>
            <div className="text-2xl">📝</div>
          </div>
          <p className="text-xs opacity-80 mt-2">All your posts</p>
        </div>

        {/* Comments */}
        <div className="bg-linear-to-br from-orange-600 to-red-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold mb-1 opacity-90">Comments</h3>
              <p className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</p>
            </div>
            <div className="text-2xl">💬</div>
          </div>
          <p className="text-xs opacity-80 mt-2">Total comments received</p>
        </div>
      </div>

      {/* Views Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">All Time Views</h3>
          <p className="text-2xl font-bold text-white">{stats.views.allTime.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Unique visitors</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Today</h3>
          <p className="text-2xl font-bold text-green-400">{stats.views.today.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Since midnight</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Yesterday</h3>
          <p className="text-2xl font-bold text-blue-400">{stats.views.yesterday.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Previous day</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">This Month</h3>
          <p className="text-2xl font-bold text-purple-400">{stats.views.thisMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Month to date</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Last Month</h3>
          <p className="text-2xl font-bold text-orange-400">{stats.views.lastMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Previous month</p>
        </div>
      </div>

      {/* Post Status Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Published</h3>
              <p className="text-2xl font-bold text-green-400">{stats.publishedPosts.toLocaleString()}</p>
            </div>
            <div className="text-2xl text-green-500">✅</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Live posts</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Drafts</h3>
              <p className="text-2xl font-bold text-yellow-400">{stats.draftPosts.toLocaleString()}</p>
            </div>
            <div className="text-2xl text-yellow-500">📄</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">In progress</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Scheduled</h3>
              <p className="text-2xl font-bold text-blue-400">{stats.scheduledPosts.toLocaleString()}</p>
            </div>
            <div className="text-2xl text-blue-500">⏰</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Future posts</p>
        </div>
      </div>

      {/* Views Analytics */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Views Analytics</h2>
            <p className="text-sm text-gray-400">Track your post views over time</p>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {(['24h', '7d', '30d', '3m', '12m', 'all'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setViewsTimeframe(timeframe)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  viewsTimeframe === timeframe 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {timeframe.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 flex items-end space-x-1 pt-4 border-t border-gray-700">
          {viewsData.map((value, index) => {
            const maxValue = Math.max(...viewsData)
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-linear-to-t from-purple-500 to-pink-500 rounded-t transition-all duration-300 hover:from-purple-600 hover:to-pink-600"
                  style={{ height: `${height}%`, minHeight: height > 0 ? '2px' : '0' }}
                  title={`${value} views`}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {index + 1}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="text-center mt-4 text-xs text-gray-500">
          Showing {viewsTimeframe} views data (mock data for demonstration)
        </div>
      </div>

      {/* Recent Posts Section */}
      <div className="space-y-8">
        {/* Published Posts */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Published Posts</h2>
            <span className="text-sm text-gray-400">{stats.publishedPosts} posts</span>
          </div>
          
          {stats.publishedPosts > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts
                .filter(post => post.status === 'published')
                .slice(0, 6)
                .map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handleEditPost(post.id)}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 cursor-pointer hover:border-purple-500 transition-all duration-200 group"
                >
                  {post.movie_poster_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.movie_poster_url}
                        alt={post.movie_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {post.movie_title} ({getMovieYear(post.release_date)})
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatDate(post.published_at || post.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPost(post.id)
                        }}
                        className="text-purple-400 hover:text-purple-300 text-sm bg-gray-700 px-2 py-1 rounded z-10 relative ml-2"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    
                    {post.excerpt && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.genre_tags?.slice(0, 2).map((genre, index) => (
                        <span key={index} className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                          {genre}
                        </span>
                      ))}
                    </div>
                    
                    <div 
                      className="flex flex-wrap gap-2 justify-between items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleViewPost(post.id)}
                        className="text-sm text-gray-400 hover:text-white transition px-2 py-1 hover:bg-gray-700 rounded"
                      >
                        View
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnpublishPost(post.id)}
                          className="text-sm text-orange-400 hover:text-orange-300 px-2 py-1 hover:bg-orange-500/20 rounded"
                        >
                          Unpublish
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-sm text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/20 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400">
                You haven't published any reviews yet.
              </p>
            </div>
          )}
        </section>

        {/* Drafts Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Drafts</h2>
            <span className="text-sm text-gray-400">{stats.draftPosts} posts</span>
          </div>
          
          {stats.draftPosts > 0 ? (
            <div className="space-y-3">
              {posts
                .filter(post => post.status === 'draft')
                .slice(0, 5)
                .map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handleEditPost(post.id)}
                  className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-800/50 cursor-pointer hover:border-yellow-700 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="font-semibold text-white">
                        {post.movie_title} ({getMovieYear(post.release_date)})
                      </h3>
                      <p className="text-xs text-gray-400">
                        Last edited {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPost(post.id)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePublishPost(post.id)
                        }}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Publish
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePost(post.id)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
              <p className="text-gray-400">No drafts saved.</p>
            </div>
          )}
        </section>

        {/* Scheduled Posts Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Scheduled Posts</h2>
            <span className="text-sm text-gray-400">{stats.scheduledPosts} posts</span>
          </div>
          
          {stats.scheduledPosts > 0 ? (
            <div className="space-y-3">
              {posts
                .filter(post => post.status === 'scheduled')
                .slice(0, 5)
                .map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => handleEditPost(post.id)}
                  className="bg-blue-900/20 rounded-xl p-4 border border-blue-800/50 cursor-pointer hover:border-blue-700 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <h3 className="font-semibold text-white">
                        {post.movie_title} ({getMovieYear(post.release_date)})
                      </h3>
                      <p className="text-xs text-blue-400">
                        ⏰ Scheduled for {formatDateTime(post.scheduled_for || '')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditPost(post.id)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRevertScheduledPost(post.id)
                        }}
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        Revert
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePost(post.id)
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
              <p className="text-gray-400">No scheduled posts.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}