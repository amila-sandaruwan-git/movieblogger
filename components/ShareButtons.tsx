// components/ShareButtons.tsx
'use client'

import { Share2, Link } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface ShareButtonsProps {
  title: string
  url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  let hoverTimeout: NodeJS.Timeout

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const shareActions = [
    {
      name: 'Facebook',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
      onClick: () => window.open(shareLinks.facebook, '_blank', 'noopener,noreferrer')
    },
    {
      name: 'X (Twitter)',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
      onClick: () => window.open(shareLinks.twitter, '_blank', 'noopener,noreferrer')
    },
    {
      name: 'WhatsApp',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
      onClick: () => window.open(shareLinks.whatsapp, '_blank', 'noopener,noreferrer')
    },
    {
      name: 'Telegram',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
      onClick: () => window.open(shareLinks.telegram, '_blank', 'noopener,noreferrer')
    },
    {
      name: 'LinkedIn',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
      onClick: () => window.open(shareLinks.linkedin, '_blank', 'noopener,noreferrer')
    },
    {
      name: 'Copy Link',
      icon: null,
      customIcon: Link,
      onClick: copyToClipboard
    }
  ]

  return (
    <div 
      className="relative inline-block" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Share Button Trigger */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          isOpen 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        aria-label="Share options"
        aria-expanded={isOpen}
      >
        <Share2 size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        <span className="text-sm font-medium">Share</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 z-9999"
          style={{ 
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem'
          }}
        >
          <div className="backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-linear-to-r from-gray-50/50 to-transparent dark:from-gray-800/30">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Share this review
              </p>
            </div>

            {/* Share Options */}
            <div className="py-2 max-h-96 overflow-y-auto">
              {shareActions.map((action, index) => (
                <button
                  key={action.name}
                  onClick={() => {
                    action.onClick()
                    if (action.name !== 'Copy Link') {
                      setTimeout(() => setIsOpen(false), 300)
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
                >
                  {/* Platform Logo */}
                  <div className="w-6 h-6 flex items-center justify-center">
                    {action.icon ? (
                      <img 
                        src={action.icon} 
                        alt={action.name}
                        className="w-5 h-5 object-contain"
                      />
                    ) : action.customIcon ? (
                      <action.customIcon size={18} className="text-gray-600 dark:text-gray-400" />
                    ) : null}
                  </div>
                  
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {action.name}
                  </span>
                  
                  {action.name === 'Copy Link' && copied && (
                    <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">
                      Copied!
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-linear-to-r from-gray-50/80 to-gray-100/30 dark:from-gray-800/50 dark:to-gray-900/30 border-t border-gray-200/50 dark:border-gray-700/50">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Share with your friends 🌟
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}