// app/page.tsx - With working infinite carousel and session fix
'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import HomepageSearch from '@/components/HomepageSearch'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'
import { useClientSession } from '@/hooks/useClientSession'
import { useEdgeFix } from '@/hooks/useEdgeFix'
import Footer from '@/components/Footer'  // ADDED: Import Footer

import { Star, Calendar, Clock, Globe, Film, ChevronRight, TrendingUp, Users, Zap, Award, Heart, Loader2, MessageCircle, Eye, ThumbsUp, Sparkles, Flame, Tv, Monitor, Headphones } from 'lucide-react'

interface Post {
  id: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'private' | 'scheduled'
  visibility: 'public' | 'private' | 'draft'
  created_at: string
  movie_title: string
  movie_background_title: string
  movie_poster_url: string
  release_date: string
  director: string
  cast: string[]
  genre_tags: string[]
  duration: number
  review_language: string
  trailer_url: string
  tags: string[]
  scheduled_for: string | null
  published_at: string
  comments_enabled: boolean
  user_id: string
  tmdb_rating: number | null
  tmdb_id: number | null
  movie_language: string | null
  view_count?: number
}

interface PostWithEngagement extends Post {
  likes_count: number
  comments_count: number
  engagement_score: number
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  bio?: string
  review_count?: number
  follower_count?: number
  following_count?: number
}

// Typing paragraphs constant
const TYPING_PARAGRAPHS = [
  (name: string) => `Welcome back, ${name}! Ready for movie magic?`,
  (name: string) => `Hey ${name}! Discover your next favorite film.`,
  (name: string) => `Great to see you, ${name}! Let's explore cinema together.`
]

