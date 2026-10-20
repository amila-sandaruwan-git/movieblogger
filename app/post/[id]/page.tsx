'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { BookmarkButton } from '@/components/BookmarkButton'
import { LikeDislikeButtons } from '@/components/LikeDislikeButtons'
import { CommentsSection } from '@/components/CommentsSection'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'
import { FollowButton } from '@/components/FollowButton'
import { TrailerPlayButton } from '@/components/TrailerPlayButton'
import { ReportButton } from '@/components/ReportButton' // <--- IMPORTED HERE
import {
  Home,
  ChevronRight,
  Eye,
  User,
  Users,
  Calendar,
  MessageCircle,
  Quote,
  Film,
  Clock,
  Languages,
  Star,
  AlertCircle,
} from 'lucide-react'
import {
  formatDuration,
  formatDate,
  formatShortDate,
  formatNumber,
} from '@/utils/helpers'

const AuthorAvatar = dynamic(() => import('@/components/AuthorAvatar'), {
  ssr: false,
  loading: () => (
    <div className="mb-skeleton h-20 w-20 !rounded-full" />
  ),
})

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
  movie_backdrop_url: string | null
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
  view_count: number
}

interface UserProfile {
  id: string
  name: string
  avatar_url: string | null
  bio?: string | null
}

