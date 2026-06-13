// hooks/usePageVisibility.ts
'use client'

import { useEffect, useState, useCallback } from 'react'

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true)

  const handleVisibilityChange = useCallback(() => {
    setIsVisible(!document.hidden)
  }, [])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  return isVisible
}