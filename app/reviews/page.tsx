import { createClient } from '@/lib/supabase/server'
import ReviewsClient from '@/components/ReviewsClient'
import { Clapperboard } from 'lucide-react'

interface Props {
  searchParams: Promise<{ 
    search?: string
    genre?: string
    sort?: string
    reviewLanguage?: string
  }>
}

export default async function ReviewsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .order('published_at', { ascending: false })

  const allPosts = posts || []
  const userIds = [...new Set(allPosts.map(p => p.user_id))]

  let profilesMap: Record<string, any> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds)
    profiles?.forEach(p => { profilesMap[p.id] = p })
  }

  const allGenres = Array.from(new Set(allPosts.flatMap(p => p.genre_tags || []))).sort()
  
  // Get unique review languages for the filter dropdown
  const allReviewLanguages = Array.from(
    new Set(allPosts.map(p => p.review_language).filter(Boolean))
  ).sort()

  const activeGenre = params.genre ? decodeURIComponent(params.genre) : ''

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="relative isolate overflow-hidden border-b border-white/10">
        <div className="mb-vignette absolute inset-0 -z-10" />
        <div className="mb-container py-10 sm:py-14">
          <p className="mb-eyebrow mb-4 inline-flex items-center gap-2">
            <Clapperboard size={14} /> The archive
          </p>
          <h1 className="mb-display text-4xl font-semibold leading-tight sm:text-5xl">
            Movie <span className="text-gold-400">Reviews</span>
            {activeGenre && (
              <span className="ml-3 inline-block rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1 align-middle text-base font-medium text-gold-300 sm:text-lg">
                {activeGenre}
              </span>
            )}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-400">
            Browse all published movie reviews from our community.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
            <span><strong className="text-white">{allPosts.length}</strong> reviews</span>
            <span><strong className="text-white">{allGenres.length}</strong> genres</span>
            <span><strong className="text-white">{userIds.length}</strong> reviewers</span>
          </div>
        </div>
      </header>

      <div className="mb-container py-8">
        <ReviewsClient
          initialPosts={allPosts}
          initialUserProfiles={profilesMap}
          allGenres={allGenres}
          allReviewLanguages={allReviewLanguages}
          initialSearch={params.search || ''}
          initialGenre={params.genre || ''}
          initialSort={params.sort || 'latest'}
          currentUser={user}
        />
      </div>
    </div>
  )
}