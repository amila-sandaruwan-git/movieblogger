// components/ReviewsClient.tsx - UPDATED VERSION WITH SEARCH BOX
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, Calendar, Star, Globe, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'
import { useEdgeFix } from '@/hooks/useEdgeFix'

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

interface ReviewsClientProps {
  initialPosts: Post[]
  initialUserProfiles: Record<string, UserProfile>
  allGenres: string[]
  allLanguages: string[]
  allReviewLanguages: string[]
  initialSearch: string
  initialGenre: string
  initialSort: string
  initialYear: string
  initialMovieLanguage: string
  initialReviewLanguage: string
  currentUser?: any // Add current user prop
}

export default function ReviewsClient({
  initialPosts,
  initialUserProfiles,
  allGenres,
  allLanguages,
  allReviewLanguages,
  initialSearch,
  initialGenre,
  initialSort,
  initialYear,
  initialMovieLanguage,
  initialReviewLanguage,
  currentUser
}: ReviewsClientProps) {
  useEdgeFix()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts)
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(initialUserProfiles)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedGenre, setSelectedGenre] = useState(initialGenre)
  const [sortBy, setSortBy] = useState(initialSort)
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedMovieLanguage, setSelectedMovieLanguage] = useState(initialMovieLanguage)
  const [selectedReviewLanguage, setSelectedReviewLanguage] = useState(initialReviewLanguage)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [isClient, setIsClient] = useState(false)
  
  
  // New state for author profile modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Extract years from posts
  const allYears = Array.from(
    new Set(
      posts
        .map(post => post.release_date ? new Date(post.release_date).getFullYear() : null)
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a)

  // Apply filters whenever filter criteria change
  useEffect(() => {
    let filtered = [...posts]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(post =>
        post.movie_title.toLowerCase().includes(query) ||
        post.movie_background_title?.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.director?.toLowerCase().includes(query) ||
        post.cast?.some(actor => actor.toLowerCase().includes(query)) ||
        post.genre_tags?.some(genre => genre.toLowerCase().includes(query))
      )
    }

    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter(post =>
        post.genre_tags?.includes(decodeURIComponent(selectedGenre))
      )
    }

    // Apply year filter
    if (selectedYear) {
      filtered = filtered.filter(post =>
        post.release_date && new Date(post.release_date).getFullYear().toString() === selectedYear
      )
    }

    // Apply movie language filter
    if (selectedMovieLanguage) {
      filtered = filtered.filter(post =>
        post.movie_language === selectedMovieLanguage
      )
    }

    // Apply review language filter
    if (selectedReviewLanguage) {
      filtered = filtered.filter(post =>
        post.review_language === selectedReviewLanguage
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime())
        break
      case 'top-rated':
        filtered.sort((a, b) => (b.tmdb_rating || 0) - (a.tmdb_rating || 0))
        break
      case 'a-z':
        filtered.sort((a, b) => a.movie_title.localeCompare(b.movie_title))
        break
      case 'z-a':
        filtered.sort((a, b) => b.movie_title.localeCompare(a.movie_title))
        break
    }

    setFilteredPosts(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [posts, searchQuery, selectedGenre, sortBy, selectedYear, selectedMovieLanguage, selectedReviewLanguage])

  // Handle filter changes and update URL
  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    
    router.push(`?${newParams.toString()}`, { scroll: false })
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    updateURL({ search: value })
  }

  const handleGenreSelect = (genre: string) => {
    const newGenre = selectedGenre === genre ? '' : genre
    setSelectedGenre(newGenre)
    updateURL({ genre: newGenre })
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    updateURL({ sort })
  }

  const handleYearSelect = (year: string) => {
    const newYear = selectedYear === year ? '' : year
    setSelectedYear(newYear)
    updateURL({ year: newYear })
  }

  const handleMovieLanguageSelect = (language: string) => {
    const newLanguage = selectedMovieLanguage === language ? '' : language
    setSelectedMovieLanguage(newLanguage)
    updateURL({ movieLanguage: newLanguage })
  }

  const handleReviewLanguageSelect = (language: string) => {
    const newLanguage = selectedReviewLanguage === language ? '' : language
    setSelectedReviewLanguage(newLanguage)
    updateURL({ reviewLanguage: newLanguage })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedYear('')
    setSelectedMovieLanguage('')
    setSelectedReviewLanguage('')
    setSortBy('latest')
    router.push('?', { scroll: false })
  }

  // Function to open author profile modal
  const openAuthorProfile = (userId: string) => {
    setSelectedUserId(userId)
    setIsProfileModalOpen(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
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

  // Get movie year
  const getMovieYear = (releaseDate: string) => {
    if (!releaseDate) return 'N/A'
    try {
      return new Date(releaseDate).getFullYear()
    } catch {
      return 'N/A'
    }
  }

  // Format TMDB rating
  const formatTMDbRating = (rating: number | null) => {
    if (!rating || rating === 0) return null
    
    const stars = Math.round((rating / 10) * 5)
    const fullStars = '★'.repeat(stars)
    const emptyStars = '☆'.repeat(5 - stars)
    
    return {
      stars: fullStars + emptyStars,
      numeric: rating.toFixed(1)
    }
  }

  // Get user display name
  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId]
    return profile?.name || 'User'
  }

  // Get user avatar
  const getUserAvatar = (userId: string) => {
    const profile = userProfiles[userId]
    return profile?.avatar_url
  }

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPosts = filteredPosts.slice(startIndex, endIndex)

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Search Box - ADDED THIS SECTION */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search reviews by movie title, director, cast, genre, or description..."
              className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-3 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white text-base shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 px-1">
            Search across movie titles, directors, actors, genres, and review content
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Filter size={16} />
              Filters {showFilters ? '▲' : '▼'}
            </button>
            
            {(selectedGenre || selectedYear || selectedMovieLanguage || selectedReviewLanguage || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X size={16} />
                Clear All
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPosts.length} review{filteredPosts.length !== 1 ? 's' : ''} found
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="top-rated">Top Rated (TMDB)</option>
              <option value="a-z">A → Z</option>
              <option value="z-a">Z → A</option>
            </select>
          </div>
        </div>

        {/* Filters Dropdown */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Genre Filter */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Genre</h3>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => handleGenreSelect(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedGenre === genre
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year Filter */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Release Year</h3>
                <div className="flex flex-wrap gap-2">
                  {allYears.slice(0, 8).map(year => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year.toString())}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedYear === year.toString()
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              {/* Movie Language Filter */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Movie Language</h3>
                <select
                  value={selectedMovieLanguage}
                  onChange={(e) => handleMovieLanguageSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="">All Languages</option>
                  {allLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Review Language Filter */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Review Language</h3>
                <select
                  value={selectedReviewLanguage}
                  onChange={(e) => handleReviewLanguageSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="">All Review Languages</option>
                  {allReviewLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedGenre || selectedYear || selectedMovieLanguage || selectedReviewLanguage || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchQuery && (
              <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm dark:bg-gray-700 dark:text-gray-300">
                <Search size={12} />
                Search: "{searchQuery}"
                <button
                  onClick={() => handleSearch('')}
                  className="ml-1 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedGenre && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200">
                Genre: {decodeURIComponent(selectedGenre)}
                <button
                  onClick={() => handleGenreSelect('')}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedYear && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm dark:bg-green-900 dark:text-green-200">
                Year: {selectedYear}
                <button
                  onClick={() => handleYearSelect('')}
                  className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedMovieLanguage && (
              <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm dark:bg-purple-900 dark:text-purple-200">
                Movie Language: {selectedMovieLanguage}
                <button
                  onClick={() => handleMovieLanguageSelect('')}
                  className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedReviewLanguage && (
              <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm dark:bg-orange-900 dark:text-orange-200">
                Review Language: {selectedReviewLanguage}
                <button
                  onClick={() => handleReviewLanguageSelect('')}
                  className="ml-1 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews Grid */}
      {currentPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentPosts.map((post) => {
              const userName = getUserDisplayName(post.user_id)
              const userAvatar = getUserAvatar(post.user_id)
              const tmdbRating = formatTMDbRating(post.tmdb_rating)
              const movieYear = getMovieYear(post.release_date)
              
              return (
                <div key={post.id} className="group cursor-pointer">
                  <Link href={`/post/${post.id}`}>
                    <div className="relative bg-gray-100 rounded-lg aspect-3/4 mb-4 flex items-center justify-center overflow-hidden dark:bg-gray-800 group-hover:opacity-95 transition-opacity duration-300">
                      {post.movie_poster_url ? (
                        <>
                          <img 
                            src={post.movie_poster_url} 
                            alt={post.movie_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {tmdbRating && (
                            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center space-x-1.5">
                              <span className="text-yellow-400 text-sm">★</span>
                              <span className="text-sm font-semibold">{tmdbRating.numeric}</span>
                              <span className="text-xs opacity-75">TMDB</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="text-white text-center px-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              <h3 className="text-lg font-bold mb-1">{post.movie_title}</h3>
                              {movieYear && movieYear !== 'N/A' && (
                                <p className="text-sm opacity-90">({movieYear})</p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center dark:bg-gray-600">
                            <span className="text-2xl">🎬</span>
                          </div>
                          <h3 className="font-bold text-lg mb-2 dark:text-white">{post.movie_title}</h3>
                          {tmdbRating && (
                            <div className="flex items-center justify-center space-x-1 mt-2">
                              <span className="text-yellow-500">{tmdbRating.stars}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {tmdbRating.numeric}/10
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="space-y-2">
                    {post.movie_background_title && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {post.movie_background_title}
                      </p>
                    )}
                    
                    <Link href={`/post/${post.id}`}>
                      <h3 className="font-bold text-lg dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 line-clamp-1">
                        {post.movie_title}
                      </h3>
                    </Link>
                    
                    {!post.movie_poster_url && tmdbRating && (
                      <div className="flex items-center">
                        <div className="text-yellow-500 flex">
                          {tmdbRating.stars}
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {tmdbRating.numeric}/10
                        </span>
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          TMDB
                        </span>
                      </div>
                    )}
                    
                    <p className="text-gray-600 text-sm leading-relaxed dark:text-gray-300 line-clamp-2">
                      {post.excerpt || 'No description available'}
                    </p>
                    
                    {/* Publisher Info - Clickable to open profile modal */}
                    <div 
                      className="flex items-center pt-2 border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openAuthorProfile(post.user_id)
                      }}
                    >
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={userName}
                          className="w-6 h-6 rounded-full mr-2 border border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-purple-600 rounded-full mr-2 flex items-center justify-center text-xs text-white font-medium">
                          {userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                          {userName}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(post.published_at || post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {post.genre_tags && post.genre_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {post.genre_tags.slice(0, 2).map((genre, index) => (
                          <Link
                            key={index}
                            href={`/reviews?genre=${encodeURIComponent(genre)}`}
                            className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {genre}
                          </Link>
                        ))}
                        {post.genre_tags.length > 2 && (
                          <Link
                            href={`/reviews?genre=${encodeURIComponent(post.genre_tags[0])}`}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            +{post.genre_tags.length - 2} more
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4 text-gray-400">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No reviews found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || selectedGenre || selectedYear || selectedMovieLanguage || selectedReviewLanguage
              ? 'Try adjusting your filters'
              : 'No reviews available yet'}
          </p>
          {(searchQuery || selectedGenre || selectedYear || selectedMovieLanguage || selectedReviewLanguage) && (
            <button
              onClick={clearAllFilters}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-300"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Author Profile Modal */}
      {isProfileModalOpen && selectedUserId && (
        <AuthorProfileModal
          userId={selectedUserId}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  )
}