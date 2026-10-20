// components/AuthRequiredModal.tsx

'use client'

import { X, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = 'Login required',
  message = 'You need to be logged in to use this feature.',
}: Props) {
  const pathname = usePathname()
  const redirect = encodeURIComponent(pathname || '/')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  const modal = (
    <div
      className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-800 text-gray-400"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>

        <div className="space-y-2">
          <Link
            href={`/login?redirect=${redirect}`}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
          >
            <LogIn size={16} /> Login
          </Link>
          <Link
            href={`/signup?redirect=${redirect}`}
            className="w-full flex items-center justify-center gap-2 border border-gray-600 text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <UserPlus size={16} /> Create Account
          </Link>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}