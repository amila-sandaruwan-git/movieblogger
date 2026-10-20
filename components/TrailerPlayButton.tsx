'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Play, X } from 'lucide-react'
import { AuthRequiredModal } from './AuthRequiredModal'

export function TrailerPlayButton({
  trailerUrl,
  movieTitle,
  isAuthenticated,
}: {
  trailerUrl: string
  movieTitle: string
  isAuthenticated: boolean
}) {
  const [open, setOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getYoutubeId = (url: string) => {
    const m = url.match(
      /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*)/
    )
    return m && m[1] && m[1].length === 11 ? m[1] : null
  }

  const id = getYoutubeId(trailerUrl)

  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!id) return null

  const handleClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setOpen(true)
  }

  const modal = open ? (
    <div
      className="animate-fade-up fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={`${movieTitle} trailer`}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900 px-5 py-3">
          <p className="mb-display truncate text-base font-semibold text-white">
            {movieTitle} <span className="text-gold-400">· Trailer</span>
          </p>
          <button
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-gold-400 hover:text-ink-950"
            aria-label="Close trailer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative pt-[56.25%]">
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={`${movieTitle} Trailer`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        onClick={handleClick}
        className="group relative flex flex-col items-center"
        aria-label={`Watch ${movieTitle} trailer`}
      >
        <span className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-ping rounded-full bg-gold-400 opacity-30 sm:h-24 sm:w-24" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold-400 shadow-[0_0_50px_rgba(245,196,81,0.55)] ring-4 ring-white/70 transition-transform duration-200 group-hover:scale-110 sm:h-24 sm:w-24">
          <Play size={36} className="ml-1 text-ink-950" fill="currentColor" strokeWidth={0} />
        </span>
        <span className="mt-3 rounded-full border border-white/25 bg-black/70 px-4 py-1.5 text-sm font-semibold tracking-wide text-white shadow-lg backdrop-blur transition-colors group-hover:border-gold-400 group-hover:text-gold-300">
          Watch Trailer
        </span>
      </button>

      <AuthRequiredModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Login required to watch trailer"
        message="Create a free account or login to watch the trailer."
      />

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  )
}

export default TrailerPlayButton