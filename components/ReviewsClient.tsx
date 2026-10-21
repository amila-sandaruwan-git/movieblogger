'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Star, Calendar, Film, ArrowUpDown } from 'lucide-react'
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
  const searchParams = useSearchParams()

  const [posts] = useState<Post[]>(initialPosts)
  const [profiles] = useState(initialUserProfiles)
  const [search, setSearch] = useState(initialSearch)
  const [genre, setGenre] = useState(initialGenre)
  const [language, setLanguage] = useState(searchParams.get('reviewLanguage') || '')
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

  // Go back to page 1 whenever the result set changes (otherwise you can land on an empty page)
  useEffect(() => { setPage(1) }, [search, genre, language, sort])

  const hasFilters = !!(genre || search || language)
  const activeGenre = genre ? decodeURIComponent(genre) : ''

  // compact page list: 1 … 4 5 6 … 12
  const pageList = (() => {
    const pages: (number | '…')[] = []
    for (let n = 1; n <= totalPages; n++) {
      if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) pages.push(n)
      else if (pages[pages.length - 1] !== '…') pages.push('…')
    }
    return pages
  })()

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
      active
        ? 'border-gold-400 bg-gold-400 text-ink-950'
        : 'border-white/10 bg-white/5 text-gray-300 hover:border-gold-400/50 hover:text-white'
    }`

  return (
    <div>
      {/* ================= Toolbar ================= */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); updateURL('search', e.target.value) }}
              placeholder="Search by title, excerpt or genre..."
              className="mb-input !rounded-2xl !py-3.5 !pl-12 !pr-12"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); updateURL('search', '') }}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); updateURL('sort', e.target.value) }}
                className="mb-input !rounded-2xl !py-3.5 !pl-10 sm:w-44"
                aria-label="Sort reviews"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="top-rated">Top Rated</option>
                <option value="a-z">A → Z</option>
              </select>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`mb-btn-ghost !rounded-2xl !py-3.5 ${showFilters || genre ? '!border-gold-400/60 !text-gold-300' : ''}`}
            >
              <SlidersHorizontal size={16} /> Genres
              {genre && <span className="h-2 w-2 rounded-full bg-gold-400" />}
            </button>
          </div>
        </div>

        {/* Language pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-gray-500">Language</span>
          <button onClick={() => { setLanguage(''); updateURL('reviewLanguage', '') }} className={pill(!language)}>All</button>
          {allReviewLanguages.map(lang => (
            <button
              key={lang}
              onClick={() => {
                const next = language === lang ? '' : lang
                setLanguage(next)
                updateURL('reviewLanguage', next)
              }}
              className={pill(language === lang)}
            >
              {formatLanguage(lang)}
            </button>
          ))}
        </div>

        {/* Genre panel */}
        {showFilters && (
          <div className="animate-fade-up mb-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="mb-display text-lg font-semibold text-white">Browse by genre</h3>
              {genre && (
                <button onClick={() => { setGenre(''); updateURL('genre', '') }} className="text-xs font-medium text-gold-400 hover:text-gold-300">
                  Clear genre
                </button>
              )}
            </div>
            <div className="mb-scroll flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
              {allGenres.map((g) => (
                <button
                  key={g}
                  onClick={() => { setGenre(genre === g ? '' : g); updateURL('genre', genre === g ? '' : g) }}
                  className={pill(genre === g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result summary + active chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-sm text-gray-400">
            Showing <strong className="text-white">{filtered.length}</strong> {filtered.length === 1 ? 'review' : 'reviews'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {language && (
              <span className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                Language: {formatLanguage(language)}
                <button onClick={() => { setLanguage(''); updateURL('reviewLanguage', '') }} aria-label="Remove language filter" className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {activeGenre && (
              <span className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">
                Genre: {activeGenre}
                <button onClick={() => { setGenre(''); updateURL('genre', '') }} aria-label="Remove genre filter" className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs font-medium text-red-300 transition hover:text-red-200">
                <X size={13} /> Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= Grid ================= */}
      {current.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {current.map(post => {
              const prof = profiles[post.user_id]
              return (
                <article key={post.id} className="mb-card group">
                  <Link href={`/post/${post.id}`} className="relative block aspect-[2/3] shrink-0 overflow-hidden bg-ink-700">
                    {post.movie_poster_url ? (
                      <img
                        src={post.movie_poster_url}
                        alt={post.movie_title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Film className="h-12 w-12 text-ink-500" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
                      {post.tmdb_rating ? (
                        <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                          <Star size={10} className="fill-gold-400 text-gold-400" /> {post.tmdb_rating.toFixed(1)}
                        </span>
                      ) : <span />}
                      {post.review_language && (
                        <span className="rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
                          {formatLanguage(post.review_language)}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-3">
                    <Link href={`/post/${post.id}`}>
                      <h3 className="mb-display line-clamp-1 text-sm font-semibold text-white transition group-hover:text-gold-300">{post.movie_title}</h3>
                    </Link>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-400">{post.excerpt || 'No description'}</p>

                    {post.genre_tags?.length > 0 && (
                      <div className="mb-2 mt-2 flex flex-wrap gap-1">
                        {post.genre_tags.slice(0, 2).map((g, i) => (
                          <button
                            key={i}
                            onClick={() => { setGenre(g); updateURL('genre', g) }}
                            className="mb-chip !px-2 !py-0.5 !text-[10px]"
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto flex items-center gap-2 border-t border-white/10 pt-2.5">
                      <button onClick={() => openAuthor(post.user_id)} className="flex min-w-0 items-center gap-2.5 text-left">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 text-[10px] font-bold text-ink-950 ring-1 ring-white/10">
                          {prof?.avatar_url ? <img src={prof.avatar_url} alt={prof.name} className="h-full w-full object-cover" /> : prof?.name?.charAt(0) || 'U'}
                        </span>
                        <span className="truncate text-[11px] font-medium text-gray-200 transition hover:text-gold-300">{prof?.name || 'User'}</span>
                      </button>
                      <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-gray-500">
                        <Calendar size={10} /> {new Date(post.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-gold-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>

              {pageList.map((n, i) =>
                n === '…' ? (
                  <span key={`gap-${i}`} className="px-2 text-gray-600">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    aria-current={page === n ? 'page' : undefined}
                    className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${
                      page === n
                        ? 'border-gold-400 bg-gold-400 text-ink-950'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-gold-400/50 hover:text-white'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:border-gold-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/15 bg-ink-900/40 px-6 py-20 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500">
            <Search size={28} />
          </span>
          <h3 className="mb-display text-2xl font-semibold text-white">No reviews found</h3>
          <p className="mb-6 mt-2 max-w-sm text-sm text-gray-400">Try a different search term, or remove a filter to see more films.</p>
          <button onClick={clearAll} className="mb-btn-primary">Clear filters</button>
        </div>
      )}

      {modalOpen && selectedUserId && (
        <AuthorProfileModal userId={selectedUserId} isOpen={modalOpen} onClose={() => setModalOpen(false)} currentUserId={currentUser?.id} />
      )}
    </div>
  )
}