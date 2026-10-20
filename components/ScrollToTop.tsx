'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      setIsVisible(window.scrollY > 300)
    }

    toggleVisibility()
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="animate-fade-up fixed bottom-6 right-6 z-[9999] flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/40 bg-ink-900/90 text-gold-400 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-gold-400 hover:text-ink-950"
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </button>
  )
}