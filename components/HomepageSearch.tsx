// components/HomepageSearch.tsx - UPDATED VERSION
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface Suggestion {
  id: string
  title: string
  type: 'movie' | 'director' | 'actor'
  posterUrl?: string
}

export default function HomepageSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the search
    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/reviews?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.title)
    setShowSuggestions(false)
    
    // Navigate based on suggestion type
    if (suggestion.type === 'movie') {
      router.push(`/post/${suggestion.id}`)
    } else {
      // For director or actor, search for their name
      router.push(`/reviews?search=${encodeURIComponent(suggestion.title)}`)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="max-w-2xl mx-auto mb-8" ref={searchRef}>
      <div className="relative">
        <form onSubmit={handleSearch}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Search movies, directors, actors..."
            className="w-full px-6 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-white pr-20"
            autoComplete="off"
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
            <button 
              type="submit"
              disabled={!searchQuery.trim()}
              className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-gray-300"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      {suggestion.posterUrl ? (
                        <img 
                          src={suggestion.posterUrl} 
                          alt={suggestion.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {suggestion.type === 'movie' ? '🎬' : 
                           suggestion.type === 'director' ? '🎥' : '👤'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {suggestion.type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                No matches found
              </div>
            )}
            
            {/* Search all results option */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-3 text-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                Search for "{searchQuery}" in all reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}