export default function Home() {
  // Session sync hook - fixes the tab switch issue
  const { user: clientUser, isLoading: sessionLoading, sessionChecked } = useClientSession()
  
  const [user, setUser] = useState<any>(null)
  const [userWithProfile, setUserWithProfile] = useState<any>(null)
  const [profileName, setProfileName] = useState('User')
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [topPosts, setTopPosts] = useState<PostWithEngagement[]>([])
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({})
  const [engagementCounts, setEngagementCounts] = useState<Record<string, { likes: number; comments: number; views: number }>>({})
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Sync client session with user state
  useEffect(() => {
    if (sessionChecked && clientUser !== undefined) {
      setUser(clientUser)
    }
  }, [clientUser, sessionChecked])
  
  // Typing animation states for hero section
  const [typingText, setTypingText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [currentParagraph, setCurrentParagraph] = useState(0)
  const [showStaticText, setShowStaticText] = useState(false)
  
  // Carousel scroll animation refs
  const carouselRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const scrollPositionRef = useRef(0)
  const isAnimatingRef = useRef(true)
  const lastScrollPositionRef = useRef(0)
  
  // Typing animation refs
  const typingContainerRef = useRef<HTMLDivElement>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const dataFetchedRef = useRef<boolean>(false)
  const animationActiveRef = useRef<boolean>(false)
  const userNameRef = useRef<string>('User')
  const shouldContinueLoopRef = useRef<boolean>(true)

  const supabase = createClient()

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 2
        })
      }, 30)
      return () => clearInterval(interval)
    }
  }, [isLoading])

  // Memoized values for performance
  const allGenres = useMemo(() => {
    return Array.from(new Set(posts.flatMap(post => post.genre_tags || [])))
  }, [posts])

  // Create doubled array for infinite loop effect
  const carouselItems = useMemo(() => {
    if (topPosts.length === 0) return []
    return [...topPosts, ...topPosts, ...topPosts] // Triple for smoother loop
  }, [topPosts])

  // Optimized carousel animation with infinite loop - FIXED to start automatically
  const startCarouselAnimation = useCallback(() => {
    if (!carouselRef.current || carouselItems.length === 0) return
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
    
    const carousel = carouselRef.current
    const totalWidth = carousel.scrollWidth / 3 // Because we have 3 copies
    const speed = 0.5 // Reduced speed for smoother animation
    
    let lastTimestamp = 0
    let lastScrollPosition = scrollPositionRef.current
    
    const animate = (timestamp: number) => {
      if (!isAnimatingRef.current) return
      if (!carousel) {
        animationRef.current = undefined
        return
      }
      
      if (!lastTimestamp) {
        lastTimestamp = timestamp
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      
      const delta = Math.min(timestamp - lastTimestamp, 32)
      lastTimestamp = timestamp
      
      // Move scroll position based on delta for smoother animation
      lastScrollPosition += speed * (delta / 16)
      scrollPositionRef.current = lastScrollPosition
      
      // Reset when reaching the end of first set
      if (scrollPositionRef.current >= totalWidth) {
        scrollPositionRef.current -= totalWidth
        lastScrollPosition = scrollPositionRef.current
        carousel.scrollLeft = scrollPositionRef.current
      } else {
        carousel.scrollLeft = scrollPositionRef.current
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    isAnimatingRef.current = true
    animationRef.current = requestAnimationFrame(animate)
  }, [carouselItems.length])

  const stopCarouselAnimation = useCallback(() => {
    isAnimatingRef.current = false
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = undefined
    }
  }, [])

  const handleMouseEnterCarousel = useCallback(() => {
    stopCarouselAnimation()
  }, [stopCarouselAnimation])

  const handleMouseLeaveCarousel = useCallback(() => {
    startCarouselAnimation()
  }, [startCarouselAnimation])

  // Reset carousel when topPosts changes and start animation automatically
  useEffect(() => {
    if (topPosts.length > 0) {
      const timer = setTimeout(() => {
        if (carouselRef.current) {
          scrollPositionRef.current = 0
          carouselRef.current.scrollLeft = 0
          lastScrollPositionRef.current = 0
          isAnimatingRef.current = true
          startCarouselAnimation()
        }
      }, 200)
      
      return () => {
        clearTimeout(timer)
        stopCarouselAnimation()
      }
    }
  }, [topPosts, startCarouselAnimation, stopCarouselAnimation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCarouselAnimation()
    }
  }, [stopCarouselAnimation])

  // Function to stop all typing animations
  const stopTypingAnimation = () => {
    shouldContinueLoopRef.current = false
    animationActiveRef.current = false
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = undefined
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = undefined
    }
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current)
      deleteTimeoutRef.current = undefined
    }
    setIsTyping(false)
    setShowCursor(false)
    setTypingText('')
  }

  // Improved typing animation function
  const startTypingAnimation = () => {
    if (!user || !profileName || animationActiveRef.current || !shouldContinueLoopRef.current) {
      return
    }
    
    animationActiveRef.current = true
    setShowStaticText(false)
    
    let currentParagraphIndex = currentParagraph
    
    const animateParagraph = () => {
      if (!shouldContinueLoopRef.current || !animationActiveRef.current) {
        animationActiveRef.current = false
        return
      }
      
      const currentMessage = TYPING_PARAGRAPHS[currentParagraphIndex](profileName)
      
      setIsTyping(true)
      setShowCursor(true)
      
      let currentIndex = 0
      
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = undefined
      }
      
      typingIntervalRef.current = setInterval(() => {
        if (!shouldContinueLoopRef.current || !animationActiveRef.current) {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
            typingIntervalRef.current = undefined
          }
          return
        }
        
        if (currentIndex <= currentMessage.length) {
          setTypingText(currentMessage.substring(0, currentIndex))
          currentIndex++
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
            typingIntervalRef.current = undefined
          }
          setIsTyping(false)
          
          if (!shouldContinueLoopRef.current || !animationActiveRef.current) return
          
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current)
            pauseTimeoutRef.current = undefined
          }
          
          pauseTimeoutRef.current = setTimeout(() => {
            if (!shouldContinueLoopRef.current || !animationActiveRef.current) return
            
            setIsTyping(true)
            let deleteIndex = currentMessage.length
            
            if (typingIntervalRef.current) {
              clearInterval(typingIntervalRef.current)
              typingIntervalRef.current = undefined
            }
            
            typingIntervalRef.current = setInterval(() => {
              if (!shouldContinueLoopRef.current || !animationActiveRef.current) {
                if (typingIntervalRef.current) {
                  clearInterval(typingIntervalRef.current)
                  typingIntervalRef.current = undefined
                }
                return
              }
              
              if (deleteIndex > 0) {
                setTypingText(currentMessage.substring(0, deleteIndex))
                deleteIndex--
              } else {
                if (typingIntervalRef.current) {
                  clearInterval(typingIntervalRef.current)
                  typingIntervalRef.current = undefined
                }
                setIsTyping(false)
                
                if (!shouldContinueLoopRef.current || !animationActiveRef.current) return
                
                const nextParagraph = (currentParagraphIndex + 1) % TYPING_PARAGRAPHS.length
                setCurrentParagraph(nextParagraph)
                
                if (deleteTimeoutRef.current) {
                  clearTimeout(deleteTimeoutRef.current)
                  deleteTimeoutRef.current = undefined
                }
                
                deleteTimeoutRef.current = setTimeout(() => {
                  if (shouldContinueLoopRef.current && animationActiveRef.current) {
                    currentParagraphIndex = nextParagraph
                    requestAnimationFrame(() => {
                      animateParagraph()
                    })
                  }
                }, 400)
              }
            }, 50)
          }, 4000)
        }
      }, 80)
    }
    
    animateParagraph()
  }

  useEffect(() => {
    stopTypingAnimation()
    
    if (!user || !profileName || profileName === 'User') {
      setShowStaticText(true)
      setTypingText('')
      return
    }
    
    shouldContinueLoopRef.current = true
    userNameRef.current = profileName
    
    const startDelay = setTimeout(() => {
      if (user && profileName && shouldContinueLoopRef.current) {
        startTypingAnimation()
      }
    }, 200)
    
    return () => {
      clearTimeout(startDelay)
      stopTypingAnimation()
    }
  }, [user, profileName])

  useEffect(() => {
    if (!isTyping && user) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev)
      }, 500)
      
      return () => clearInterval(cursorInterval)
    } else {
      setShowCursor(true)
    }
  }, [isTyping, user])

  // Fetch view counts from post_views table
  const fetchViewCounts = async (postsData: Post[]) => {
    try {
      const postIds = postsData.map(post => post.id)
      
      const { data: viewsData, error } = await supabase
        .from('post_views')
        .select('post_id')
        .in('post_id', postIds)
      
      if (error) {
        console.error('Error fetching view counts:', error)
        return
      }
      
      const countsMap: Record<string, number> = {}
      viewsData?.forEach((view: any) => {
        const postId = view.post_id.toString()
        countsMap[postId] = (countsMap[postId] || 0) + 1
      })
      
      setViewCounts(countsMap)
    } catch (error) {
      console.error('Error fetching view counts:', error)
    }
  }

  const fetchEngagementCounts = async (postsData: Post[]) => {
    try {
      const postIds = postsData.map(post => post.id)
      
      const { data: likesData } = await supabase
        .from('post_reactions')
        .select('post_id')
        .in('post_id', postIds)
        .eq('reaction_type', 'like')
      
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
      
      const countsMap: Record<string, { likes: number; comments: number; views: number }> = {}
      
      postIds.forEach(id => {
        countsMap[id] = { likes: 0, comments: 0, views: 0 }
      })
      
      likesData?.forEach(({ post_id }) => {
        if (countsMap[post_id]) {
          countsMap[post_id].likes++
        }
      })
      
      commentsData?.forEach(({ post_id }) => {
        if (countsMap[post_id]) {
          countsMap[post_id].comments++
        }
      })
      
      setEngagementCounts(countsMap)
    } catch (error) {
      console.error('Error fetching engagement counts:', error)
    }
  }

  useEffect(() => {
    if (!dataFetchedRef.current) {
      fetchData()
      dataFetchedRef.current = true
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserWithProfile(null)
        setProfileName('User')
        userNameRef.current = 'User'
        setProfileAvatar(null)
        stopTypingAnimation()
        setShowStaticText(true)
        setTypingText('')
        dataFetchedRef.current = false
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        dataFetchedRef.current = false
        fetchData()
      }
    })

    return () => {
      subscription.unsubscribe()
      stopTypingAnimation()
      stopCarouselAnimation()
    }
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', currentUser.id)
          .single()

        const name = profile?.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'
        const avatar = profile?.avatar_url || currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null

        setProfileName(name)
        userNameRef.current = name
        setProfileAvatar(avatar)

        setUserWithProfile({
          ...currentUser,
          id: currentUser.id,
          user_metadata: {
            ...currentUser.user_metadata,
            name,
            avatar_url: avatar
          }
        })
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false })
        .limit(12)

      if (postsError) {
        console.error('Error fetching posts:', postsError)
      }

      if (postsData && postsData.length > 0) {
        setPosts(postsData as Post[])
        await fetchViewCounts(postsData as Post[])
        await fetchEngagementCounts(postsData as Post[])
        await fetchTopPostsWithEngagement(postsData as Post[])

        const userIds = [...new Set(postsData.map(post => post.user_id).filter(Boolean))]
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, bio, follower_count, following_count')
            .in('id', userIds)

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError)
            
            const profilesObj: Record<string, UserProfile> = {}
            for (const userId of userIds) {
              try {
                const { data: singleProfile, error: singleError } = await supabase
                  .from('profiles')
                  .select('id, name, email, avatar_url, bio, follower_count, following_count')
                  .eq('id', userId)
                  .single()
                
                if (!singleError && singleProfile) {
                  profilesObj[userId] = {
                    id: singleProfile.id,
                    name: singleProfile.name || 'Movie Fan',
                    email: singleProfile.email,
                    avatar_url: singleProfile.avatar_url,
                    bio: singleProfile.bio,
                    follower_count: singleProfile.follower_count || 0,
                    following_count: singleProfile.following_count || 0,
                    review_count: postsData.filter(p => p.user_id === userId).length
                  }
                } else {
                  profilesObj[userId] = {
                    id: userId,
                    name: 'Movie Fan',
                    email: '',
                    avatar_url: null,
                    review_count: postsData.filter(p => p.user_id === userId).length
                  }
                }
              } catch (err) {
                console.error(`Error fetching profile for ${userId}:`, err)
                profilesObj[userId] = {
                  id: userId,
                  name: 'Movie Fan',
                  email: '',
                  avatar_url: null,
                  review_count: postsData.filter(p => p.user_id === userId).length
                }
              }
            }
            setUserProfiles(profilesObj)
          } else if (profilesData && profilesData.length > 0) {
            const profilesObj: Record<string, UserProfile> = {}
            profilesData.forEach(profile => {
              profilesObj[profile.id] = {
                id: profile.id,
                name: profile.name || 'Movie Fan',
                email: profile.email,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                follower_count: profile.follower_count || 0,
                following_count: profile.following_count || 0,
                review_count: postsData.filter(p => p.user_id === profile.id).length
              }
            })
            setUserProfiles(profilesObj)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTopPostsWithEngagement = async (postsData: Post[]) => {
    try {
      const postIds = postsData.map(post => post.id)
      
      const { data: likesData } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds)
      
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
      
      const engagementMap = new Map<string, { likes: number, comments: number }>()
      
      postIds.forEach(id => {
        engagementMap.set(id.toString(), { likes: 0, comments: 0 })
      })
      
      likesData?.forEach(reaction => {
        if (reaction.reaction_type === 'like') {
          const current = engagementMap.get(reaction.post_id.toString()) || { likes: 0, comments: 0 }
          current.likes += 1
          engagementMap.set(reaction.post_id.toString(), current)
        }
      })
      
      commentsData?.forEach(comment => {
        const current = engagementMap.get(comment.post_id.toString()) || { likes: 0, comments: 0 }
        current.comments += 1
        engagementMap.set(comment.post_id.toString(), current)
      })
      
      const postsWithEngagement: PostWithEngagement[] = postsData.map(post => {
        const engagement = engagementMap.get(post.id.toString()) || { likes: 0, comments: 0 }
        return {
          ...post,
          likes_count: engagement.likes,
          comments_count: engagement.comments,
          engagement_score: (engagement.likes * 2) + (engagement.comments * 3)
        }
      })
      
      const topEngaged = postsWithEngagement
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10)
      
      setTopPosts(topEngaged)
    } catch (error) {
      console.error('Error fetching engagement data:', error)
    }
  }

  const getMovieYear = (releaseDate: string) => {
    if (!releaseDate) return 'N/A'
    try {
      return new Date(releaseDate).getFullYear()
    } catch {
      return 'N/A'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Recently'
      
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMin = Math.floor(diffMs / (1000 * 60))
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)
      
      if (diffDay === 0) {
        if (diffHour === 0) {
          if (diffMin === 0) return 'Just now'
          return `${diffMin} min ago`
        }
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
      }
      
      if (diffDay === 1) return 'Yesterday'
      if (diffDay < 7) return `${diffDay} days ago`
      if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`
      if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Recently'
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatTMDbRating = (rating: number | null) => {
    if (!rating || rating === 0) return null
    
    return {
      numeric: rating.toFixed(1)
    }
  }

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const openAuthorProfile = (userId: string) => {
    setSelectedUserId(userId)
    setIsProfileModalOpen(true)
  }

  const handleGenreClick = (e: React.MouseEvent, genre: string) => {
    e.stopPropagation()
    e.preventDefault()
    window.location.href = `/reviews?genre=${encodeURIComponent(genre)}`
  }

  // Get top 6 genres for featured display
  const topGenres = useMemo(() => {
    const genreCounts: Record<string, number> = {}
    posts.forEach(post => {
      post.genre_tags?.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      })
    })
    return Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([genre]) => genre)
  }, [posts])

  // Loading screen with water-filling animation
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative">
            <div className="text-6xl md:text-7xl lg:text-8xl font-bold relative">
              <span className="text-gray-700">
                MovieBlogger
              </span>
              <span 
                className="absolute inset-0 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent"
                style={{
                  clipPath: `inset(0 ${100 - loadingProgress}% 0 0)`,
                  transition: 'clip-path 0.1s ease-out'
                }}
              >
                MovieBlogger
              </span>
            </div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-gray-400 mt-6 text-sm animate-pulse">
            Loading your movie experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* FIXED BANNER BACKGROUND - Hero section banner (only for hero) */}
      <div className="fixed inset-0 z-0">
        <div className="relative w-full h-full">
          <Image
            src="/banner.jpg"
            alt="Hero banner"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-gray-900/80"></div>
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="relative z-10">
        {/* Hero Section Content */}
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div 
              ref={typingContainerRef}
              className="h-35 md:h-40 flex items-center justify-center mb-6 px-4"
            >
              {user ? (
                <div className="w-full">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-snug px-2">
                    {showStaticText 
                      ? `Welcome back, ${profileName}!` 
                      : typingText
                    }
                    <span className={`inline-block w-0.75 h-[1.2em] ml-1 align-middle ${
                      isTyping ? 'bg-purple-500' : 
                      showCursor ? 'bg-purple-500 animate-pulse' : 
                      'bg-transparent'
                    }`}></span>
                  </h1>
                </div>
              ) : (
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-tight">
                  Discover Your Next Favorite Film
                </h1>
              )}
            </div>
            
            <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-12">
              {user ? 
                'Pick up where you left off or explore new cinematic treasures.' : 
                'In-depth reviews and discussions on the latest movies, classics, and hidden gems.'}
            </p>
            
            <HomepageSearch />

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-2xl md:text-3xl font-bold text-purple-400 flex items-center justify-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  {posts.length}+
                </div>
                <div className="text-sm text-gray-300 mt-2">Reviews</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-2xl md:text-3xl font-bold text-pink-400 flex items-center justify-center gap-2">
                  <Award className="w-6 h-6" />
                  {allGenres.length}+
                </div>
                <div className="text-sm text-gray-300 mt-2">Genres</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
                <div className="text-2xl md:text-3xl font-bold text-green-400 flex items-center justify-center gap-2">
                  <Users className="w-6 h-6" />
                  {Object.keys(userProfiles).length}+
                </div>
                <div className="text-sm text-gray-300 mt-2">Reviewers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the content with solid background */}
        <div className="bg-gray-900">
          <div className="container mx-auto px-4 py-8">
            {/* Top Reviews Carousel */}
            {carouselItems.length > 0 && (
              <section className="mb-20">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      Top Reviews
                    </h2>
                  </div>
                  <p className="text-gray-400">Most popular reviews from our community</p>
                </div>
                
                <div className="relative">
                  <div 
                    ref={carouselRef}
                    className="overflow-hidden cursor-grab active:cursor-grabbing"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    onMouseEnter={handleMouseEnterCarousel}
                    onMouseLeave={handleMouseLeaveCarousel}
                  >
                    <div className="flex gap-6 py-4" style={{ width: 'fit-content' }}>
                      {carouselItems.map((post, index) => {
                        const movieYear = getMovieYear(post.release_date)
                        const tmdbRating = formatTMDbRating(post.tmdb_rating)
                        const originalIndex = index % topPosts.length
                        
                        return (
                          <div 
                            key={`${post.id}-${index}`}
                            className="shrink-0 w-56 group"
                          >
                            <Link href={`/post/${post.id}`}>
                              <div className="relative overflow-hidden rounded-xl bg-gray-800 border border-gray-700 shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 group-hover:border-purple-500">
                                <div className="aspect-2/3 relative">
                                  {post.movie_poster_url ? (
                                    <>
                                      <Image
                                        src={post.movie_poster_url}
                                        alt={post.movie_title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                      <Film className="w-12 h-12 text-gray-500" />
                                    </div>
                                  )}
                                  
                                  {tmdbRating && (
                                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-lg z-10 border border-gray-600">
                                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                      <span>{tmdbRating.numeric}</span>
                                    </div>
                                  )}
                                  
                                  {movieYear && movieYear !== 'N/A' && (
                                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg z-10 border border-gray-600">
                                      {movieYear}
                                    </div>
                                  )}
                                  
                                  <div className="absolute bottom-3 right-3 bg-linear-to-r from-orange-500 to-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-10">
                                    #{originalIndex + 1}
                                  </div>
                                  
                                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 flex items-end p-4">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                      <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
                                        {post.movie_title}
                                      </h3>
                                      <div className="flex items-center gap-2 text-white/80 text-xs mb-2">
                                        {movieYear && movieYear !== 'N/A' && (
                                          <span>{movieYear}</span>
                                        )}
                                        {post.review_language && (
                                          <>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                              <Globe className="w-3 h-3" />
                                              <span>{post.review_language}</span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-white/70">
                                        <div className="flex items-center gap-1">
                                          <Heart className="w-3 h-3" />
                                          <span>{post.likes_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3" />
                                          <span>{post.comments_count || 0}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-gray-900 to-transparent pointer-events-none z-10"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-gray-900 to-transparent pointer-events-none z-10"></div>
                </div>
              </section>
            )}

            {/* Featured Reviews Section */}
            <section className="mb-20">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">
                    Featured Reviews
                  </h2>
                </div>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Discover the latest movie insights from our community of passionate reviewers
                </p>
              </div>
              
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.slice(0, 6).map((post, idx) => {
                    const profile = userProfiles[post.user_id]
                    const userName = profile?.name || 'Movie Fan'
                    const userAvatar = profile?.avatar_url || null
                    const movieYear = getMovieYear(post.release_date)
                    const engagement = engagementCounts[post.id] || { likes: 0, comments: 0, views: 0 }
                    const viewCount = viewCounts[post.id] || 0
                    const tmdbRating = formatTMDbRating(post.tmdb_rating)
                    const isHovered = hoveredPostId === post.id
                    
                    return (
                      <div 
                        key={post.id} 
                        className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-700 hover:border-purple-500"
                        onMouseEnter={() => setHoveredPostId(post.id)}
                        onMouseLeave={() => setHoveredPostId(null)}
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
                        
                        <div className="relative z-10">
                          <Link href={`/post/${post.id}`}>
                            <div className="relative overflow-hidden h-64">
                              {post.movie_poster_url ? (
                                <>
                                  <Image
                                    src={post.movie_poster_url}
                                    alt={post.movie_title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/60 to-transparent" />
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                  <Film className="w-16 h-16 text-gray-500" />
                                </div>
                              )}
                              
                              {tmdbRating && (
                                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-semibold z-10 border border-yellow-500/30">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span>{tmdbRating.numeric}</span>
                                </div>
                              )}
                              
                              {idx < 3 && (
                                <div className="absolute top-4 right-4 bg-orange-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold z-10">
                                  <Flame className="w-3 h-3" />
                                  <span>Trending</span>
                                </div>
                              )}
                            </div>
                          </Link>
                          
                          <div className="p-5">
                            <Link href={`/post/${post.id}`}>
                              <h3 className="font-bold text-xl text-white hover:text-purple-400 transition-colors line-clamp-1 mb-2">
                                {post.movie_title}
                              </h3>
                            </Link>
                            
                            {post.movie_background_title && (
                              <p className="text-gray-400 text-sm mb-3 line-clamp-1">
                                {post.movie_background_title}
                              </p>
                            )}
                            
                            {post.excerpt && (
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {truncateText(post.excerpt, 120)}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.genre_tags?.slice(0, 3).map((genre, idx) => (
                                <span 
                                  key={idx}
                                  onClick={(e) => handleGenreClick(e, genre)}
                                  className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 cursor-pointer hover:bg-purple-600 hover:text-white transition-all duration-200"
                                >
                                  {genre}
                                </span>
                              ))}
                              {(post.genre_tags?.length || 0) > 3 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-400">
                                  +{(post.genre_tags?.length || 0) - 3}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="relative cursor-pointer"
                                  onClick={() => openAuthorProfile(post.user_id)}
                                >
                                  <div className="relative w-10 h-10">
                                    {userAvatar ? (
                                      <Image
                                        src={userAvatar}
                                        alt={userName}
                                        fill
                                        className="rounded-full border-2 border-purple-500 hover:ring-2 hover:ring-purple-500/50 transition-all object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform cursor-pointer">
                                        {userName?.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <button 
                                    onClick={() => openAuthorProfile(post.user_id)}
                                    className="text-sm font-semibold text-white hover:text-purple-400 transition-colors"
                                  >
                                    {userName}
                                  </button>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(post.published_at || post.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-gray-400 group/like">
                                  <Heart className="w-4 h-4 group-hover/like:text-red-400 transition-colors" />
                                  <span className="text-sm">{engagement.likes}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-400 group/comment">
                                  <MessageCircle className="w-4 h-4 group-hover/comment:text-blue-400 transition-colors" />
                                  <span className="text-sm">{engagement.comments}</span>
                                </div>
                                {viewCount > 0 && (
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <Eye className="w-4 h-4" />
                                    <span className="text-xs">{formatViewCount(viewCount)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <Film className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No reviews yet
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">
                    Be the first to share your movie insights with our community.
                  </p>
                  {user && (
                    <Link 
                      href="/dashboard"
                      className="inline-flex items-center space-x-2 bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
                    >
                      <span>Write Your First Review</span>
                      <span>→</span>
                    </Link>
                  )}
                </div>
              )}
              
              {posts.length > 0 && (
                <div className="text-center mt-12">
                  <Link
                    href="/reviews"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 group border border-gray-700 hover:border-purple-500"
                  >
                    <span>View All Reviews</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </section>

            {/* Browse by Genre Section - WITH BANNER BACKGROUND */}
            <section className="relative -mx-4 px-4 py-16 my-8 overflow-hidden">
              {/* Banner background for Browse by Genre section */}
              <div className="absolute inset-0 z-0">
                <div className="relative w-full h-full">
                  <Image
                    src="/browse.jpg"
                    alt="Browse by Genre banner"
                    fill
                    className="object-cover"
                    quality={100}
                  />
                  <div className="absolute inset-0 bg-black/75"></div>
                  <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-gray-900"></div>
                </div>
              </div>
              
              {/* Browse by Genre Content */}
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                      <Tv className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      Browse by Genre
                    </h2>
                  </div>
                  <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                    Explore movies by your favorite genres. Click any genre to discover related reviews.
                  </p>
                </div>

                {allGenres.length > 0 ? (
                  <>
                    {topGenres.length > 0 && (
                      <div className="mb-12">
                        <h3 className="text-xl font-semibold text-white mb-6 text-center flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                          Most Popular Genres
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                          {topGenres.map((genre, index) => {
                            const genreIcons: Record<string, { icon: string; color: string }> = {
                              'Action': { icon: '💥', color: 'from-red-600 to-red-700' },
                              'Comedy': { icon: '😂', color: 'from-yellow-600 to-yellow-700' },
                              'Drama': { icon: '🎭', color: 'from-purple-600 to-purple-700' },
                              'Horror': { icon: '👻', color: 'from-gray-700 to-gray-800' },
                              'Sci-Fi': { icon: '🚀', color: 'from-cyan-600 to-blue-700' },
                              'Romance': { icon: '💖', color: 'from-pink-600 to-rose-700' },
                              'Thriller': { icon: '🔪', color: 'from-indigo-600 to-indigo-700' },
                              'Animation': { icon: '🎨', color: 'from-green-600 to-emerald-700' },
                              'Fantasy': { icon: '🧙', color: 'from-violet-600 to-purple-700' },
                              'Adventure': { icon: '🗺️', color: 'from-teal-600 to-green-700' },
                            }
                            const genreInfo = genreIcons[genre] || { icon: '🎬', color: 'from-gray-600 to-gray-700' }
                            const reviewCount = posts.filter(post => post.genre_tags?.includes(genre)).length
                            
                            return (
                              <Link
                                key={index}
                                href={`/reviews?genre=${encodeURIComponent(genre)}`}
                                onMouseEnter={() => setHoveredGenre(genre)}
                                onMouseLeave={() => setHoveredGenre(null)}
                                className="group block"
                              >
                                <div className={`
                                  bg-linear-to-br ${genreInfo.color}
                                  rounded-2xl p-5 text-center hover:shadow-2xl
                                  transition-all duration-300 transform group-hover:-translate-y-2
                                  relative overflow-hidden shadow-lg
                                `}>
                                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  <div className="relative z-10">
                                    <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                                      {genreInfo.icon}
                                    </div>
                                    <h3 className="font-bold text-white text-lg mb-2">{genre}</h3>
                                    <div className="flex items-center justify-center gap-1 text-white/80 text-sm">
                                      <span>{reviewCount}</span>
                                      <span>•</span>
                                      <span>{reviewCount === 1 ? 'review' : 'reviews'}</span>
                                    </div>
                                  </div>
                                  <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <ChevronRight className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-6 text-center">
                        All Genres
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {allGenres.map((genre, index) => {
                          const reviewCount = posts.filter(post => post.genre_tags?.includes(genre)).length
                          const genreColors = [
                            'hover:border-red-500',
                            'hover:border-blue-500',
                            'hover:border-green-500',
                            'hover:border-yellow-500',
                            'hover:border-purple-500',
                            'hover:border-pink-500',
                            'hover:border-indigo-500',
                            'hover:border-teal-500',
                          ]
                          
                          return (
                            <Link
                              key={index}
                              href={`/reviews?genre=${encodeURIComponent(genre)}`}
                              className="group block"
                            >
                              <div className={`
                                bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 text-center 
                                transition-all duration-300 transform group-hover:-translate-y-1
                                border border-gray-700 ${genreColors[index % genreColors.length]}
                                hover:shadow-lg
                              `}>
                                <h3 className="font-medium text-white text-sm group-hover:text-purple-400 transition-colors truncate">
                                  {genre}
                                </h3>
                                <p className="text-xs text-gray-300 mt-1">{reviewCount}</p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                      <Film className="w-10 h-10 text-gray-500" />
                    </div>
                    <p className="text-gray-400">
                      No genres available yet. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ============================================ */}
          {/* REMOVED: Old footer section was here */}
          {/* Footer is now imported and added below */}
          {/* ============================================ */}
          
        </div>
      </div>

      {/* Author Profile Modal */}
      {isProfileModalOpen && selectedUserId && (
        <AuthorProfileModal
          userId={selectedUserId}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUserId={user?.id}
        />
      )}

      {/* ADDED: Footer component - shows on homepage only */}
      <Footer />
    </div>
  )
}