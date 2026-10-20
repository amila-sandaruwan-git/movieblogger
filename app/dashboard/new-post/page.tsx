'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { tmdbClient, TMDBMovie } from '@/lib/tmdb'
import debounce from 'lodash/debounce'
import { Search, Loader2, Star, Film, X, Save, Send, AlertCircle } from 'lucide-react'

const TinyMceEditor = dynamic(() => import('@/components/TinyMceEditor'), {
  ssr: false,
  loading: () => <div className="mb-skeleton h-64 w-full" />,
})

function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/
  )
  return m && m[1] && m[1].length === 11 ? m[1] : null
}

export default function NewPostPage() {
  const [formData, setFormData] = useState({
    content: '',
    excerpt: '',
    movie_title: '',
    movie_background_title: '',
    movie_poster_url: '',
    movie_backdrop_url: '',
    release_date: '',
    director: '',
    cast: [] as string[],
    genre_tags: [] as string[],
    duration_hours: 0,
    duration_minutes: 0,
    review_language: '',
    movie_language: '',
    trailer_url: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    visibility: 'public' as 'public' | 'private',
    comments_enabled: true,
    scheduled_for: '',
    tmdb_id: undefined as number | undefined,
    tmdb_rating: undefined as number | undefined,
  })
  const [currentCast, setCurrentCast] = useState('')
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const searchMovies = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setSearchResults([])
        setShowResults(false)
        return
      }
      setIsSearching(true)
      try {
        const results = await tmdbClient.searchMovies(q)
        setSearchResults(results)
        setShowResults(true)
      } finally {
        setIsSearching(false)
      }
    }, 500),
    []
  )

  const selectMovie = async (movie: TMDBMovie) => {
    const details = await tmdbClient.getMovieDetails(movie.id)
    if (!details) return

    const director =
      details.credits?.crew?.find((c) => c.job === 'Director')?.name || ''
    const cast = details.credits?.cast?.slice(0, 10).map((c) => c.name) || []
    const trailer = details.videos?.results?.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    )
    const dur = tmdbClient.formatRuntime(details.runtime)
    const lang =
      details.spoken_languages?.find(
        (l) => l.iso_639_1 === details.original_language
      )?.english_name || details.original_language

    setFormData((prev) => ({
      ...prev,
      movie_title: movie.title,
      movie_background_title:
        movie.original_title !== movie.title ? movie.original_title : '',
      movie_poster_url: tmdbClient.getPosterUrl(movie.poster_path),
      movie_backdrop_url: tmdbClient.getBackdropUrl(movie.backdrop_path),
      release_date: movie.release_date || '',
      genre_tags: details.genres?.map((g) => g.name) || [],
      director,
      cast,
      duration_hours: dur.hours,
      duration_minutes: dur.minutes,
      excerpt: details.overview || prev.excerpt,
      movie_language: lang,
      trailer_url: trailer
        ? `https://www.youtube.com/watch?v=${trailer.key}`
        : '',
      tmdb_id: movie.id,
      tmdb_rating: details.vote_average,
    }))
    setShowResults(false)
  }

  const addToArray = (
    field: 'cast' | 'genre_tags' | 'tags',
    val: string,
    setter: (v: string) => void
  ) => {
    if (val.trim() && !(formData[field] as string[]).includes(val.trim())) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), val.trim()],
      }))
      setter('')
    }
  }

  const removeFromArray = (
    field: 'cast' | 'genre_tags' | 'tags',
    i: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, idx) => idx !== i),
    }))
  }

  const submit = async (action: 'draft' | 'publish') => {
    setError(null)
    if (!formData.movie_title.trim()) {
      setError('Movie title required')
      return
    }
    if (!formData.content.trim()) {
      setError('Content required')
      return
    }
    if (!formData.review_language.trim()) {
      setError('Review language required')
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not authenticated')

      // CHECK BAN STATUS (Added this block)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.is_banned) {
        throw new Error('Your account has been suspended. You cannot create new posts.')
      }

      const totalDuration =
        formData.duration_hours * 60 + formData.duration_minutes
      const finalStatus = action === 'publish' ? 'published' : 'draft'

      // Insert post and get the new post ID back using .select().single()
      const { data, error } = await supabase.from('posts').insert({
        content: formData.content,
        excerpt: formData.excerpt || null,
        movie_title: formData.movie_title,
        movie_background_title: formData.movie_background_title || null,
        movie_poster_url: formData.movie_poster_url || null,
        movie_backdrop_url: formData.movie_backdrop_url || null,
        release_date: formData.release_date || null,
        director: formData.director || null,
        cast: formData.cast.length ? formData.cast : null,
        genre_tags: formData.genre_tags.length ? formData.genre_tags : null,
        duration: totalDuration || null,
        review_language: formData.review_language,
        movie_language: formData.movie_language || null,
        trailer_url: formData.trailer_url || null,
        tags: formData.tags.length ? formData.tags : null,
        status: finalStatus,
        visibility: formData.visibility,
        comments_enabled: formData.comments_enabled,
        published_at: action === 'publish' ? new Date().toISOString() : null,
        scheduled_for: formData.scheduled_for || null,
        user_id: user.id,
        tmdb_id: formData.tmdb_id || null,
        tmdb_rating: formData.tmdb_rating || null,
      }).select().single()

      if (error) throw error

      // TRIGGER EMAIL NOTIFICATIONS (Only if publishing)
      if (action === 'publish' && data) {
        // We don't await this so the UI redirects immediately
        fetch('/api/notify-subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postTitle: formData.movie_title,
            postExcerpt: formData.excerpt,
            postId: data.id
          })
        }).catch(err => console.error('Failed to notify subscribers:', err))
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller',
    'Biography', 'Family', 'History', 'Musical', 'Sport', 'War', 'Western',
  ]
  
  const languageOptions = [
    { value: 'Sinhala', label: 'සිංහල' },
    { value: 'Tamil', label: 'தமிழ்' },
    { value: 'English', label: 'English' },
  ]

  const trailerId = extractYoutubeId(formData.trailer_url)

  return (
    <div className="pb-24">
      <p className="mb-eyebrow mb-2">Compose</p>
      <h1 className="mb-display text-3xl font-semibold text-white">Create New Post</h1>
      <p className="mb-8 mt-1 text-sm text-gray-400">
        Write a movie review. Search a title to auto-fetch details.
      </p>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2.5 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* ---------- 1. Movie search ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-1 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">1</span>
            Movie Search
          </h2>
          <p className="mb-4 ml-9 text-xs text-gray-500">Pick a result to fill in the poster, cast, genres and trailer.</p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={formData.movie_title}
              onChange={(e) => {
                setFormData({ ...formData, movie_title: e.target.value })
                searchMovies(e.target.value)
              }}
              placeholder="Type movie title..."
              className="mb-input !pl-11"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-gold-400" />
              </div>
            )}

            {showResults && searchResults.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-white/10 bg-ink-800 shadow-2xl shadow-black/60">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMovie(m)}
                    className="flex w-full items-center gap-3 border-b border-white/5 p-3 text-left transition last:border-b-0 hover:bg-white/5"
                  >
                    {m.poster_path ? (
                      <img src={tmdbClient.getPosterUrl(m.poster_path, 'w92')} alt={m.title} className="h-14 w-10 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-ink-700 text-gray-500"><Film size={14} /></div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">
                        {m.title} {m.release_date && <span className="text-gray-500">({m.release_date.split('-')[0]})</span>}
                      </div>
                      {m.vote_average > 0 && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gold-400">
                          <Star size={11} className="fill-gold-400" /> {m.vote_average.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {formData.tmdb_id && (
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-gold-400/30 bg-gold-400/[0.06] p-3">
              {formData.movie_poster_url && (
                <img src={formData.movie_poster_url} alt="" className="h-20 w-14 shrink-0 rounded-md object-cover ring-1 ring-white/10" />
              )}
              <div className="min-w-0">
                <p className="mb-eyebrow">Selected</p>
                <p className="mb-display truncate text-lg font-semibold text-white">{formData.movie_title}</p>
                <p className="text-xs text-gray-400">
                  {formData.release_date && formData.release_date.split('-')[0]}
                  {formData.director && ` · ${formData.director}`}
                  {formData.tmdb_rating ? ` · ★ ${formData.tmdb_rating.toFixed(1)}` : ''}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ---------- 2. Content ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-4 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">2</span>
            Review Content
          </h2>
          <div className="space-y-4">
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short excerpt..."
              rows={3}
              className="mb-input resize-none"
            />
            <div className="overflow-hidden rounded-xl border border-white/10">
              <TinyMceEditor value={formData.content} onChange={(c) => setFormData({ ...formData, content: c })} />
            </div>
          </div>
        </section>

        {/* ---------- 3. Movie info ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-5 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">3</span>
            Movie Info
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-label">Release Date</label>
              <input type="date" value={formData.release_date} readOnly className="mb-input" />
            </div>
            <div>
              <label className="mb-label">Director</label>
              <input type="text" value={formData.director} readOnly className="mb-input" />
            </div>

            <div>
              <label className="mb-label">Cast</label>
              <div className="flex gap-2">
                <input value={currentCast} onChange={(e) => setCurrentCast(e.target.value)} className="mb-input" placeholder="Add cast" />
                <button onClick={() => addToArray('cast', currentCast, setCurrentCast)} className="mb-btn-ghost shrink-0 !px-4">Add</button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {formData.cast.map((a, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-full bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200 ring-1 ring-sky-400/30">
                    {a}
                    <button onClick={() => removeFromArray('cast', i)} aria-label={`Remove ${a}`} className="text-sky-300/70 hover:text-white"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-label">Genres</label>
              <div className="flex gap-2">
                <select value={currentGenre} onChange={(e) => setCurrentGenre(e.target.value)} className="mb-input">
                  <option value="">Select genre</option>
                  {genreOptions.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <button onClick={() => addToArray('genre_tags', currentGenre, setCurrentGenre)} className="mb-btn-ghost shrink-0 !px-4">Add</button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {formData.genre_tags.map((g, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/30">
                    {g}
                    <button onClick={() => removeFromArray('genre_tags', i)} aria-label={`Remove ${g}`} className="text-emerald-300/70 hover:text-white"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-label">Review Language <span className="text-gold-400">*</span></label>
              <select value={formData.review_language} onChange={(e) => setFormData({ ...formData, review_language: e.target.value })} className="mb-input">
                <option value="">Select language</option>
                {languageOptions.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-label">Movie Language (from TMDB)</label>
              <input type="text" value={formData.movie_language} readOnly className="mb-input" />
            </div>
          </div>
        </section>

        {/* ---------- 4. Trailer ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-4 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">4</span>
            Trailer
          </h2>
          <label className="mb-label">YouTube Trailer URL</label>
          <input
            type="url"
            value={formData.trailer_url}
            onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mb-input"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Auto-filled from TMDB when available. You can override or paste your own URL.
          </p>

          {formData.trailer_url && (
            <div className="mt-4">
              {trailerId ? (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black pt-[56.25%]">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerId}?rel=0`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Trailer preview"
                  />
                </div>
              ) : (
                <p className="flex items-center gap-2 text-xs text-amber-300">
                  <AlertCircle size={14} /> Could not detect a valid YouTube ID. Paste a full youtube.com or youtu.be link.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ---------- 5. Tags ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-4 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">5</span>
            Tags
          </h2>
          <div className="flex gap-2">
            <input value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} className="mb-input" placeholder="Add tag" />
            <button onClick={() => addToArray('tags', currentTag, setCurrentTag)} className="mb-btn-ghost shrink-0 !px-4">Add</button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {formData.tags.map((t, i) => (
              <span key={i} className="flex items-center gap-1.5 rounded-full bg-gold-400/10 px-2.5 py-1 text-xs text-gold-200 ring-1 ring-gold-400/30">
                #{t}
                <button onClick={() => removeFromArray('tags', i)} aria-label={`Remove ${t}`} className="text-gold-300/70 hover:text-white"><X size={12} /></button>
              </span>
            ))}
          </div>
        </section>

        {/* ---------- 6. Settings ---------- */}
        <section className="rounded-2xl border border-white/10 bg-ink-900/60 p-5 sm:p-6">
          <h2 className="mb-display mb-5 flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">6</span>
            Settings
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-label">Visibility</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                className="mb-input"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/10 bg-ink-900/80 px-4 py-3 text-sm text-gray-200 transition hover:border-gold-400/40">
              <input
                type="checkbox"
                checked={formData.comments_enabled}
                onChange={(e) => setFormData({ ...formData, comments_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              Enable comments
            </label>
          </div>
        </section>

        {/* ---------- Actions ---------- */}
        <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-2xl border border-white/10 bg-ink-900/90 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <button onClick={() => router.push('/dashboard')} className="mb-btn-ghost">Cancel</button>
          <button
            onClick={() => submit('draft')}
            disabled={submitting}
            className="mb-btn border border-amber-400/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
          >
            <Save size={16} /> {submitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => submit('publish')} disabled={submitting} className="mb-btn-primary">
            <Send size={16} /> {submitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}