// components/AuthorProfileModal.tsx - FULL UPDATED CODE
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, User, Users, Calendar, Mail, MapPin, Link as LinkIcon, Film, MessageCircle, ChevronUp, Facebook, Instagram, Twitter, Linkedin, Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { FollowButton } from '@/components/FollowButton'

interface UserProfile {
  id: string
  name: string
  avatar_url: string | null
  banner_url: string | null
  bio?: string
  website?: string
  location?: string
  joined_at?: string
  facebook_url?: string | null
  instagram_url?: string | null
  twitter_url?: string | null
  linkedin_url?: string | null
  follower_count?: number
  following_count?: number
}

interface Post {
  id: string
  movie_title: string
  movie_poster_url: string
  published_at: string
  view_count: number
}

interface FollowStats {
  totalPosts: number
  totalFollowers: number
  totalFollowing: number
}

interface SocialLink {
  key: keyof UserProfile
  label: string
  icon: React.ReactNode
  domain: string
  baseUrl: string
}

interface FollowUser {
  id: string
  name: string
  avatar_url: string | null
}

interface AuthorProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export function AuthorProfileModal({ userId, isOpen, onClose, currentUserId }: AuthorProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [followStats, setFollowStats] = useState<FollowStats>({ totalPosts: 0, totalFollowers: 0, totalFollowing: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'follow'>('about')
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [followSubTab, setFollowSubTab] = useState<'followers' | 'following'>('followers')
  const [isScrolled, setIsScrolled] = useState(false)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Social links configuration
  const socialLinks: SocialLink[] = [
    { 
      key: 'facebook_url', 
      label: 'Facebook', 
      icon: <Facebook size={20} />,
      domain: 'facebook.com',
      baseUrl: 'https://facebook.com/'
    },
    { 
      key: 'instagram_url', 
      label: 'Instagram', 
      icon: <Instagram size={20} />,
      domain: 'instagram.com',
      baseUrl: 'https://instagram.com/'
    },
    { 
      key: 'twitter_url', 
      label: 'Twitter', 
      icon: <Twitter size={20} />,
      domain: 'twitter.com',
      baseUrl: 'https://twitter.com/'
    },
    { 
      key: 'linkedin_url', 
      label: 'LinkedIn', 
      icon: <Linkedin size={20} />,
      domain: 'linkedin.com',
      baseUrl: 'https://linkedin.com/in/'
    }
  ]

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfileData()
    }
  }, [isOpen, userId])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleScroll = () => {
      if (modalContentRef.current) {
        const scrolled = modalContentRef.current.scrollTop > 20
        setIsScrolled(scrolled)
      }
    }

    const contentElement = modalContentRef.current
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll)
      return () => contentElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const fetchProfileData = async () => {
    setIsLoading(true)
    
    try {
      // Fetch profile with social links
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData)
      }

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, movie_title, movie_poster_url, published_at, view_count')
        .eq('user_id', userId)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false })
        .limit(12)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
      } else {
        setPosts(postsData || [])
      }

      // Fetch follow stats
      const totalPosts = postsData?.length || 0
      
      // Get follower count (users who follow this profile)
      const { count: followersCount, error: followersCountError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      if (followersCountError) {
        console.error('Error fetching followers count:', followersCountError)
      }

      // Get following count (users this profile follows)
      const { count: followingCount, error: followingCountError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      if (followingCountError) {
        console.error('Error fetching following count:', followingCountError)
      }

      setFollowStats({
        totalPosts,
        totalFollowers: followersCount || 0,
        totalFollowing: followingCount || 0
      })

      // Fetch followers and following lists
      await fetchFollowersList()
      await fetchFollowingList()

    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFollowersList = async () => {
    try {
      // First, get the follower IDs
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)

      if (followsError) {
        console.error('Error fetching follows data:', followsError)
        setFollowers([])
        return
      }

      if (!followsData || followsData.length === 0) {
        setFollowers([])
        return
      }

      // Get the follower IDs array
      const followerIds = followsData.map(item => item.follower_id)

      // Fetch profiles for these follower IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', followerIds)

      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError)
        setFollowers([])
        return
      }

      // Format the data
      const formattedFollowers: FollowUser[] = profilesData.map(profile => ({
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url
      }))

      setFollowers(formattedFollowers)
    } catch (error) {
      console.error('Error in fetchFollowersList:', error)
      setFollowers([])
    }
  }

  const fetchFollowingList = async () => {
    try {
      // First, get the following IDs
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (followsError) {
        console.error('Error fetching follows data:', followsError)
        setFollowing([])
        return
      }

      if (!followsData || followsData.length === 0) {
        setFollowing([])
        return
      }

      // Get the following IDs array
      const followingIds = followsData.map(item => item.following_id)

      // Fetch profiles for these following IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', followingIds)

      if (profilesError) {
        console.error('Error fetching following profiles:', profilesError)
        setFollowing([])
        return
      }

      // Format the data
      const formattedFollowing: FollowUser[] = profilesData.map(profile => ({
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url
      }))

      setFollowing(formattedFollowing)
    } catch (error) {
      console.error('Error in fetchFollowingList:', error)
      setFollowing([])
    }
  }

  const handleFollowChange = (isFollowing: boolean) => {
    // Update follow stats
    setFollowStats(prev => ({
      ...prev,
      totalFollowers: isFollowing ? prev.totalFollowers + 1 : Math.max(0, prev.totalFollowers - 1)
    }))
    
    // Refresh followers and following lists
    if (activeTab === 'follow') {
      fetchFollowersList()
      fetchFollowingList()
    }
  }

  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Function to check if a social link exists and is valid
  const hasValidSocialLink = (socialKey: keyof UserProfile): boolean => {
    const url = profile?.[socialKey] as string | null | undefined
    if (!url) return false
    
    const social = socialLinks.find(s => s.key === socialKey)
    return !!social
  }

  // Function to get social link URL
  const getSocialLinkUrl = (socialKey: keyof UserProfile): string => {
    return profile?.[socialKey] as string || '#'
  }

  const SafeImage = ({ src, alt, className, fallback }: { 
    src: string | null, 
    alt: string, 
    className: string,
    fallback?: React.ReactNode
  }) => {
    if (!src) {
      return <div className={className}>{fallback}</div>
    }

    const isConfiguredDomain = src.includes('image.tmdb.org')
    
    if (isConfiguredDomain) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          unoptimized={true}
        />
      )
    } else {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
        />
      )
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-101 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-black/90 hover:bg-black backdrop-blur-sm flex items-center justify-center text-white transition-colors z-50 hover:scale-110 active:scale-95 shadow-2xl border-2 border-white/50"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>

          {/* Scroll to top button */}
          {isScrolled && (
            <button
              onClick={scrollToTop}
              className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-black/90 hover:bg-black backdrop-blur-sm flex items-center justify-center text-white transition-colors z-50 hover:scale-110 active:scale-95 shadow-2xl border-2 border-white/50"
              aria-label="Scroll to top"
            >
              <ChevronUp size={24} />
            </button>
          )}

          {/* Modal content */}
          <div 
            ref={modalContentRef}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-300 dark:border-gray-700 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className="h-48 bg-linear-to-r from-blue-500 to-purple-600 relative">
              {profile?.banner_url ? (
                <SafeImage
                  src={profile.banner_url}
                  alt="Banner"
                  className="object-cover"
                  fallback={<div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-600" />}
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-600" />
              )}
              
              {/* Publisher name in banner center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg text-center px-4">
                  {profile?.name || 'User Profile'}
                </h1>
              </div>
            </div>

            {/* Profile header */}
            <div className="px-4 md:px-8 pb-6 -mt-12 relative">
              {/* Avatar */}
              <div className="relative flex justify-center">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-gray-900 bg-gray-300 dark:bg-gray-700 overflow-hidden">
                  {profile?.avatar_url ? (
                    <SafeImage
                      src={profile.avatar_url}
                      alt={profile.name || 'User'}
                      className="object-cover w-full h-full"
                      fallback={
                        <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl text-gray-600 dark:text-gray-300">
                          {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl md:text-4xl text-gray-600 dark:text-gray-300">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons - Centered (Only Follow button now) */}
              <div className="flex items-center justify-center gap-2 md:gap-3 mt-4 flex-wrap">
                <FollowButton
                  targetUserId={userId}
                  targetUserName={profile?.name}
                  currentUserId={currentUserId}
                  size="lg"
                  showCount={false}
                  onFollowChange={handleFollowChange}
                />
              </div>

              {/* Stats - Centered */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 md:mt-8 mb-4 md:mb-6 max-w-md">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {followStats.totalPosts}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Posts</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {followStats.totalFollowers}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Followers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      {followStats.totalFollowing}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Following</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-navigation - Centered */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30">
              <div className="flex justify-center">
                <nav className="flex p-1">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'about'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'posts'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Movie Reviews
                  </button>
                  <button
                    onClick={() => setActiveTab('follow')}
                    className={`px-4 md:px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'follow'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    Follow
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                </div>
              ) : (
                <>
                  {/* About Tab - Centered Content */}
                  {activeTab === 'about' && (
                    <div className="space-y-8">
                      {/* Bio Section - Centered */}
                      {profile?.bio && (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bio</h3>
                          <div className="max-w-2xl mx-auto">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {profile.bio}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Social Links Section - Centered */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
                        <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
                          {socialLinks.map((social) => {
                            const hasLink = hasValidSocialLink(social.key)
                            const url = getSocialLinkUrl(social.key)
                            
                            return (
                              <div key={social.key} className="flex flex-col items-center">
                                {hasLink ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center group"
                                  >
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-colors mb-2">
                                      <div className="text-gray-600 dark:text-gray-400 group-hover:text-white dark:group-hover:text-black transition-colors">
                                        {social.icon}
                                      </div>
                                    </div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                                      {social.label}
                                    </span>
                                  </a>
                                ) : (
                                  <div className="flex flex-col items-center opacity-50">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                      <div className="text-gray-400 dark:text-gray-600">
                                        {social.icon}
                                      </div>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-500">
                                      {social.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          
                          {/* Website Link - Center aligned */}
                          {profile?.website && (
                            <div className="flex flex-col items-center">
                              <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center group"
                              >
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white transition-colors mb-2">
                                  <Globe className="text-gray-600 dark:text-gray-400 group-hover:text-white dark:group-hover:text-black transition-colors" size={20} />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                                  Website
                                </span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Profile Details - Centered Grid */}
                      {(profile?.location || profile?.joined_at) && (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Details</h3>
                          <div className="max-w-md mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {profile?.location && (
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <MapPin className="text-gray-600 dark:text-gray-400 mb-2" size={20} />
                                  <span className="text-gray-700 dark:text-gray-300">{profile.location}</span>
                                </div>
                              )}
                              
                              {profile?.joined_at && (
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <Calendar className="text-gray-600 dark:text-gray-400 mb-2" size={20} />
                                  <span className="text-gray-700 dark:text-gray-300">Joined {formatDate(profile.joined_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Empty State - Centered */}
                      {!profile?.bio && !profile?.location && !profile?.website && !profile?.joined_at && 
                       !socialLinks.some(social => hasValidSocialLink(social.key)) && (
                        <div className="text-center py-8">
                          <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No profile information available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Posts Tab - Center aligned grid */}
                  {activeTab === 'posts' && (
                    <div>
                      {posts.length > 0 ? (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Movie Reviews</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 justify-items-center">
                            {posts.map((post) => (
                              <Link
                                key={post.id}
                                href={`/post/${post.id}`}
                                className="group block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors w-full max-w-xs"
                                onClick={onClose}
                              >
                                <div className="aspect-2/3 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                  {post.movie_poster_url ? (
                                    <SafeImage
                                      src={post.movie_poster_url}
                                      alt={post.movie_title}
                                      className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
                                      fallback={
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Film size={32} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                      }
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Film size={32} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-3 text-center">
                                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 text-sm">
                                    {post.movie_title}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatDate(post.published_at)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {post.view_count} views
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 md:py-12">
                          <Film size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">No movie reviews yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow Tab - With Followers and Following Sub-tabs */}
                  {activeTab === 'follow' && (
                    <div>
                      {/* Sub-tabs for Followers/Following */}
                      <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFollowSubTab('followers')}
                            className={`px-6 py-2 font-medium transition-colors border-b-2 ${
                              followSubTab === 'followers'
                                ? 'border-black dark:border-white text-black dark:text-white'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            Followers ({followStats.totalFollowers})
                          </button>
                          <button
                            onClick={() => setFollowSubTab('following')}
                            className={`px-6 py-2 font-medium transition-colors border-b-2 ${
                              followSubTab === 'following'
                                ? 'border-black dark:border-white text-black dark:text-white'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            Following ({followStats.totalFollowing})
                          </button>
                        </div>
                      </div>

                      {/* Followers List - No follow buttons (these people already follow the profile owner) */}
                      {followSubTab === 'followers' && (
                        <div>
                          {followers.length > 0 ? (
                            <div className="max-w-lg mx-auto space-y-3">
                              {followers.map((follower) => (
                                <div 
                                  key={follower.id} 
                                  className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Profile Image */}
                                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden shrink-0">
                                      {follower.avatar_url ? (
                                        <SafeImage
                                          src={follower.avatar_url}
                                          alt={follower.name || 'User'}
                                          className="object-cover w-full h-full"
                                          fallback={
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                                              {follower.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                          }
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-medium">
                                          {follower.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {follower.name || 'Unknown User'}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Follows {profile?.name || 'this user'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 md:py-12">
                              <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">No followers yet</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Following List - Show follow/unfollow button based on current user */}
                      {followSubTab === 'following' && (
                        <div>
                          {following.length > 0 ? (
                            <div className="max-w-lg mx-auto space-y-3">
                              {following.map((followedUser) => (
                                <div 
                                  key={followedUser.id} 
                                  className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Profile Image */}
                                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden shrink-0">
                                      {followedUser.avatar_url ? (
                                        <SafeImage
                                          src={followedUser.avatar_url}
                                          alt={followedUser.name || 'User'}
                                          className="object-cover w-full h-full"
                                          fallback={
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                                              {followedUser.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                          }
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-medium">
                                          {followedUser.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {followedUser.name || 'Unknown User'}
                                      </p>
                                      {currentUserId === userId && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          You follow them
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Follow button - Only show if current user is logged in and viewing their own profile */}
                                  {currentUserId === userId && currentUserId !== followedUser.id && (
                                    <FollowButton
                                      targetUserId={followedUser.id}
                                      targetUserName={followedUser.name}
                                      currentUserId={currentUserId}
                                      size="sm"
                                      showCount={false}
                                      onFollowChange={handleFollowChange}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 md:py-12">
                              <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                              <p className="text-gray-500 dark:text-gray-400">Not following anyone yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}