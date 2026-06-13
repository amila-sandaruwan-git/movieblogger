// components/GenreTagsClient.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GenreTagsClientProps {
  genres: string[]
  postId: string
  showMore?: boolean
  moreCount?: number
}

export default function GenreTagsClient({ 
  genres, 
  postId,
  showMore = false, 
  moreCount = 0 
}: GenreTagsClientProps) {
  const router = useRouter()

  const handleGenreClick = (e: React.MouseEvent, genre: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/reviews?genre=${encodeURIComponent(genre)}`)
  }

  const handleMoreClick = (e: React.MouseEvent, genre: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/reviews?genre=${encodeURIComponent(genre)}`)
  }

  if (genres.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {genres.map((genre, index) => (
        <button
          key={index}
          onClick={(e) => handleGenreClick(e, genre)}
          className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
        >
          {genre}
        </button>
      ))}
      {showMore && moreCount > 0 && (
        <button
          onClick={(e) => handleMoreClick(e, genres[0])}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          +{moreCount} more
        </button>
      )}
    </div>
  )
}