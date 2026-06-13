// app/dashboard/new-post/page.tsx - UPDATED for dashboard layout
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { tmdbClient, TMDBMovie } from '@/lib/tmdb'
import debounce from 'lodash/debounce'

// Import TinyMCE editor with no SSR
const TinyMceEditor = dynamic(() => import('@/components/TinyMceEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 border border-gray-300 rounded-lg p-4 dark:border-gray-600">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 dark:bg-gray-700"></div>
        <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
      </div>
    </div>
  )
})

interface PostFormData {
  content: string
  excerpt: string
  movie_title: string
  movie_background_title: string
  movie_poster_url: string
  movie_backdrop_url: string
  release_date: string
  director: string
  cast: string[]
  genre_tags: string[]
  duration_hours: number
  duration_minutes: number
  review_language: string
  trailer_url: string
  tags: string[]
  status: 'draft' | 'published' | 'private' | 'scheduled'
  visibility: 'public' | 'private'
  comments_enabled: boolean
  scheduled_for: string
  published_at: string
  imdb_id?: string
  tmdb_id?: number
  tmdb_rating?: number
  movie_language?: string
}

export default function NewPostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null)
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false)
  
  const [formData, setFormData] = useState<PostFormData>({
    content: '',
    excerpt: '',
    movie_title: '',
    movie_background_title: '',
    movie_poster_url: '',
    movie_backdrop_url: '',
    release_date: '',
    director: '',
    cast: [],
    genre_tags: [],
    duration_hours: 0,
    duration_minutes: 0,
    review_language: '',
    trailer_url: '',
    tags: [],
    status: 'draft',
    visibility: 'public',
    comments_enabled: true,
    scheduled_for: '',
    published_at: new Date().toISOString(),
    tmdb_id: undefined,
    tmdb_rating: undefined,
    movie_language: ''
  })

  const [currentCast, setCurrentCast] = useState('')
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [moviePosterFile, setMoviePosterFile] = useState<File | null>(null)
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [movieBackdropFile, setMovieBackdropFile] = useState<File | null>(null)
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  // Genre options
  const genreOptions = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Biography', 'Family', 'History', 'Musical', 'Sport', 'War', 'Western']
  
  // Review language options (user can write review in these languages)
  const reviewLanguageOptions = ['English', 'Sinhala', 'Tamil']

  // Check if post is scheduled
  const isScheduled = formData.scheduled_for && new Date(formData.scheduled_for) > new Date()

  // Debounced search function
  const searchMovies = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      setIsSearching(true)
      try {
        const results = await tmdbClient.searchMovies(query)
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (error) {
        console.error('Error searching movies:', error)
        setError('Failed to search movies')
      } finally {
        setIsSearching(false)
      }
    }, 500),
    []
  )

  // Handle movie title change with auto-search
  const handleMovieTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, movie_title: value }))
    searchMovies(value)
  }

  // Select a movie from search results
  const handleSelectMovie = async (movie: TMDBMovie) => {
    setSelectedMovie(movie)
    
    // Get full movie details
    try {
      const fullDetails = await tmdbClient.getMovieDetails(movie.id)
      
      if (fullDetails) {
        // Extract director from crew
        const director = fullDetails.credits?.crew?.find(
          person => person.job === 'Director'
        )?.name || ''

        // Extract main cast (first 10 actors)
        const cast = fullDetails.credits?.cast?.slice(0, 10).map(
          actor => actor.name
        ) || []

        // Get movie original language
        const movieLanguage = fullDetails.original_language || ''
        
        // Try to get the full language name from spoken_languages
        let movieLanguageName = movieLanguage
        if (fullDetails.spoken_languages && fullDetails.spoken_languages.length > 0) {
          const lang = fullDetails.spoken_languages.find(
            lang => lang.iso_639_1 === movieLanguage
          )
          if (lang) {
            movieLanguageName = lang.english_name || lang.name || movieLanguage
          }
        }
        
        // Get movie trailer from TMDB
        let trailerUrl = ''
        if (fullDetails.videos?.results) {
          const trailer = fullDetails.videos.results.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
          )
          if (trailer) {
            trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`
          }
        }
        
        // Update duration
        const duration = tmdbClient.formatRuntime(fullDetails.runtime)
        
        // Get TMDB rating
        const tmdbRating = fullDetails.vote_average

        // Get backdrop URL from TMDB
        const backdropUrl = tmdbClient.getBackdropUrl(fullDetails.backdrop_path)

        setFormData(prev => ({
          ...prev,
          movie_title: movie.title,
          movie_background_title: movie.original_title !== movie.title ? movie.original_title : '',
          movie_poster_url: tmdbClient.getPosterUrl(movie.poster_path),
          movie_backdrop_url: backdropUrl,
          release_date: movie.release_date || '',
          genre_tags: fullDetails.genres?.map(genre => genre.name) || [],
          imdb_id: fullDetails.imdb_id || `tt${movie.id}`,
          director,
          cast,
          duration_hours: duration.hours,
          duration_minutes: duration.minutes,
          excerpt: fullDetails.overview || prev.excerpt,
          movie_language: movieLanguageName,
          trailer_url: trailerUrl,
          tmdb_id: movie.id,
          tmdb_rating: tmdbRating,
        }))
      }
    } catch (error) {
      console.error('Error fetching movie details:', error)
      setError('Failed to fetch complete movie details')
    }

    setShowSearchResults(false)
    setSearchResults([])
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Close search results
      if (!target.closest('.movie-search-container')) {
        setShowSearchResults(false)
      }
      
      // Close preview dropdown
      if (!target.closest('.preview-dropdown-container')) {
        setShowPreviewDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Handle input changes
  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle content change from rich text editor
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

  // Handle array fields (cast, genres, tags)
  const handleAddToArray = (field: 'cast' | 'genre_tags' | 'tags', currentValue: string, setCurrentValue: (value: string) => void) => {
    if (currentValue.trim() && !formData[field].includes(currentValue.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], currentValue.trim()]
      }))
      setCurrentValue('')
    }
  }

  const handleRemoveFromArray = (field: 'cast' | 'genre_tags' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Handle movie poster upload
  const handlePosterUpload = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_poster.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('movie-posters')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('movie-posters')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading poster:', error)
      setError('Failed to upload movie poster')
      return null
    }
  }

  // Handle movie backdrop upload
  const handleBackdropUpload = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_backdrop.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('movie-backdrops')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('movie-backdrops')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading backdrop:', error)
      setError('Failed to upload movie backdrop')
      return null
    }
  }

  // Handle form submission
  const handleSubmit = async (action: 'publish' | 'draft' | 'preview' | 'revert') => {
    if (action === 'preview') {
      setSuccess('Preview functionality would open in a new tab')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.movie_title.trim()) {
        throw new Error('Movie title is required')
      }
      if (!formData.content.trim()) {
        throw new Error('Post content is required')
      }
      if (!formData.review_language.trim()) {
        throw new Error('Review language is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Upload movie poster if selected
      let finalPosterUrl = formData.movie_poster_url
      if (moviePosterFile) {
        const uploadedUrl = await handlePosterUpload(moviePosterFile)
        if (uploadedUrl) {
          finalPosterUrl = uploadedUrl
        }
      }

      // Upload movie backdrop if selected
      let finalBackdropUrl = formData.movie_backdrop_url
      if (movieBackdropFile) {
        const uploadedUrl = await handleBackdropUpload(movieBackdropFile)
        if (uploadedUrl) {
          finalBackdropUrl = uploadedUrl
        }
      }

      // Calculate total duration in minutes
      const totalDuration = (formData.duration_hours * 60) + formData.duration_minutes

      // Determine status based on action and schedule
      let finalStatus = action === 'publish' ? 'published' : 'draft'
      let finalVisibility = formData.visibility
      let publishedAt = null
      let scheduledFor = null

      if (action === 'publish') {
        if (formData.scheduled_for && new Date(formData.scheduled_for) > new Date()) {
          finalStatus = 'scheduled'
          scheduledFor = formData.scheduled_for
          finalVisibility = 'public'
        } else {
          publishedAt = new Date().toISOString()
          finalVisibility = 'public'
        }
      } else if (action === 'revert') {
        finalStatus = 'draft'
        scheduledFor = null
      }

      // Prepare data for submission
      const postData = {
        content: formData.content,
        excerpt: formData.excerpt || null,
        movie_title: formData.movie_title,
        movie_background_title: formData.movie_background_title || null,
        movie_poster_url: finalPosterUrl || null,
        movie_backdrop_url: finalBackdropUrl || null,
        release_date: formData.release_date || null,
        director: formData.director || null,
        cast: formData.cast.length > 0 ? formData.cast : null,
        genre_tags: formData.genre_tags.length > 0 ? formData.genre_tags : null,
        duration: totalDuration || null,
        review_language: formData.review_language || null,
        movie_language: formData.movie_language || null,
        trailer_url: formData.trailer_url || null,
        imdb_id: formData.imdb_id || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        status: finalStatus,
        visibility: finalVisibility,
        comments_enabled: formData.comments_enabled,
        published_at: publishedAt,
        scheduled_for: scheduledFor,
        user_id: user.id,
        tmdb_id: formData.tmdb_id || null,
        tmdb_rating: formData.tmdb_rating || null
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single()

      if (error) throw error

      let successMessage = ''
      if (finalStatus === 'scheduled') {
        const scheduledDate = new Date(scheduledFor!).toLocaleString()
        successMessage = `Post scheduled for ${scheduledDate}`
      } else if (action === 'publish') {
        successMessage = 'Post published successfully!'
      } else {
        successMessage = 'Post saved as draft successfully!'
      }

      setSuccess(successMessage)
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Error saving post:', error)
      setError(error.message || 'Failed to save post')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle poster file selection
  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMoviePosterFile(file)
      setPosterPreview(URL.createObjectURL(file))
    }
  }

  // Handle backdrop file selection
  const handleBackdropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setMovieBackdropFile(file)
      setBackdropPreview(URL.createObjectURL(file))
    }
  }

  // Format duration display
  const formatDuration = () => {
    const hours = formData.duration_hours
    const minutes = formData.duration_minutes
    if (hours === 0 && minutes === 0) return '0min'
    if (hours === 0) return `${minutes}min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}min`
  }

  // Format scheduled date
  const formatScheduledDate = () => {
    if (!formData.scheduled_for) return ''
    return new Date(formData.scheduled_for).toLocaleString()
  }

  // Instant navigation back to dashboard
  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create New Post
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
          Create a new movie review or article. Type a movie title to automatically fetch details.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Post Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            {/* Movie Title with Auto-search */}
            <div className="movie-search-container relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Title *
                <span className="text-xs text-gray-500 ml-2">(Start typing to search TMDb)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.movie_title}
                  onChange={(e) => handleMovieTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm md:text-base"
                  placeholder="Enter movie title to auto-fetch details"
                  required
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      onClick={() => handleSelectMovie(movie)}
                    >
                      {movie.poster_path && (
                        <img
                          src={tmdbClient.getPosterUrl(movie.poster_path, 'w92')}
                          alt={movie.title}
                          className="w-10 h-15 object-cover rounded mr-3"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {movie.title}
                          {movie.release_date && (
                            <span className="text-gray-500 text-sm ml-2">
                              ({movie.release_date.split('-')[0]})
                            </span>
                          )}
                        </div>
                        {movie.original_title !== movie.title && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {movie.original_title}
                          </div>
                        )}
                        {movie.vote_average > 0 && (
                          <div className="text-xs text-yellow-500 flex items-center mt-1">
                            ★ {movie.vote_average.toFixed(1)}/10
                            <span className="text-gray-500 ml-2">(TMDB)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Background Title
              </label>
              <input
                type="text"
                value={formData.movie_background_title}
                onChange={(e) => handleInputChange('movie_background_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm md:text-base"
                placeholder="Background title or subtitle"
              />
            </div>
          </div>
        </section>

        {/* Post Content */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Post Content</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Excerpt / Short Description
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm md:text-base"
                placeholder="Brief description of your review"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Review Content *
              </label>
              <TinyMceEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Write your detailed review here..."
              />
            </div>
          </div>
        </section>

        {/* Movie Information */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Movie Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Movie Poster Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Poster
                {formData.movie_poster_url && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    ✓ Fetched from TMDb
                  </span>
                )}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-24 h-36 sm:w-32 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:border-gray-600 shrink-0 overflow-hidden">
                  {posterPreview ? (
                    <img src={posterPreview} alt="Poster preview" className="w-full h-full object-cover" />
                  ) : formData.movie_poster_url ? (
                    <img src={formData.movie_poster_url} alt="TMDb poster" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center">No poster</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="poster-upload"
                    accept="image/*"
                    onChange={handlePosterFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="poster-upload"
                    className="inline-block px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-sm dark:bg-white dark:text-black dark:hover:bg-gray-300"
                  >
                    Upload Custom Poster
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recommended: 300x450px. Poster is auto-fetched from TMDb.
                  </p>
                </div>
              </div>
            </div>

            {/* Movie Backdrop/Banner Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Banner/Backdrop
                {formData.movie_backdrop_url && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    ✓ Fetched from TMDb
                  </span>
                )}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-48 h-28 sm:w-64 sm:h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:border-gray-600 shrink-0 overflow-hidden">
                  {backdropPreview ? (
                    <img src={backdropPreview} alt="Backdrop preview" className="w-full h-full object-cover" />
                  ) : formData.movie_backdrop_url ? (
                    <img src={formData.movie_backdrop_url} alt="TMDb backdrop" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center">No backdrop</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="backdrop-upload"
                    accept="image/*"
                    onChange={handleBackdropFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="backdrop-upload"
                    className="inline-block px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-sm dark:bg-white dark:text-black dark:hover:bg-gray-300"
                  >
                    Upload Custom Banner
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recommended: 1280x720px. Banner is auto-fetched from TMDb.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Release Date
              </label>
              <input
                type="date"
                value={formData.release_date}
                onChange={(e) => handleInputChange('release_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm md:text-base"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Director
              </label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => handleInputChange('director', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm md:text-base"
                placeholder="Director name (auto-filled from TMDb)"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cast / Actors
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={currentCast}
                    onChange={(e) => setCurrentCast(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddToArray('cast', currentCast, setCurrentCast)
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    placeholder="Add cast member or auto-fetch from TMDb"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddToArray('cast', currentCast, setCurrentCast)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.cast.map((actor, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center dark:bg-blue-900 dark:text-blue-200">
                      {actor}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('cast', index)}
                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genre Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <select
                    value={currentGenre}
                    onChange={(e) => setCurrentGenre(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="">Select genre</option>
                    {genreOptions.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddToArray('genre_tags', currentGenre, setCurrentGenre)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.genre_tags.map((genre, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center dark:bg-green-900 dark:text-green-200">
                      {genre}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromArray('genre_tags', index)}
                        className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={formData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    placeholder="0"
                    readOnly
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    placeholder="0"
                    readOnly
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Duration: {formatDuration()} (auto-calculated from TMDb)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Language (from TMDB)
              </label>
              <input
                type="text"
                value={formData.movie_language || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white text-sm"
                readOnly
                placeholder="Auto-filled from TMDb"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Language *
              </label>
              <select
                value={formData.review_language}
                onChange={(e) => handleInputChange('review_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                required
              >
                <option value="">Select language for your review</option>
                {reviewLanguageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose the language you're writing your review in
              </p>
            </div>
          </div>
        </section>

        {/* Trailer Section */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Trailer</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              YouTube Trailer URL
            </label>
            <input
              type="url"
              value={formData.trailer_url}
              onChange={(e) => handleInputChange('trailer_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Trailer is auto-fetched from TMDb. You can override it with a custom URL.
            </p>
          </div>
        </section>

        {/* Tags Only (Removed Categories) */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Tags</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Post Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddToArray('tags', currentTag, setCurrentTag)
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="Add tag for your post"
                />
                <button
                  type="button"
                  onClick={() => handleAddToArray('tags', currentTag, setCurrentTag)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs flex items-center dark:bg-orange-900 dark:text-orange-200">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromArray('tags', index)}
                      className="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-300 dark:hover:text-orange-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Post Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'private')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule Publishing
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_for}
                onChange={(e) => handleInputChange('scheduled_for', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to publish immediately
              </p>
              {isScheduled && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  ⏰ Review will be published at {formatScheduledDate()}
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="comments-enabled"
                checked={formData.comments_enabled}
                onChange={(e) => handleInputChange('comments_enabled', e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black dark:focus:ring-white dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="comments-enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable comments
              </label>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          
          {/* Preview Dropdown Button */}
          <div className="preview-dropdown-container relative">
            <button
              type="button"
              onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
              className="px-4 py-2 md:px-6 md:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 flex items-center"
            >
              Preview
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showPreviewDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  type="button"
                  onClick={() => {
                    handleSubmit('preview')
                    setShowPreviewDropdown(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Preview Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSubmit('draft')
                    setShowPreviewDropdown(false)
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Save Draft
                </button>
                {isScheduled && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSubmit('revert')
                      setShowPreviewDropdown(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Revert to Draft
                  </button>
                )}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-4 py-2 md:px-6 md:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            type="button"
            onClick={() => handleSubmit('publish')}
            disabled={isSubmitting}
            className="px-4 py-2 md:px-6 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting 
              ? 'Publishing...' 
              : isScheduled 
                ? 'Schedule Publish' 
                : 'Publish Now'
            }
          </button>
        </div>
      </div>
    </div>
  )
}