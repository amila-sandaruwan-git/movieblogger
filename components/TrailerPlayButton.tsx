// components/TrailerPlayButton.tsx - FIXED with hover text
'use client'

import { Play, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface TrailerPlayButtonProps {
  trailerUrl: string
  movieTitle: string
}

export default function TrailerPlayButton({ trailerUrl, movieTitle }: TrailerPlayButtonProps) {
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const youtubeId = extractYouTubeId(trailerUrl)

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowPopup(true)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPopup) {
        setShowPopup(false)
      }
    }

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Prevent scrolling on body
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.style.position = 'static'
    }
  }, [showPopup])

  if (!youtubeId) return null

  return (
    <>
      <button
        onClick={handlePlayClick}
        className="group/play relative flex flex-col items-center justify-center"
        aria-label={`Watch ${movieTitle} trailer`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-4 bg-red-600 rounded-full opacity-30"></div>
          <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-300 shadow-2xl transform group-hover/play:scale-110">
            <Play size={32} className="text-white ml-1" fill="white" />
          </div>
        </div>
        
        {/* Hover text - appears on hover */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/play:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          <span className="text-white font-semibold text-sm bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/30 shadow-xl">
            Watch Trailer
          </span>
        </div>
      </button>

      {/* YouTube Popup Modal - HIGHER Z-INDEX */}
      {showPopup && (
        <>
          {/* Backdrop - HIGHEST Z-INDEX */}
          <div 
            className="fixed inset-0 z-99999 bg-black/95"
            onClick={() => setShowPopup(false)}
          />
          
          {/* Player container - EVEN HIGHER */}
          <div 
            ref={popupRef}
            className="fixed inset-0 z-100000 flex items-center justify-center p-2 sm:p-4"
          >
            <div className="relative w-full max-w-3xl bg-black rounded overflow-hidden">
              {/* Close button top right */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-3 right-3 z-10 flex items-center justify-center w-10 h-10 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                aria-label="Close"
              >
                <X size={24} />
              </button>
              
              {/* YouTube iframe */}
              <div className="relative pt-[56.25%]">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&controls=1`}
                  title={`${movieTitle} Trailer`}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  frameBorder="0"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}