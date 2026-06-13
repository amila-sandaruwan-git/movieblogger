// app/dashboard/posts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, Edit, Trash2, CheckCircle, XCircle, Clock, Calendar, Star, Film, X } from 'lucide-react'

interface Post {
  id: number
  content: string
  excerpt: string
  rating: number | null
  rating_scale: '5' | '10' | null
  status: 'published' | 'draft' | 'scheduled' | 'private'
  created_at: string
  updated_at: string
  movie_title: string
  movie_background_title: string
  movie_poster_url: string | null
  movie_backdrop_url: string | null
  release_date: string
  director: string | null
  cast: string[] | null
  genre_tags: string[] | null
  tags: string[] | null
  scheduled_for: string | null
  published_at: string
  review_language: string
  movie_language: string | null
  tmdb_rating: number | null
  tmdb_id: number | null
  duration: number | null
  trailer_url: string | null
  comments_enabled: boolean
  user_id: string
  view_count: number
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled' | 'private'>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedPosts, setSelectedPosts] = useState<number[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [posts, searchTerm, statusFilter, languageFilter, sortBy, sortOrder])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        showNotification('error', 'Authentication error. Please log in again.')
        return
      }
      
      if (!user) {
        console.error('No user found')
        showNotification('error', 'You must be logged in to view posts')
        return
      }

      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        showNotification('error', 'Failed to load posts')
        return
      }

      setPosts(postsData || [])

    } catch (error) {
      console.error('Error fetching posts:', error)
      showNotification('error', 'Failed to load posts')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortPosts = () => {
    let filtered = posts.filter(post => {
      // Status filter
      if (statusFilter !== 'all' && post.status !== statusFilter) {
        return false
      }

      // Language filter
      if (languageFilter !== 'all' && post.review_language !== languageFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          post.movie_title.toLowerCase().includes(searchLower) ||
          post.movie_background_title?.toLowerCase().includes(searchLower) ||
          post.genre_tags?.some(genre => genre.toLowerCase().includes(searchLower)) ||
          post.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower) ||
          post.review_language?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })

    // Sort posts
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.updated_at || a.created_at).getTime()
          bValue = new Date(b.updated_at || b.created_at).getTime()
          break
        case 'title':
          aValue = a.movie_title.toLowerCase()
          bValue = b.movie_title.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'desc') {
        return bValue - aValue
      } else {
        return aValue - bValue
      }
    })

    setFilteredPosts(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'private':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusText = (status: Post['status'], scheduledFor: string | null) => {
    if (status === 'scheduled' && scheduledFor) {
      return `Scheduled (${formatDateTime(scheduledFor)})`
    }
    
    switch (status) {
      case 'published':
        return 'Published'
      case 'draft':
        return 'Draft'
      case 'scheduled':
        return 'Scheduled'
      case 'private':
        return 'Private'
      default:
        return status
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Single post actions
  const handleEditPost = (postId: number) => {
    router.push(`/dashboard/edit-post/${postId}`)
  }

  const handlePreviewPost = (post: Post) => {
    setPreviewPost(post)
    setShowPreviewModal(true)
  }

  const confirmDeletePost = (postId: number) => {
    setPostToDelete(postId)
    setShowDeleteConfirm(true)
  }

  const handleDeletePost = async () => {
    if (!postToDelete) return

    setIsDeleting(true)

    try {
      console.log('Starting delete process for post:', postToDelete)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error:', userError)
        showNotification('error', 'Authentication error. Please log in again.')
        return
      }
      
      if (!user) {
        showNotification('error', 'You must be logged in to delete posts')
        return
      }

      console.log('User authenticated:', user.id)

      // Step 1: Delete reactions first (this is the main trigger that causes issues)
      const { error: reactionsError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postToDelete)
      
      if (reactionsError) {
        console.error('Error deleting reactions:', reactionsError)
        showNotification('error', `Failed to delete reactions: ${reactionsError.message}`)
        return
      }

      // Step 2: Delete reaction stats
      const { error: statsError } = await supabase
        .from('post_reaction_stats')
        .delete()
        .eq('post_id', postToDelete)
      
      if (statsError) {
        console.error('Error deleting reaction stats:', statsError)
        // Continue anyway, stats might not exist
      }

      // Step 3: Delete comments
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('post_id', postToDelete)
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError)
        // Continue anyway
      }

      // Step 4: Delete views
      const { error: viewsError } = await supabase
        .from('post_views')
        .delete()
        .eq('post_id', postToDelete)
      
      if (viewsError) {
        console.error('Error deleting views:', viewsError)
        // Continue anyway
      }

      // Step 5: Finally delete the post
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete)
        .eq('user_id', user.id)

      if (postError) {
        console.error('Error deleting post:', postError)
        showNotification('error', `Failed to delete post: ${postError.message}`)
        return
      }

      console.log('Post deleted successfully')

      // Update local state
      setPosts(posts.filter(post => post.id !== postToDelete))
      showNotification('success', 'Post deleted successfully')
      
    } catch (error: any) {
      console.error('Error deleting post:', error)
      showNotification('error', error.message || 'Failed to delete post')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setPostToDelete(null)
    }
  }

  const handlePublishPost = async (postId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to publish posts')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          visibility: 'public'
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.map(post => 
        post.id === postId ? { ...post, status: 'published' } : post
      ))
      showNotification('success', 'Post published successfully')
    } catch (error) {
      console.error('Error publishing post:', error)
      showNotification('error', 'Failed to publish post')
    }
  }

  const handleUnpublishPost = async (postId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to unpublish posts')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'draft',
          visibility: 'private'
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.map(post => 
        post.id === postId ? { ...post, status: 'draft' } : post
      ))
      showNotification('success', 'Post reverted to draft')
    } catch (error) {
      console.error('Error unpublishing post:', error)
      showNotification('error', 'Failed to unpublish post')
    }
  }

  const handleRevertScheduledPost = async (postId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to revert posts')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'draft',
          scheduled_for: null
        })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.map(post => 
        post.id === postId ? { ...post, status: 'draft', scheduled_for: null } : post
      ))
      showNotification('success', 'Post reverted to draft')
    } catch (error) {
      console.error('Error reverting scheduled post:', error)
      showNotification('error', 'Failed to revert scheduled post')
    }
  }

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPosts(filteredPosts.map(post => post.id))
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectPost = (postId: number, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId])
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return
    
    setIsDeleting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to delete posts')
        return
      }

      let successCount = 0
      let errorCount = 0

      // Delete each post individually to ensure proper cleanup
      for (const postId of selectedPosts) {
        try {
          // Step 1: Delete reactions
          await supabase.from('post_reactions').delete().eq('post_id', postId)
          
          // Step 2: Delete reaction stats
          await supabase.from('post_reaction_stats').delete().eq('post_id', postId)
          
          // Step 3: Delete comments
          await supabase.from('comments').delete().eq('post_id', postId)
          
          // Step 4: Delete views
          await supabase.from('post_views').delete().eq('post_id', postId)
          
          // Step 5: Delete the post
          const { error: postError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id)

          if (postError) {
            console.error(`Error deleting post ${postId}:`, postError)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Error processing post ${postId}:`, err)
          errorCount++
        }
      }

      // Update local state by removing all selected posts
      setPosts(posts.filter(post => !selectedPosts.includes(post.id)))
      setSelectedPosts([])
      
      if (successCount > 0) {
        showNotification('success', `${successCount} post${successCount > 1 ? 's' : ''} deleted successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
      } else if (errorCount > 0) {
        showNotification('error', `Failed to delete ${errorCount} post${errorCount > 1 ? 's' : ''}`)
      }
      
    } catch (error: any) {
      console.error('Error bulk deleting posts:', error)
      showNotification('error', error.message || 'Failed to delete posts')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleBulkPublish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to publish posts')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          visibility: 'public'
        })
        .in('id', selectedPosts)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.map(post => 
        selectedPosts.includes(post.id) ? { ...post, status: 'published' } : post
      ))
      setSelectedPosts([])
      showNotification('success', `${selectedPosts.length} posts published`)
    } catch (error) {
      console.error('Error bulk publishing posts:', error)
      showNotification('error', 'Failed to publish posts')
    }
  }

  const handleBulkUnpublish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('error', 'You must be logged in to unpublish posts')
        return
      }

      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'draft',
          visibility: 'private'
        })
        .in('id', selectedPosts)
        .eq('user_id', user.id)

      if (error) throw error

      setPosts(posts.map(post => 
        selectedPosts.includes(post.id) ? { ...post, status: 'draft' } : post
      ))
      setSelectedPosts([])
      showNotification('success', `${selectedPosts.length} posts unpublished`)
    } catch (error) {
      console.error('Error bulk unpublishing posts:', error)
      showNotification('error', 'Failed to unpublish posts')
    }
  }

  // Get unique languages for filter
  const getUniqueLanguages = () => {
    const languages = posts
      .map(post => post.review_language)
      .filter(lang => lang)
      .filter((value, index, self) => self.indexOf(value) === index)
    
    return ['all', ...languages]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">All Posts</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage all your movie reviews in one place
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Posts
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by movie title, genres, or tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Language
            </label>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            >
              <option value="all">All Languages</option>
              {getUniqueLanguages().slice(1).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="date">Date</option>
                <option value="title">Movie Title</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-sm"
                title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-700 dark:text-blue-300 text-sm">
                {selectedPosts.length} posts selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkPublish}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish
                </button>
                <button
                  onClick={handleBulkUnpublish}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedPosts([])}
              disabled={isDeleting}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      disabled={isDeleting}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Movie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">
                    Actions
                  </th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isDeleting}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => !isDeleting && handleEditPost(post.id)}>
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0 w-10 h-14 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                          {post.movie_poster_url ? (
                            <img
                              src={post.movie_poster_url}
                              alt={post.movie_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              🎬
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {post.movie_title}
                          </div>
                          {post.movie_background_title && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {post.movie_background_title}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                        {getStatusText(post.status, post.scheduled_for)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreviewPost(post)}
                          disabled={isDeleting}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditPost(post.id)}
                          disabled={isDeleting}
                          className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        {post.status === 'scheduled' ? (
                          <button
                            onClick={() => handleRevertScheduledPost(post.id)}
                            disabled={isDeleting}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revert to Draft"
                          >
                            <Clock size={18} />
                          </button>
                        ) : post.status === 'published' ? (
                          <button
                            onClick={() => handleUnpublishPost(post.id)}
                            disabled={isDeleting}
                            className="p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revert to Draft"
                          >
                            <XCircle size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishPost(post.id)}
                            disabled={isDeleting}
                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Publish"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => confirmDeletePost(post.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || languageFilter !== 'all'
                ? "No posts match your current filters."
                : "You haven't created any posts yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Single Post */}
      {showDeleteConfirm && postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this post? This action cannot be undone. All related data (comments, reactions, bookmarks, views) will also be deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPostToDelete(null)
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPosts.length > 0 && !postToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''}? 
              This action cannot be undone. All related data (comments, reactions, bookmarks, views) will also be deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedPosts([])
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : `Delete ${selectedPosts.length} Post${selectedPosts.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  {previewPost.movie_poster_url ? (
                    <img
                      src={previewPost.movie_poster_url}
                      alt={previewPost.movie_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🎬
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {previewPost.movie_title}
                  </h2>
                  {previewPost.movie_background_title && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {previewPost.movie_background_title}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Movie Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {previewPost.release_date && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={16} />
                    <span>{new Date(previewPost.release_date).getFullYear()}</span>
                  </div>
                )}
                {previewPost.duration && previewPost.duration > 0 && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Clock size={16} />
                    <span>{previewPost.duration} min</span>
                  </div>
                )}
                {previewPost.review_language && (
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <span>🌐</span>
                    <span>{previewPost.review_language}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(previewPost.status)}`}>
                    {getStatusText(previewPost.status, previewPost.scheduled_for)}
                  </span>
                </div>
              </div>

              {/* Ratings */}
              {(previewPost.rating || previewPost.tmdb_rating) && (
                <div className="flex gap-4 pt-2">
                  {previewPost.rating && (
                    <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {previewPost.rating.toFixed(1)}/{previewPost.rating_scale === '10' ? 10 : 5}
                      </span>
                      <span className="text-xs text-gray-500">(Reviewer)</span>
                    </div>
                  )}
                  {previewPost.tmdb_rating && (
                    <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                      <Film size={16} className="text-blue-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {previewPost.tmdb_rating.toFixed(1)}/10
                      </span>
                      <span className="text-xs text-gray-500">(TMDB)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Genres */}
              {previewPost.genre_tags && previewPost.genre_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewPost.genre_tags.map((genre, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                    >
                      #{genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Excerpt */}
              {previewPost.excerpt && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                    "{previewPost.excerpt}"
                  </p>
                </div>
              )}

              {/* Content Preview */}
              {previewPost.content && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Preview Content</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ 
                      __html: previewPost.content.length > 300 
                        ? previewPost.content.substring(0, 300) + '...' 
                        : previewPost.content 
                    }} />
                  </div>
                  {previewPost.content.length > 300 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Preview shows first 300 characters. Edit to see full content.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    handleEditPost(previewPost.id)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Edit Post
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}