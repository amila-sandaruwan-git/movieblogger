// components/ReviewsClient.tsx

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'

interface Post {
  id: string
  movie_title: string
  movie_poster_url: string
  release_date: string
  genre_tags: string[]
  review_language: string
  tmdb_rating: number | null
  excerpt: string
  published_at: string
  created_at: string
  user_id: string
  movie_background_title: string
}

interface Props {
  initialPosts: Post[]
  initialUserProfiles: Record<string, any>
  allGenres: string[]
  allReviewLanguages: string[]
  initialSearch: string
  initialGenre: string
  initialSort: string
  currentUser: any
}

export default function ReviewsClient({
  initialPosts, initialUserProfiles, allGenres, allReviewLanguages,
  initialSearch, initialGenre, initialSort, currentUser,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams() // <--- MOVED TO THE TOP

  const [posts] = useState<Post[]>(initialPosts)
  const [profiles] = useState(initialUserProfiles)
  const [search, setSearch] = useState(initialSearch)
  const [genre, setGenre] = useState(initialGenre)
  const [language, setLanguage] = useState(searchParams.get('reviewLanguage') || '') // <--- NOW WORKS
  const [sort, setSort] = useState(initialSort)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  
  const itemsPerPage = 12

  const updateURL = (k: string, v: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (v) p.set(k, v); else p.delete(k)
    router.push(`?${p.toString()}`, { scroll: false })
  }

  const formatLanguage = (lang: string) => {
    if (lang === 'Sinhala') return 'සිංහල'
    if (lang === 'Tamil') return 'தமிழ்'
    return lang
  }

  const filtered = useMemo(() => {
    let list = [...posts]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.movie_title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.genre_tags?.some(g => g.toLowerCase().includes(q))
      )
    }
    if (genre) list = list.filter(p => p.genre_tags?.includes(decodeURIComponent(genre)))
    if (language) list = list.filter(p => p.review_language === language)
    
    switch (sort) {
      case 'latest': list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()); break
      case 'oldest': list.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime()); break
      case 'top-rated': list.sort((a, b) => (b.tmdb_rating || 0) - (a.tmdb_rating || 0)); break
      case 'a-z': list.sort((a, b) => a.movie_title.localeCompare(b.movie_title)); break
    }
    return list
  }, [posts, search, genre, language, sort])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const current = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  const openAuthor = (userId: string) => {
    setSelectedUserId(userId)
    setModalOpen(true)
  }

  const clearAll = () => {
    setSearch(''); setGenre(''); setSort('latest'); setLanguage('')
    router.push('?', { scroll: false })
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateURL('search', e.target.value) }}
            placeholder="Search reviews..."
            className="w-full pl-12 pr-12 py-4 border rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          {search && (
            <button onClick={() => { setSearch(''); updateURL('search', '') }} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white">
            <Filter size={16} /> Filters {showFilters ? '▲' : '▼'}
          </button>
          {(genre || search || language) && (
            <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2 text-red-600">
              <X size={16} /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">{filtered.length} reviews</span>
          
          {/* Language Filter Dropdown */}
          <select 
            value={language} 
            onChange={(e) => { setLanguage(e.target.value); updateURL('reviewLanguage', e.target.value) }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Languages</option>
            {allReviewLanguages.map(lang => (
              <option key={lang} value={lang}>
                {formatLanguage(lang)}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => { setSort(e.target.value); updateURL('sort', e.target.value) }}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="top-rated">Top Rated</option>
            <option value="a-z">A → Z</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="font-medium mb-3 dark:text-white">Genres</h3>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((g) => (
              <button key={g} onClick={() => { setGenre(genre === g ? '' : g); updateURL('genre', genre === g ? '' : g) }}
                className={`px-3 py-1.5 rounded-full text-sm ${genre === g ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(language || genre) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {language && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200">
              Language: {formatLanguage(language)}
              <button onClick={() => { setLanguage(''); updateURL('reviewLanguage', '') }} className="ml-1 hover:text-blue-600">
                <X size={12} />
              </button>
            </div>
          )}
          {genre && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm dark:bg-purple-900 dark:text-purple-200">
              Genre: {decodeURIComponent(genre)}
              <button onClick={() => { setGenre(''); updateURL('genre', '') }} className="ml-1 hover:text-purple-600">
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {current.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {current.map(post => {
              const prof = profiles[post.user_id]
              return (
                <div key={post.id} className="group">
                  <Link href={`/post/${post.id}`}>
                    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg aspect-[3/4] mb-4 overflow-hidden">
                      {post.movie_poster_url ? (
                        <img src={post.movie_poster_url} alt={post.movie_title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                      )}
                      
                      {/* Top Badges Row */}
                      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 justify-between items-start">
                        {post.tmdb_rating ? (
                          <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm backdrop-blur-md">
                            ★ {post.tmdb_rating.toFixed(1)}
                          </div>
                        ) : <div />}
                        
                        {post.review_language && (
                          <div className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md border border-blue-400/30">
                            {formatLanguage(post.review_language)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Link href={`/post/${post.id}`}>
                    <h3 className="font-bold text-lg dark:text-white group-hover:text-gray-600 line-clamp-1">{post.movie_title}</h3>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mt-1">{post.excerpt || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-gray-800">
                    <button onClick={() => openAuthor(post.user_id)} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-xs text-white">
                        {prof?.avatar_url ? <img src={prof.avatar_url} alt={prof.name} className="w-full h-full object-cover" /> : prof?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-medium dark:text-white hover:text-blue-600">{prof?.name || 'User'}</span>
                    </button>
                    <span className="text-xs text-gray-500 ml-auto">{new Date(post.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50">
                <ChevronLeft size={16} />
              </button>
              <span className="px-4 py-2 dark:text-white">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No reviews found</h3>
          <button onClick={clearAll} className="text-blue-600 hover:underline">Clear filters</button>
        </div>
      )}

      {modalOpen && selectedUserId && (
        <AuthorProfileModal userId={selectedUserId} isOpen={modalOpen} onClose={() => setModalOpen(false)} currentUserId={currentUser?.id} />
      )}
    </div>
  )
}