interface ExtendedUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
    full_name?: string
  }
}

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default function PostPage({ params }: PostPageProps) {
  const [postId, setPostId] = useState<string>('')
  const [post, setPost] = useState<Post | null>(null)
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null)
  const [authorStats, setAuthorStats] = useState({
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
  })
  const [authorPosts, setAuthorPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [isParamsLoaded, setIsParamsLoaded] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [reactionCounts, setReactionCounts] = useState({
    likes: 0,
    dislikes: 0,
  })

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightedCommentId = searchParams.get('comment') || null

  useEffect(() => {
    const unwrapParams = async () => {
      try {
        const unwrappedParams = await params
        setPostId(unwrappedParams.id)
        setIsParamsLoaded(true)
      } catch {
        setError('Failed to load post parameters')
        setIsLoading(false)
      }
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (isParamsLoaded && postId) {
      fetchAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isParamsLoaded, postId])

  // Real-time follower count
  useEffect(() => {
    if (!authorProfile?.id) return
    const channel = supabase
      .channel(`author-follows-${authorProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${authorProfile.id}`,
        },
        async () => {
          const stats = await getAuthorStats(authorProfile.id)
          setAuthorStats(stats)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorProfile?.id])

  // Real-time comment count
  useEffect(() => {
    if (!postId) return
    const channel = supabase
      .channel(`comment-count-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
          if (count !== null) setCommentCount(count)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  // Real-time reaction counts
  useEffect(() => {
    if (!postId) return
    const channel = supabase
      .channel(`parent-reactions-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const { data } = await supabase
            .from('post_reactions')
            .select('reaction_type')
            .eq('post_id', postId)
          if (data) {
            setReactionCounts({
              likes: data.filter((r) => r.reaction_type === 'like').length,
              dislikes: data.filter((r) => r.reaction_type === 'dislike')
                .length,
            })
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const fetchViewCount = async (id: string) => {
    const { data } = await supabase
      .from('post_views')
      .select('post_id')
      .eq('post_id', parseInt(id))
    return data?.length || 0
  }

  const fetchAllData = async () => {
    if (!postId) {
      setError('No post ID provided')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user || null

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        setCurrentUser({
          id: user.id,
          email: user.email,
          user_metadata: {
            name:
              profile?.name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
          },
        })
      } else {
        setCurrentUser(null)
      }

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError || !postData) {
        setError('Unable to load post. Please try again.')
        setIsLoading(false)
        return
      }
      if (postData.status !== 'published' || postData.visibility !== 'public') {
        setError('This post is not available.')
        setIsLoading(false)
        return
      }
      setPost(postData as Post)

      const actualViewCount = await fetchViewCount(postId)
      setViewCount(actualViewCount)

      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
      setCommentCount(count || 0)

      const { data: reactionsData } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
      if (reactionsData) {
        setReactionCounts({
          likes: reactionsData.filter((r) => r.reaction_type === 'like')
            .length,
          dislikes: reactionsData.filter(
            (r) => r.reaction_type === 'dislike'
          ).length,
        })
      }

      const { data: authorData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio')
        .eq('id', postData.user_id)
        .maybeSingle()
      setAuthorProfile(
        authorData || {
          id: postData.user_id,
          name: 'Movie Reviewer',
          avatar_url: null,
          bio: null,
        }
      )

      const stats = await getAuthorStats(postData.user_id)
      setAuthorStats(stats)

      const { data: authorPostsData } = await supabase
        .from('posts')
        .select('id, movie_title, movie_poster_url, published_at, view_count')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .eq('user_id', postData.user_id)
        .neq('id', postId)
        .order('published_at', { ascending: false })
        .limit(5)
      setAuthorPosts(authorPostsData || [])

      await trackView(postId, user)
    } catch (err: any) {
      setError(`Failed to load post: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getAuthorStats = async (authorId: string) => {
    try {
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authorId)
          .eq('status', 'published')
          .eq('visibility', 'public'),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', authorId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', authorId),
      ])
      return {
        totalPosts: postsRes.count || 0,
        totalFollowers: followersRes.count || 0,
        totalFollowing: followingRes.count || 0,
      }
    } catch {
      return { totalPosts: 0, totalFollowers: 0, totalFollowing: 0 }
    }
  }

  const trackView = async (id: string, user: any) => {
    try {
      let sessionId = sessionStorage.getItem('view_session_id')
      if (!sessionId) {
        sessionId =
          Math.random().toString(36).substring(2) + Date.now().toString(36)
        sessionStorage.setItem('view_session_id', sessionId)
      }
      const viewedKey = `viewed_${id}_${sessionId}`
      if (sessionStorage.getItem(viewedKey)) return
      let ip = 'unknown'
      try {
        const ipResponse = await fetch('/api/client-ip')
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          ip = ipData.ip || 'unknown'
        }
      } catch {
        /* ignore */
      }
      const { error } = await supabase.from('post_views').insert([
        {
          post_id: parseInt(id),
          user_id: user?.id || null,
          user_email: user?.email || null,
          ip_address: ip,
          user_agent: navigator.userAgent,
          session_key: sessionId,
        },
      ])
      if (!error) {
        const newCount = await fetchViewCount(id)
        setViewCount(newCount)
        sessionStorage.setItem(viewedKey, 'true')
        setTimeout(
          () => sessionStorage.removeItem(viewedKey),
          24 * 60 * 60 * 1000
        )
      }
    } catch {
      /* ignore */
    }
  }

  const handleGenreClick = (genre: string) => {
    router.push(`/reviews?genre=${encodeURIComponent(genre.trim())}`)
  }

  /* ---------------- Loading ---------------- */
  if (!isParamsLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-ink-950">
        <div className="mb-skeleton h-[480px] !rounded-none" />
        <div className="mb-container grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="mb-skeleton h-20" />
            <div className="mb-skeleton h-96" />
          </div>
          <div className="space-y-6">
            <div className="mb-skeleton h-72" />
            <div className="mb-skeleton h-56" />
          </div>
        </div>
      </div>
    )
  }

  /* ---------------- Error ---------------- */
  if (error || !post) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ink-950 px-4">
        <div className="mb-surface max-w-md p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/10 text-gold-400">
            <AlertCircle size={26} />
          </div>
          <h1 className="mb-display text-2xl font-semibold text-white">Post not found</h1>
          <p className="mb-7 mt-2 text-sm text-gray-400">
            {error || 'The post you are looking for does not exist.'}
          </p>
          <Link href="/" className="mb-btn-primary">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const heroImage = post.movie_backdrop_url || post.movie_poster_url

  const detailRows: { label: string; value: string }[] = [
    post.director ? { label: 'Director', value: post.director } : null,
    post.cast?.length > 0
      ? {
          label: 'Cast',
          value:
            post.cast.slice(0, 4).join(', ') +
            (post.cast.length > 4 ? ` +${post.cast.length - 4} more` : ''),
        }
      : null,
    post.movie_language ? { label: 'Language', value: post.movie_language } : null,
    post.release_date
      ? {
          label: 'Release',
          value: new Date(post.release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ================= HERO ================= */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-ink-700 via-ink-800 to-ink-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-transparent to-transparent" />
        </div>

        <div className="mb-container relative flex min-h-[460px] flex-col justify-between pb-10 pt-5 md:min-h-[540px]">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-300">
            <Link href="/" className="flex items-center gap-1 transition hover:text-white">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} className="opacity-50" />
            <Link href="/reviews" className="transition hover:text-white">Reviews</Link>
            <ChevronRight size={13} className="opacity-50" />
            <span className="max-w-[40vw] truncate font-medium text-white">{post.movie_title}</span>
          </nav>

          {/* Trailer button (centered) */}
          {post.trailer_url && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="pointer-events-auto">
                <TrailerPlayButton
                  trailerUrl={post.trailer_url}
                  movieTitle={post.movie_title}
                  isAuthenticated={!!currentUser}
                />
              </div>
            </div>
          )}

          {/* Title block */}
          <div className="mt-24 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-eyebrow mb-3">Review</p>
              <h1 className="mb-display text-4xl font-semibold leading-[1.05] drop-shadow-lg sm:text-5xl lg:text-6xl">
                {post.movie_title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                {post.tmdb_rating && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 font-bold text-ink-950">
                    <Star size={14} className="fill-ink-950" /> {post.tmdb_rating.toFixed(1)}
                    <span className="text-xs font-semibold opacity-70">TMDB</span>
                  </span>
                )}
                {post.release_date && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                    <Calendar size={14} className="text-gold-400" /> {new Date(post.release_date).getFullYear()}
                  </span>
                )}
                {post.duration > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                    <Clock size={14} className="text-gold-400" /> {formatDuration(post.duration)}
                  </span>
                )}
                {post.review_language && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-md">
                    <Languages size={14} className="text-gold-400" /> {post.review_language}
                  </span>
                )}
              </div>

              {post.genre_tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.genre_tags.map((genre, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleGenreClick(genre)}
                      className="mb-chip !bg-white/10 !text-white backdrop-blur-md"
                    >
                      #{genre}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {post.excerpt && (
              <figure className="w-full rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-xl lg:max-w-sm">
                <Quote className="mb-2 h-5 w-5 text-gold-400" />
                <p className="text-sm leading-relaxed text-gray-100">{post.excerpt}</p>
              </figure>
            )}
          </div>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <main className="mb-container py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ---------- Main column ---------- */}
          <div className="min-w-0 space-y-8">
            <article className="mb-surface overflow-hidden">
              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-4 md:px-6">
                <div className="flex flex-wrap items-center gap-4">
                  <LikeDislikeButtons
                    postId={postId}
                    userId={currentUser?.id}
                    onChange={(likes, dislikes) => setReactionCounts({ likes, dislikes })}
                  />
                  <BookmarkButton postId={postId} userId={currentUser?.id} />
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">{commentCount}</span>
                  </div>
                  <ReportButton
                    postId={postId}
                    userId={currentUser?.id}
                    isAuthenticated={!!currentUser}
                  />
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-gray-300">
                  <Eye className="h-4 w-4 text-gold-400" />
                  {formatNumber(viewCount)} view{viewCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Author */}
              <div className="border-b border-white/10 p-4 md:px-6 md:py-5">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="shrink-0 rounded-full ring-2 ring-white/10 transition hover:ring-gold-400/60"
                    aria-label={`View ${authorProfile?.name || 'publisher'} profile`}
                  >
                    <AuthorAvatar
                      src={authorProfile?.avatar_url}
                      name={authorProfile?.name || 'Movie Reviewer'}
                      size="lg"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="mb-display truncate text-left text-xl font-semibold text-white transition hover:text-gold-300"
                      >
                        {authorProfile?.name || 'Movie Reviewer'}
                      </button>
                      {authorProfile && authorProfile.id !== currentUser?.id && (
                        <FollowButton
                          targetUserId={authorProfile.id}
                          targetUserName={authorProfile.name}
                          currentUserId={currentUser?.id}
                          size="sm"
                          showCount={false}
                          onFollowChange={(isFollowing) => {
                            setAuthorStats((prev) => ({
                              ...prev,
                              totalFollowers: isFollowing
                                ? prev.totalFollowers + 1
                                : Math.max(0, prev.totalFollowers - 1),
                            }))
                          }}
                        />
                      )}
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} /> Published {formatDate(post.published_at)}
                    </p>

                    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div className="flex items-baseline gap-1.5">
                        <dt className="sr-only">Posts</dt>
                        <dd className="font-semibold text-white">{formatNumber(authorStats.totalPosts)}</dd>
                        <span className="text-gray-500">posts</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="sr-only">Followers</dt>
                        <dd className="font-semibold text-white">{formatNumber(authorStats.totalFollowers)}</dd>
                        <span className="text-gray-500">followers</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <dt className="sr-only">Following</dt>
                        <dd className="font-semibold text-white">{formatNumber(authorStats.totalFollowing)}</dd>
                        <span className="text-gray-500">following</span>
                      </div>
                    </dl>

                    {authorProfile?.bio && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-400">{authorProfile.bio}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Review content */}
              <div className="p-5 md:p-10">
                <p className="mb-eyebrow mb-2">Full review</p>
                <h2 className="mb-display mb-8 text-3xl font-semibold text-white">
                  {post.movie_title}
                </h2>
                <div
                  className="mb-prose"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </article>

            {post.comments_enabled && (
              <CommentsSection
                postId={postId}
                userId={currentUser?.id}
                isAuthenticated={!!currentUser}
                postAuthorId={post.user_id}
                postAuthorName={authorProfile?.name}
                postTitle={post.movie_title}
                onCommentChange={setCommentCount}
                highlightedCommentId={highlightedCommentId}
              />
            )}
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="mb-surface overflow-hidden">
              {post.movie_poster_url && (
                <div className="relative hidden aspect-[2/3] max-h-80 w-full overflow-hidden sm:block lg:max-h-96">
                  <img
                    src={post.movie_poster_url}
                    alt={`${post.movie_title} poster`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6">
                <h3 className="mb-display mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Film size={18} className="text-gold-400" /> Movie details
                </h3>
                <dl className="divide-y divide-white/10 text-sm">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                      <dt className="w-20 shrink-0 text-gray-500">{row.label}</dt>
                      <dd className="flex-1 font-medium text-gray-100">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {authorPosts.length > 0 && (
              <div className="mb-surface p-6">
                <h3 className="mb-display mb-4 text-lg font-semibold">
                  More from {authorProfile?.name || 'Author'}
                </h3>
                <div className="space-y-4">
                  {authorPosts.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/post/${p.id}`}
                      className="group flex items-center gap-3"
                    >
                      {p.movie_poster_url ? (
                        <img
                          src={p.movie_poster_url}
                          alt={p.movie_title}
                          className="h-16 w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10 transition group-hover:ring-gold-400/60"
                        />
                      ) : (
                        <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-gray-500">
                          <Film size={16} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-100 transition group-hover:text-gold-300">
                          {p.movie_title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{formatShortDate(p.published_at)}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-gray-600 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {isProfileModalOpen && authorProfile && (
        <AuthorProfileModal
          userId={authorProfile.id}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUserId={currentUser?.id}
        />
      )}
    </div>
  )
}