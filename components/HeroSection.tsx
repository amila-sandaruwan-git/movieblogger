// components/HeroSection.tsx
'use client'

import { Play } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/utils/helpers'

interface HeroSectionProps {
  moviePosterUrl?: string
  movieTitle: string
  movieBackgroundTitle?: string
  releaseDate?: string
  duration: number
  genreTags?: string[]
  trailerUrl?: string
  tmdbRating?: {
    stars: string
    numeric: string
  }
}

export default function HeroSection({
  moviePosterUrl,
  movieTitle,
  movieBackgroundTitle,
  releaseDate,
  duration,
  genreTags = [],
  trailerUrl,
  tmdbRating
}: HeroSectionProps) {
  const handlePlayTrailer = () => {
    if (trailerUrl) {
      window.open(trailerUrl, '_blank')
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 group">
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent z-10"></div>
      
      {/* Updated Image Container */}
      <div className="relative w-full h-125">
        {moviePosterUrl ? (
          <img
            src={moviePosterUrl}
            alt={movieTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            // Add these attributes for better loading
            loading="eager"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-gray-400 text-lg">No image available</span>
          </div>
        )}
      </div>
      
      {/* YouTube-style Play Button Overlay */}
      {trailerUrl && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={handlePlayTrailer}
            className="group/play"
            aria-label={`Watch ${movieTitle} trailer`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-4 bg-red-600 rounded-full opacity-30"></div>
              <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-300 shadow-2xl transform group-hover/play:scale-110">
                <Play size={32} className="text-white ml-1" fill="white" />
              </div>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className="text-white font-semibold text-lg bg-black/50 px-3 py-1 rounded-full">
                  Watch Trailer
                </span>
              </div>
            </div>
          </button>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 z-30 p-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="text-white">
            {movieBackgroundTitle && (
              <p className="text-sm font-medium text-gray-300 mb-2">
                {movieBackgroundTitle}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {movieTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {releaseDate && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {new Date(releaseDate).getFullYear()}
                </span>
              )}
              {duration > 0 && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {formatDuration(duration)}
                </span>
              )}
              {genreTags?.map((genre, idx) => (
                <Link
                  key={idx}
                  href={`/reviews?genre=${encodeURIComponent(genre)}`}
                  className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>
          
          {/* TMDB Rating */}
          {tmdbRating && (
            <div className="bg-black/60 backdrop-blur-lg rounded-xl p-6 text-center border border-white/20">
              <div className="text-3xl font-bold text-yellow-400 mb-1">
                {tmdbRating.numeric}
              </div>
              <div className="text-yellow-300 mb-2">
                {tmdbRating.stars}
              </div>
              <div className="text-xs text-gray-300">
                TMDB Rating
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}