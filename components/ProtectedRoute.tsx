// components/ProtectedRoute.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSessionSync } from '@/hooks/useSessionSync'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, sessionValid } = useSessionSync()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  // Protected pages
  const protectedPaths = ['/dashboard', '/profile', '/settings', '/my-reviews']
  const isProtected = protectedPaths.some(path => pathname?.startsWith(path))

  useEffect(() => {
    if (!isLoading && isProtected && !user && !sessionValid) {
      // Redirect to login but save the return URL
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else {
      setIsChecking(false)
    }
  }, [isLoading, user, sessionValid, isProtected, router, pathname])

  if (isLoading && isProtected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isProtected && !user && !sessionValid) {
    return null // Will redirect
  }

  return <>{children}</>
}