// components/AvatarWithFallback.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'

interface AvatarWithFallbackProps {
  src?: string | null
  alt?: string
  fallbackText?: string
  size?: number
  className?: string
}

export default function AvatarWithFallback({ 
  src, 
  alt = 'User', 
  fallbackText = 'U', 
  size = 56,
  className = ''
}: AvatarWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  
  if (!src || hasError) {
    return (
      <div 
        className={`bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size }}
      >
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`relative rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        sizes={`${size}px`}
      />
    </div>
  )
}