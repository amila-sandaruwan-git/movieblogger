// components/HomepageSearch.tsx


'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface Suggestion { id: string; title: string; type: string; posterUrl?: string }

export default function HomepageSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) { setSuggestions(await res.json()); setShow(true) }
      } catch {}
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      setShow(false)
      router.push(`/reviews?search=${encodeURIComponent(query.trim())}`)
    }
  }

  const pick = (s: Suggestion) => {
    setShow(false)
    if (s.type === 'movie') router.push(`/post/${s.id}`)
    else router.push(`/reviews?search=${encodeURIComponent(s.title)}`)
  }

  return (
    <div className="max-w-2xl mx-auto mb-8 relative" ref={ref}>
      <form onSubmit={submit}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShow(true) }}
          onFocus={() => suggestions.length > 0 && setShow(true)}
          placeholder="Search movies, directors, actors..."
          className="w-full px-6 py-4 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSuggestions([]); setShow(false) }} className="p-2 text-gray-500">
              <X size={18} />
            </button>
          )}
          <button type="submit" disabled={!query.trim()} className="bg-black text-white p-3 rounded-full hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black">
            <Search size={20} />
          </button>
        </div>
      </form>

      {show && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 text-center">Searching...</div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((s) => (
                <button key={`${s.type}-${s.id}`} onClick={() => pick(s)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                    {s.posterUrl ? <img src={s.posterUrl} alt={s.title} className="w-full h-full object-cover rounded" /> : <span>{s.type === 'movie' ? '🎬' : '🎥'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate dark:text-white">{s.title}</div>
                    <div className="text-xs text-gray-500 capitalize">{s.type}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">No matches</div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => submit()} className="w-full px-4 py-3 text-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium">
              Search "{query}" in all reviews
            </button>
          </div>
        </div>
      )}
    </div>
  )
}