'use client'

import { useRouter } from 'next/navigation'

export function useRequireAuth() {
  const router = useRouter()

  const requireAuth = (action?: () => void) => {
    // Read the auth cookie directly — this is only a hint, the server still enforces
    const hasSession =
      typeof document !== 'undefined' &&
      document.cookie.split(';').some((c) => c.trim().startsWith('sb-'))

    if (!hasSession) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return false
    }
    action?.()
    return true
  }

  return { requireAuth }
}