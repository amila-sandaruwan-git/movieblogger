// components/FullReviewPopup.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, Copy, Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import PostContent from './PostContent'

interface FullReviewPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  movieTitle: string
}

export function FullReviewPopup({ isOpen, onClose, title, content, movieTitle }: FullReviewPopupProps) {
  const [mounted, setMounted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
      document.body.style.left = '0'
      document.body.style.right = '0'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.left = ''
      document.body.style.right = ''
      window.scrollTo(0, scrollPositionRef.current)
      setIsFullscreen(false)
    }
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.left = ''
      document.body.style.right = ''
    }
  }, [isOpen])

  // Handle scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
        setScrollProgress(progress)
      }
    }

    const contentElement = contentRef.current
    if (contentElement && isOpen) {
      contentElement.addEventListener('scroll', handleScroll)
      return () => contentElement.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (!mounted || !isOpen) return null

  const ModalContent = () => (
    <div 
      className="fixed inset-0 z-99999 flex flex-col"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
        zIndex: 99999,
      }}
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-red-500 z-100000" style={{ width: `${scrollProgress}%` }} />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f] border-b border-[#272727] px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
              <span className="text-xl">📖</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-semibold text-white truncate">{movieTitle}</h1>
              <p className="text-xs text-[#aaa] truncate">Full Review</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-10 h-10 rounded-full hover:bg-[#272727] transition-colors flex items-center justify-center"
              title="Copy link"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-[#aaa]" />
              )}
            </button>
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full hover:bg-[#272727] transition-colors flex items-center justify-center"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 size={18} className="text-[#aaa]" />
              ) : (
                <Maximize2 size={18} className="text-[#aaa]" />
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[#272727] transition-colors flex items-center justify-center"
              title="Close"
            >
              <X size={20} className="text-[#aaa]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Title Section */}
          <div className="mb-8 pb-4 border-b border-[#272727]">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title || movieTitle}</h2>
            <div className="flex items-center gap-4 text-sm text-[#777]">
              <span>Full Review</span>
              <span>•</span>
              <span>In-depth analysis</span>
            </div>
          </div>

          {/* Review Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <PostContent content={content} />
          </div>
          
          {/* Footer Note */}
          <div className="mt-12 pt-6 border-t border-[#272727] text-center">
            <p className="text-xs text-[#555">
              © MovieBlogger - Share your thoughts about this movie
            </p>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={() => {
          contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 flex items-center justify-center shadow-lg z-20 ${
          scrollProgress > 10 ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        }`}
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      <style jsx>{`
        .prose {
          color: #e5e5e5;
        }
        .prose h1, .prose h2, .prose h3, .prose h4 {
          color: white;
        }
        .prose p {
          color: #ccc;
          line-height: 1.8;
        }
        .prose a {
          color: #ef4444;
        }
        .prose strong {
          color: white;
        }
        .prose blockquote {
          border-left-color: #ef4444;
          background: #1a1a1a;
          color: #ccc;
        }
        .prose code {
          background: #1a1a1a;
          color: #ef4444;
        }
      `}</style>
    </div>
  )

  return createPortal(<ModalContent />, document.body)
}