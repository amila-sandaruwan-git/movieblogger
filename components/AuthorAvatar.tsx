// components/AuthorAvatar.tsx
'use client'

interface AuthorAvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function AuthorAvatar({ src, name = 'User', size = 'md' }: AuthorAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-base',
    lg: 'w-20 h-20 text-lg'
  }

  const initials = name?.charAt(0).toUpperCase() || 'U'

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 dark:border-gray-600 object-cover`}
    />
  )
}