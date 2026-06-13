// components/RelatedPostsClient.tsx - FIXED
'use client'

import dynamic from 'next/dynamic'

const RelatedPosts = dynamic(() => import('./RelatedPosts'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
})

interface RelatedPostsClientProps {
  currentPostId: string
  currentMovieTitle: string
  genreTags?: string[]
  cast?: string[]
  director?: string
  releaseYear?: number
}

export default function RelatedPostsClient({ 
  currentPostId, 
  currentMovieTitle,
  genreTags, 
  cast,
  director,
  releaseYear
}: RelatedPostsClientProps) {
  return (
    <RelatedPosts 
      currentPostId={currentPostId}
      currentMovieTitle={currentMovieTitle}
      genreTags={genreTags}
      cast={cast}
      director={director}
      releaseYear={releaseYear}
    />
  )
}