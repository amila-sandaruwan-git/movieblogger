// components/ClientProfileDropdown.tsx - FULLY CORRECTED
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Home, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronDown,
  Star,
  Bookmark,
  Film,
  BookOpen,
  Users
} from 'lucide-react'

interface ProfileData {
  id: string
  name: string
  avatar_url: string | null
  bio?: string | null
}

interface ClientProfileDropdownProps {
  user: any
}

export function ClientProfileDropdown({ user }: ClientProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [followStats, setFollowStats] = useState({
    reviewsCount: 0,
    followerCount: 0,
    followingCount: 0
  })
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfileData()
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown')) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [user])

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, bio')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null
        })
      } else {
        setProfile(data)
      }

      await fetchFollowStats()
      await fetchBookmarkCount()

    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFollowStats = async () => {
    try {
      const { count: reviewsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'published')
        .eq('visibility', 'public')

      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id)

      setFollowStats({
        reviewsCount: reviewsCount || 0,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0
      })
    } catch (error) {
      console.error('Error fetching follow stats:', error)
    }
  }

  const fetchBookmarkCount = async () => {
    try {
      const { count } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      setBookmarkCount(count || 0)
    } catch (error) {
      console.error('Error fetching bookmark count:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div className="profile-dropdown">
        <div className="w-10 h-10 rounded-full bg-linear-to-r from-gray-200 to-gray-300 animate-pulse"></div>
      </div>
    )
  }

  const displayName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="profile-dropdown relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none group"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-all duration-200">
            {avatarUrl ? (
              // ✅ FIXED: Added parent div with relative positioning and sizes prop
              <div className="relative w-full h-full">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {userInitial}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 overflow-hidden dropdown-slide-down">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                {avatarUrl ? (
                  // ✅ FIXED: Added parent div with relative positioning and sizes prop
                  <div className="relative w-full h-full">
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                    {userInitial}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="transform transition-all duration-300 hover:scale-105">
                <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
                <p className="font-bold text-gray-900 dark:text-white">{followStats.reviewsCount}</p>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                <p className="font-bold text-gray-900 dark:text-white">{followStats.followerCount}</p>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                <p className="font-bold text-gray-900 dark:text-white">{followStats.followingCount}</p>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <p className="text-xs text-gray-500 dark:text-gray-400">Saved</p>
                <p className="font-bold text-gray-900 dark:text-white">{bookmarkCount}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: '0.15s' }}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:rotate-6" />
              </div>
              <span className="transition-all duration-300 group-hover:translate-x-1">My Profile</span>
            </Link>
            
            <Link
              href="/my-reviews"
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: '0.2s' }}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Film className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:rotate-6" />
              </div>
              <span className="transition-all duration-300 group-hover:translate-x-1">My Reviews</span>
            </Link>
            
            <Link
              href="/dashboard/reading-list"
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: '0.25s' }}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Bookmark className="w-4 h-4 text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:rotate-6" />
              </div>
              <div className="flex items-center justify-between flex-1">
                <span className="transition-all duration-300 group-hover:translate-x-1">Reading List</span>
                {bookmarkCount > 0 && (
                  <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full transition-all duration-300 group-hover:scale-110">
                    {bookmarkCount}
                  </span>
                )}
              </div>
            </Link>
            
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: '0.3s' }}
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:rotate-45" />
              </div>
              <span className="transition-all duration-300 group-hover:translate-x-1">Settings</span>
            </Link>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <LogOut className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1" />
              </div>
              <span className="transition-all duration-300 group-hover:translate-x-1">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .dropdown-slide-down {
          animation: slideDown 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
          transform-origin: top right;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
        
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateX(-5px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}