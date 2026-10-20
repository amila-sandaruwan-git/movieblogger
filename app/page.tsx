'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import HomepageSearch from '@/components/HomepageSearch'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'
import { Star, Calendar, Film, ArrowRight, Heart, MessageCircle, Eye, Clapperboard } from 'lucide-react'

interface Post {
  id: string
  movie_title: string
  movie_poster_url: string
  movie_backdrop_url: string | null
  release_date: string
  genre_tags: string[]
  review_language: string
  tmdb_rating: number | null
  excerpt: string
  published_at: string
  created_at: string
  user_id: string
  view_count?: number
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [profiles, setProfiles] = useState<Record<string, any>>({})
  const [engagement, setEngagement] = useState<Record<string, { likes: number; comments: number }>>({})
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)

    if (session?.user) {
      const { data: p } = await supabase.from('profiles').select('name, avatar_url').eq('id', session.user.id).single()
      setProfile(p)
    }

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false })
      .limit(50)

    if (postsData) {
      setPosts(postsData as Post[])
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: profs } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds)
      if (profs) {
        const map: Record<string, any> = {}
        profs.forEach(p => { map[p.id] = p })
        setProfiles(map)
      }

      const ids = postsData.map(p => p.id)
      const [likes, comments, views] = await Promise.all([
        supabase.from('post_reactions').select('post_id').in('post_id', ids).eq('reaction_type', 'like'),
        supabase.from('comments').select('post_id').in('post_id', ids),
        supabase.from('post_views').select('post_id').in('post_id', ids),
      ])

      const eng: Record<string, { likes: number; comments: number }> = {}
      ids.forEach(id => { eng[id] = { likes: 0, comments: 0 } })
      likes.data?.forEach(l => { if (eng[l.post_id]) eng[l.post_id].likes++ })
      comments.data?.forEach(c => { if (eng[c.post_id]) eng[c.post_id].comments++ })
      setEngagement(eng)

      const vc: Record<string, number> = {}
      views.data?.forEach(v => {
        const k = v.post_id.toString()
        vc[k] = (vc[k] || 0) + 1
      })
      setViewCounts(vc)
    }
    setLoading(false)
  }

  const openAuthor = (userId: string) => {
    setSelectedUserId(userId)
    setModalOpen(true)
  }

  const formatLanguage = (lang: string) => {
    if (lang === 'Sinhala') return 'සිංහල'
    if (lang === 'Tamil') return 'தமிழ்'
    return lang
  }

  const displayName = profile?.name || user?.email?.split('@')[0] || ''

  const sinhalaPosts = posts.filter(p => p.review_language === 'Sinhala').slice(0, 4)
  const tamilPosts = posts.filter(p => p.review_language === 'Tamil').slice(0, 4)
  const englishPosts = posts.filter(p => p.review_language === 'English').slice(0, 4)
  const featured = posts[0]
  const newestPosts = posts.slice(1, 5) // featured post gets its own spotlight
  const allGenres = Array.from(new Set(posts.flatMap(p => p.genre_tags || [])))

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950">
        <div className="mb-vignette h-[420px]" />
        <div className="mb-container -mt-24 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-skeleton h-[26rem]" />
          ))}
        </div>
      </div>
    )
  }

  /* ---------- Post card (render function, not a component, so it never remounts) ---------- */
  const renderCard = (post: Post) => {
    const prof = profiles[post.user_id]
    const eng = engagement[post.id] || { likes: 0, comments: 0 }
    const views = viewCounts[post.id.toString()] || 0

    return (
      <article key={post.id} className="mb-card group">
        <Link href={`/post/${post.id}`} className="relative block aspect-[2/3] shrink-0 overflow-hidden bg-ink-700">
          {post.movie_poster_url ? (
            <Image
              src={post.movie_poster_url}
              alt={post.movie_title}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="h-12 w-12 text-ink-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent opacity-80" />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            {post.tmdb_rating ? (
              <span className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <Star size={12} className="fill-gold-400 text-gold-400" /> {post.tmdb_rating.toFixed(1)}
              </span>
            ) : <span />}
            {post.review_language && (
              <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                {formatLanguage(post.review_language)}
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <Link href={`/post/${post.id}`}>
            <h3 className="mb-display line-clamp-1 text-lg font-semibold text-white transition group-hover:text-gold-300">
              {post.movie_title}
            </h3>
          </Link>

          <div className="mb-5 mt-3 flex flex-wrap gap-1.5">
            {post.genre_tags?.slice(0, 3).map((g, i) => (
              <Link key={i} href={`/reviews?genre=${encodeURIComponent(g)}`} className="mb-chip">
                {g}
              </Link>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
            <button onClick={() => openAuthor(post.user_id)} className="flex min-w-0 items-center gap-2.5 text-left">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-500 text-xs font-bold text-ink-950 ring-2 ring-white/10">
                {prof?.avatar_url ? (
                  <Image src={prof.avatar_url} alt={prof.name} width={32} height={32} className="h-full w-full object-cover" />
                ) : (
                  prof?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white group-hover:text-gray-100">{prof?.name || 'User'}</span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Calendar size={11} /> {new Date(post.published_at).toLocaleDateString()}
                </span>
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Heart size={13} /> {eng.likes}</span>
              <span className="flex items-center gap-1"><MessageCircle size={13} /> {eng.comments}</span>
              <span className="hidden items-center gap-1 sm:flex"><Eye size={13} /> {views}</span>
            </div>
          </div>
        </div>
      </article>
    )
  }

  /* ---------- Section wrapper ---------- */
  const renderSection = (opts: {
    eyebrow: string
    title: string
    subtitle: string
    href: string
    cta: string
    items: Post[]
  }) => {
    if (opts.items.length === 0) return null
    return (
      <section key={opts.title}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-eyebrow mb-2">{opts.eyebrow}</p>
            <h2 className="mb-section-title">{opts.title}</h2>
            <p className="mt-1.5 text-sm text-gray-400">{opts.subtitle}</p>
          </div>
          <Link href={opts.href} className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300 md:inline-flex">
            {opts.cta}
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {opts.items.map(renderCard)}
        </div>

        <div className="mt-6 flex justify-center md:hidden">
          <Link href={opts.href} className="mb-btn-ghost">
            {opts.cta} <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ================= HERO ================= */}
      <header className="relative isolate overflow-hidden">
        <Image src="/banner.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="mb-vignette absolute inset-0 -z-10" />

        <div className="mb-container animate-fade-up py-20 text-center sm:py-28">
          <p className="mb-eyebrow mb-5 inline-flex items-center gap-2">
            <Clapperboard size={14} /> {user ? 'Now showing for you' : 'Reviews by real movie lovers'}
          </p>
          <h1 className="mb-display mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-6xl">
            {user ? (
              <>Welcome back, <span className="text-gold-400">{displayName}</span></>
            ) : (
              <>Discover your next <span className="text-gold-400">favorite film</span></>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-gray-300 sm:text-lg">
            {user
              ? 'Pick up where you left off or explore new cinematic treasures.'
              : 'In-depth reviews and discussions on the latest movies — in Sinhala, Tamil and English.'}
          </p>

          <div className="mx-auto mt-9 max-w-2xl">
            <HomepageSearch />
          </div>

          <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/40 py-4 backdrop-blur-md">
            {[
              { label: 'Reviews', value: posts.length },
              { label: 'Genres', value: allGenres.length },
              { label: 'Reviewers', value: Object.keys(profiles).length },
            ].map(s => (
              <div key={s.label} className="px-4">
                <dd className="mb-display text-2xl font-semibold text-gold-400 sm:text-3xl">{s.value}+</dd>
                <dt className="mt-1 text-xs uppercase tracking-widest text-gray-400">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mb-container space-y-24 py-16">
        {/* ================= FEATURED SPOTLIGHT ================= */}
        {featured && (
          <section>
            <p className="mb-eyebrow mb-4">Latest review</p>
            <Link
              href={`/post/${featured.id}`}
              className="group relative grid overflow-hidden rounded-3xl border border-white/10 bg-ink-950 transition hover:border-gold-400/40 md:grid-cols-5"
            >
              <div className="relative min-h-[260px] bg-ink-950 md:col-span-3 md:min-h-[380px]">
                {(featured.movie_backdrop_url || featured.movie_poster_url) && (
                  <Image
                    src={(featured.movie_backdrop_url || featured.movie_poster_url) as string}
                    alt={featured.movie_title}
                    fill
                    sizes="(min-width:768px) 60vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-ink-950/20 md:to-ink-950" />
              </div>

              <div className="relative flex flex-col justify-center gap-4 p-6 sm:p-10 md:col-span-2 bg-ink-950">
                <div className="flex flex-wrap items-center gap-2">
                  {featured.tmdb_rating && (
                    <span className="flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-xs font-semibold text-gold-300">
                      <Star size={12} className="fill-gold-400 text-gold-400" /> {featured.tmdb_rating.toFixed(1)}
                    </span>
                  )}
                  {featured.review_language && (
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-gray-300">
                      {formatLanguage(featured.review_language)}
                    </span>
                  )}
                </div>
                <h2 className="mb-display text-3xl font-semibold leading-tight sm:text-4xl">{featured.movie_title}</h2>
                {featured.excerpt && <p className="line-clamp-3 text-sm leading-relaxed text-gray-400">{featured.excerpt}</p>}
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gold-400">
                  Read the review <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* ================= SECTIONS ================= */}
        {renderSection({ eyebrow: 'Fresh off the reel', title: 'Recently Added', subtitle: 'The newest reviews on the platform', href: '/reviews', cta: 'See all reviews', items: newestPosts })}
        {renderSection({ eyebrow: 'සිංහල', title: `${formatLanguage('Sinhala')} Reviews`, subtitle: 'Latest movie insights in Sinhala', href: '/reviews?reviewLanguage=Sinhala', cta: 'View all', items: sinhalaPosts })}
        {renderSection({ eyebrow: 'தமிழ்', title: `${formatLanguage('Tamil')} Reviews`, subtitle: 'Latest movie insights in Tamil', href: '/reviews?reviewLanguage=Tamil', cta: 'View all', items: tamilPosts })}
        {renderSection({ eyebrow: 'English', title: 'English Reviews', subtitle: 'Latest movie insights in English', href: '/reviews?reviewLanguage=English', cta: 'View all', items: englishPosts })}

        {/* ================= GENRES ================= */}
        {allGenres.length > 0 && (
          <section>
            <div className="mb-8 text-center">
              <p className="mb-eyebrow mb-2">Explore</p>
              <h2 className="mb-section-title">Browse by Genre</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {allGenres.slice(0, 12).map(genre => {
                const count = posts.filter(p => p.genre_tags?.includes(genre)).length
                return (
                  <Link
                    key={genre}
                    href={`/reviews?genre=${encodeURIComponent(genre)}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 p-5 transition hover:-translate-y-1 hover:border-gold-400/40"
                  >
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold-400/10 blur-2xl transition group-hover:bg-gold-400/25" />
                    <Film className="mb-3 h-5 w-5 text-gold-400" />
                    <h3 className="font-semibold text-white">{genre}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{count} {count === 1 ? 'review' : 'reviews'}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {modalOpen && selectedUserId && (
        <AuthorProfileModal
          userId={selectedUserId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentUserId={user?.id}
        />
      )}
    </div>
  )
}