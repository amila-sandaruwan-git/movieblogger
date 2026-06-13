// app/admin/page.tsx - FULL UPDATED CODE WITH SAME-REASON REPORTS
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Menu, 
  X, 
  MessageSquare, 
  Film, 
  Users, 
  Trash2, 
  LogOut,
  Search,
  Eye,
  User,
  Mail,
  Calendar,
  Send,
  Loader2,
  Shield,
  AlertTriangle,
  Home,
  MessageCircle,
  BarChart,
  ChevronRight,
  RefreshCw,
  Check,
  ChevronLeft,
  Database,
  ExternalLink,
  EyeOff,
  Maximize2,
  Play,
  Image,
  Clock,
  Tag,
  Star,
  Globe,
  Eye as EyeIcon,
  Heart,
  Bookmark,
  MessageSquare as MessageSquareIcon,
  Film as FilmIcon,
  User as UserIcon,
  Hash,
  MapPin,
  Link as LinkIcon,
  CalendarDays,
  EyeClosed,
  BarChart3,
  TrendingUp,
  Users as UsersIcon,
  Award,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  FileText,
  AlertOctagon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthorProfileModal } from '@/components/AuthorProfileModal'

interface Post {
  id: string
  movie_title: string
  content: string
  user_id: string
  published_at: string
  view_count: number
  status: string
  visibility: string
  movie_poster_url?: string
  movie_backdrop_url?: string
  excerpt?: string
  movie_background_title?: string
  release_date?: string
  director?: string
  cast?: string[]
  genre_tags?: string[]
  duration?: number
  review_language?: string
  imdb_id?: string
  trailer_url?: string
  categories?: string[]
  tags?: string[]
  tmdb_rating?: number
  movie_language?: string
  like_count?: number
  dislike_count?: number
  bookmark_count?: number
  comment_count?: number
  user?: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  created_at?: string
  posts_count?: number
  is_admin?: boolean
  banner_url?: string | null
  bio?: string
  website?: string
  location?: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  is_read: boolean
  sender?: {
    name: string
    email: string
  }
}

interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  created_at: string
  user?: {
    name: string
    email: string
    avatar_url: string | null
  }
  post?: {
    movie_title: string
  }
}

interface Report {
  id: string
  post_id: string
  user_id: string
  report_type: string
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
  reporter_ip?: string
  reason?: string
  post?: Post
  reporter?: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  metadata: any
  created_at: string
}

interface ReportSummary {
  post_id: string
  post_title: string
  report_count: number
  unique_reporters: number
  first_reported: string
  latest_reported: string
  status: string
  post?: Post
  common_reasons?: string[]
  reason_counts?: Record<string, number>
  reasons_with_counts?: Array<{
    reason: string
    count: number
    unique_reporters: number
  }>
}

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'messages' | 'posts' | 'users' | 'comments' | 'reports' | 'threshold-reports'>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([])
  const [searchPostTerm, setSearchPostTerm] = useState('')
  const [filterPostStatus, setFilterPostStatus] = useState('all')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [isSelectAllPosts, setIsSelectAllPosts] = useState(false)
  const [selectedPostPreview, setSelectedPostPreview] = useState<Post | null>(null)
  const [showPostPreview, setShowPostPreview] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchUserTerm, setSearchUserTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isSelectAllUsers, setIsSelectAllUsers] = useState(false)
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null)
  const [showUserProfileModal, setShowUserProfileModal] = useState(false)
  
  // Messages state
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [searchCommentTerm, setSearchCommentTerm] = useState('')
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [selectedComments, setSelectedComments] = useState<string[]>([])
  const [isSelectAllComments, setIsSelectAllComments] = useState(false)
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([])
  const [searchReportTerm, setSearchReportTerm] = useState('')
  const [filterReportStatus, setFilterReportStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [isSelectAllReports, setIsSelectAllReports] = useState(false)
  const [reportsCount, setReportsCount] = useState(0)
  
  // Threshold Reports state
  const [reportSummaries, setReportSummaries] = useState<ReportSummary[]>([])
  const [filterMinReports, setFilterMinReports] = useState<number>(2)
  const [pendingThresholdReports, setPendingThresholdReports] = useState<number>(0)
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    todayUsers: 0,
    publishedPosts: 0,
    pendingReports: 0,
    thresholdReports: 0
  })
  
  const supabase = createClient()
  const router = useRouter()

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initAdminPanel = async () => {
      setIsLoading(true)
      setError(null)
      setDebugInfo('Initializing admin panel...')
      
      try {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission()
        }
        
        await fetchData()
        await fetchNotifications()
        await fetchReportSummaries()
        
        setDebugInfo('Admin panel loaded successfully')
      } catch (error: any) {
        console.error('Error initializing admin:', error)
        setDebugInfo(`Error: ${error.message}`)
        setError('Failed to load admin panel. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    initAdminPanel()
  }, [])

  useEffect(() => {
    if (!isLoading && !error) {
      fetchData()
    }
  }, [activeSection])

  // ==================== DATA FETCHING FUNCTIONS ====================

  const fetchData = async () => {
    setIsDataLoading(true)
    setError(null)
    try {
      switch (activeSection) {
        case 'dashboard':
          await fetchDashboardStats()
          await fetchReportSummaries()
          break
        case 'messages':
          await fetchMessages()
          break
        case 'posts':
          await fetchPosts()
          break
        case 'users':
          await fetchUsers()
          break
        case 'comments':
          await fetchComments()
          break
        case 'reports':
          await fetchReports()
          break
        case 'threshold-reports':
          await fetchReportSummaries()
          break
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError(`Failed to fetch data: ${error.message || 'Unknown error'}`)
    } finally {
      setIsDataLoading(false)
      setSelectedPosts([])
      setSelectedUsers([])
      setSelectedComments([])
      setSelectedReports([])
      setIsSelectAllPosts(false)
      setIsSelectAllUsers(false)
      setIsSelectAllComments(false)
      setIsSelectAllReports(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setDebugInfo('Fetching dashboard stats...')
      
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })

      let totalComments = 0
      try {
        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
        totalComments = commentsCount || 0
      } catch {}

      const { count: publishedPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

      const today = new Date().toISOString().split('T')[0]
      const { count: todayUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get threshold reports count manually
      const { data: pendingReportsData } = await supabase
        .from('reports')
        .select('post_id, reason')
        .eq('status', 'pending')

      let thresholdReports = 0
      if (pendingReportsData) {
        // Count posts with 2+ reports with same reason manually
        const reasonCountsByPost: Record<string, Record<string, number>> = {}
        pendingReportsData.forEach(report => {
          if (!reasonCountsByPost[report.post_id]) {
            reasonCountsByPost[report.post_id] = {}
          }
          const reason = report.reason || 'other'
          reasonCountsByPost[report.post_id][reason] = (reasonCountsByPost[report.post_id][reason] || 0) + 1
        })
        
        // Check each post for any reason with count >= 2
        thresholdReports = Object.values(reasonCountsByPost).filter(reasonCounts => 
          Object.values(reasonCounts).some(count => count >= 2)
        ).length
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        todayUsers: todayUsers || 0,
        publishedPosts: publishedPosts || 0,
        pendingReports: pendingReports || 0,
        thresholdReports: thresholdReports || 0
      })

      setDebugInfo('Dashboard stats loaded successfully')
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      setDebugInfo(`Dashboard error: ${error.message}`)
    }
  }

  const fetchMessages = async () => {
    try {
      setDebugInfo('Fetching messages...')
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles for messages:', profilesError)
        setDebugInfo(`Profiles fetch error: ${profilesError.message}`)
        setError('Failed to load users. Please check database connection.')
        setUsers([])
        return
      }
      
      const userProfiles: UserProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        avatar_url: profile.avatar_url || null,
        created_at: profile.created_at
      }))
      
      setUsers(userProfiles)
      setDebugInfo(`Found ${userProfiles.length} users`)
      
      if (userProfiles.length > 0) {
        if (!selectedUser || !userProfiles.find(u => u.id === selectedUser.id)) {
          setSelectedUser(userProfiles[0])
          await fetchUserMessages(userProfiles[0].id)
        } else {
          await fetchUserMessages(selectedUser.id)
        }
      } else {
        setMessages([])
        setDebugInfo('No users found')
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      setDebugInfo(`Messages error: ${error.message}`)
      setError('Failed to load messages')
      setUsers([])
      setMessages([])
    }
  }

  const fetchUserMessages = async (userId: string) => {
    try {
      setDebugInfo(`Fetching messages for user ${userId}...`)
      
      try {
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('type', 'message')
          .or(`user_id.eq.${userId},metadata->sender_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!error && notifications) {
          const messagesData: Message[] = notifications.map((n: any) => ({
            id: n.id,
            content: n.metadata?.content || n.message,
            sender_id: n.metadata?.sender_id || 'admin',
            receiver_id: n.user_id,
            created_at: n.created_at,
            is_read: n.is_read,
            sender: {
              name: n.metadata?.sender_name || 'Admin',
              email: 'admin@movie-reel.com'
            }
          }))
          setMessages(messagesData)
          setDebugInfo(`Found ${messagesData.length} messages`)
        } else if (error) {
          console.log('Error fetching notifications:', error.message)
          setDebugInfo(`Notifications error: ${error.message}`)
          setMessages([])
        }
      } catch (notifError: any) {
        console.log('Notifications table might not exist:', notifError.message)
        setDebugInfo('Notifications table not found')
        setMessages([])
      }
    } catch (error: any) {
      console.error('Error fetching user messages:', error)
      setDebugInfo(`User messages error: ${error.message}`)
      setMessages([])
    }
  }

  const fetchPosts = async () => {
    try {
      setDebugInfo('Fetching posts...')
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('published_at', { ascending: false })

      if (postsError) {
        console.error('Error fetching posts:', postsError)
        setDebugInfo(`Posts fetch error: ${postsError.message}`)
        setError('Failed to load posts. Please check database connection.')
        setPosts([])
        return
      }

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(post => post.user_id))]
        
        const { data: userProfiles, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching user profiles:', usersError)
          setDebugInfo(`User profiles error: ${usersError.message}`)
        }

        const userMap = new Map()
        if (userProfiles) {
          userProfiles.forEach(profile => {
            userMap.set(profile.id, {
              name: profile.name || 'Unknown',
              email: profile.email || '',
              avatar_url: profile.avatar_url
            })
          })
        }

        const formattedPosts = postsData.map(post => {
          const userData = userMap.get(post.user_id) || { name: 'Unknown', email: '' }
          
          return {
            id: post.id,
            movie_title: post.movie_title || 'Untitled',
            content: post.content || '',
            user_id: post.user_id,
            published_at: post.published_at || post.created_at,
            view_count: post.view_count || 0,
            status: post.status || 'draft',
            visibility: post.visibility || 'draft',
            movie_poster_url: post.movie_poster_url,
            movie_backdrop_url: post.movie_backdrop_url,
            excerpt: post.excerpt,
            movie_background_title: post.movie_background_title,
            release_date: post.release_date,
            director: post.director,
            cast: post.cast || [],
            genre_tags: post.genre_tags || [],
            duration: post.duration,
            review_language: post.review_language,
            imdb_id: post.imdb_id,
            trailer_url: post.trailer_url,
            categories: post.categories || [],
            tags: post.tags || [],
            tmdb_rating: post.tmdb_rating,
            movie_language: post.movie_language,
            like_count: post.like_count || 0,
            dislike_count: post.dislike_count || 0,
            bookmark_count: post.bookmark_count || 0,
            comment_count: post.comment_count || 0,
            user: userData
          } as Post
        })
        
        setPosts(formattedPosts)
        setDebugInfo(`Found ${formattedPosts.length} posts`)
      } else {
        setPosts([])
        setDebugInfo('No posts found')
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      setDebugInfo(`Posts error: ${error.message}`)
      setError('Failed to load posts')
      setPosts([])
    }
  }

  const fetchUsers = async () => {
    try {
      setDebugInfo('Fetching users...')
      
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single()

        if (tableError) {
          console.error('Profiles table check failed:', tableError)
          setDebugInfo(`Profiles table error: ${tableError.message}`)
          setError('Profiles table not found. Please check database setup.')
          setUsers([])
          return
        }
      } catch (checkError: any) {
        console.error('Table check error:', checkError)
        setDebugInfo(`Table check error: ${checkError.message}`)
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at, banner_url, bio, is_admin')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching users:', profilesError)
        setDebugInfo(`Users fetch error: ${JSON.stringify(profilesError)}`)
        setError(`Failed to load users: ${profilesError.message || 'Unknown error'}`)
        setUsers([])
        return
      }

      if (profiles && profiles.length > 0) {
        setDebugInfo(`Processing ${profiles.length} users...`)
        
        const usersWithPostCounts = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const { count, error: countError } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)

              if (countError) {
                console.error(`Error getting post count for user ${profile.id}:`, countError)
                setDebugInfo(`Post count error for user ${profile.id}: ${countError.message}`)
              }

              return {
                id: profile.id,
                name: profile.name || 'Unknown',
                email: profile.email || '',
                avatar_url: profile.avatar_url || null,
                banner_url: profile.banner_url || null,
                bio: profile.bio,
                is_admin: profile.is_admin || false,
                created_at: profile.created_at,
                posts_count: count || 0
              } as UserProfile
            } catch (postCountError: any) {
              console.error(`Error processing user ${profile.id}:`, postCountError)
              setDebugInfo(`User ${profile.id} processing error: ${postCountError.message}`)
              return {
                id: profile.id,
                name: profile.name || 'Unknown',
                email: profile.email || '',
                avatar_url: profile.avatar_url || null,
                banner_url: profile.banner_url || null,
                bio: profile.bio,
                is_admin: profile.is_admin || false,
                created_at: profile.created_at,
                posts_count: 0
              } as UserProfile
            }
          })
        )

        setUsers(usersWithPostCounts)
        setDebugInfo(`Successfully loaded ${usersWithPostCounts.length} users`)
      } else {
        setUsers([])
        setDebugInfo('No users found')
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setDebugInfo(`Users error: ${error.message}`)
      setError(`Failed to load users: ${error.message || 'Unknown error'}`)
      setUsers([])
    }
  }

  const fetchComments = async () => {
    try {
      setDebugInfo('Fetching comments...')
      
      try {
        const { data: tableCheck, error: tableCheckError } = await supabase
          .from('comments')
          .select('id')
          .limit(1)

        if (tableCheckError) {
          console.log('Comments table might not exist yet:', tableCheckError.message)
          setDebugInfo('Comments table not found')
          setComments([])
          return
        }

        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (commentsError) {
          console.log('Error fetching comments:', commentsError.message)
          setDebugInfo(`Comments fetch error: ${commentsError.message}`)
          setComments([])
          return
        }

        if (commentsData && commentsData.length > 0) {
          const userIds = [...new Set(commentsData.map(comment => comment.user_id))]
          const { data: userProfiles } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url')
            .in('id', userIds)

          const postIds = [...new Set(commentsData.map(comment => comment.post_id))]
          const { data: postsData } = await supabase
            .from('posts')
            .select('id, movie_title')
            .in('id', postIds)

          const userMap = new Map()
          if (userProfiles) {
            userProfiles.forEach(profile => {
              userMap.set(profile.id, {
                name: profile.name || 'Unknown',
                email: profile.email || '',
                avatar_url: profile.avatar_url || null
              })
            })
          }

          const postMap = new Map()
          if (postsData) {
            postsData.forEach(post => {
              postMap.set(post.id, {
                movie_title: post.movie_title || 'Untitled'
              })
            })
          }

          const combinedComments: Comment[] = commentsData.map(comment => {
            const userData = userMap.get(comment.user_id)
            const postData = postMap.get(comment.post_id)
            
            return {
              id: comment.id,
              content: comment.content,
              user_id: comment.user_id,
              post_id: comment.post_id,
              created_at: comment.created_at,
              user: userData ? {
                name: userData.name,
                email: userData.email,
                avatar_url: userData.avatar_url
              } : undefined,
              post: postData ? {
                movie_title: postData.movie_title
              } : undefined
            } as Comment
          })

          setComments(combinedComments)
          setDebugInfo(`Successfully loaded ${combinedComments.length} comments`)
        } else {
          setComments([])
          setDebugInfo('No comments found')
        }
      } catch (tableError: any) {
        console.log('Comments table check error:', tableError)
        setDebugInfo(`Comments table error: ${tableError.message}`)
        setComments([])
      }
    } catch (error: any) {
      console.error('Error in fetchComments:', error)
      setDebugInfo(`Comments error: ${error.message}`)
      setComments([])
    }
  }

  const fetchReports = async () => {
    try {
      setDebugInfo('Fetching reports...')
      
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          post:posts(*, user:profiles(name, email, avatar_url)),
          reporter:profiles!reports_user_id_fkey(name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (reportsError) {
        console.error('Error fetching reports:', reportsError)
        setDebugInfo(`Reports fetch error: ${reportsError.message}`)
        setReports([])
        return
      }

      if (reportsData) {
        const formattedReports: Report[] = reportsData.map((report: any) => ({
          id: report.id,
          post_id: report.post_id,
          user_id: report.user_id,
          report_type: report.report_type,
          description: report.description,
          status: report.status,
          created_at: report.created_at,
          updated_at: report.updated_at,
          reporter_ip: report.reporter_ip,
          reason: report.reason,
          post: report.post ? {
            id: report.post.id,
            movie_title: report.post.movie_title,
            content: report.post.content || '',
            user_id: report.post.user_id,
            published_at: report.post.published_at,
            view_count: report.post.view_count || 0,
            status: report.post.status || 'draft',
            visibility: report.post.visibility || 'public',
            movie_poster_url: report.post.movie_poster_url,
            user: report.post.user
          } : undefined,
          reporter: report.reporter ? {
            name: report.reporter.name,
            email: report.reporter.email,
            avatar_url: report.reporter.avatar_url
          } : undefined
        }))

        setReports(formattedReports)
        setReportsCount(formattedReports.length)
        setDebugInfo(`Found ${formattedReports.length} reports`)
      } else {
        setReports([])
        setReportsCount(0)
        setDebugInfo('No reports found')
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      setDebugInfo(`Reports error: ${error.message}`)
      setReports([])
    }
  }

  const fetchReportSummaries = async () => {
    try {
      setDebugInfo('Fetching report summaries (grouped by reason)...')
      
      const { data: pendingReports, error: reportsError } = await supabase
        .from('reports')
        .select('post_id, created_at, user_id, reason, report_type')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (reportsError) {
        console.error('Error fetching pending reports:', reportsError)
        setReportSummaries([])
        setPendingThresholdReports(0)
        return
      }

      if (!pendingReports || pendingReports.length === 0) {
        setReportSummaries([])
        setPendingThresholdReports(0)
        setDebugInfo('No pending reports found')
        return
      }

      // Group reports by post_id AND reason
      const reportsByPostAndReason: Record<string, {
        post_id: string;
        reason: string;
        report_count: number;
        unique_reporters: Set<string>;
        first_reported: string;
        latest_reported: string;
        reports: any[];
      }> = {}

      pendingReports.forEach((report: any) => {
        const reason = report.reason || report.report_type || 'other'
        const key = `${report.post_id}-${reason}`
        
        if (!reportsByPostAndReason[key]) {
          reportsByPostAndReason[key] = {
            post_id: report.post_id,
            reason: reason,
            report_count: 0,
            unique_reporters: new Set(),
            first_reported: report.created_at,
            latest_reported: report.created_at,
            reports: []
          }
        }

        const reportData = reportsByPostAndReason[key]
        reportData.report_count++
        reportData.unique_reporters.add(report.user_id)
        reportData.reports.push(report)
        
        // Update dates
        if (new Date(report.created_at) < new Date(reportData.first_reported)) {
          reportData.first_reported = report.created_at
        }
        if (new Date(report.created_at) > new Date(reportData.latest_reported)) {
          reportData.latest_reported = report.created_at
        }
      })

      // Filter items with minimum reports threshold for the SAME REASON
      const filteredItems = Object.values(reportsByPostAndReason)
        .filter(item => item.report_count >= filterMinReports)

      if (filteredItems.length === 0) {
        setReportSummaries([])
        setPendingThresholdReports(0)
        setDebugInfo(`No posts found with ${filterMinReports}+ reports for same reason`)
        return
      }

      // Group by post_id to combine multiple reasons for same post
      const groupedByPost: Record<string, {
        post_id: string;
        reasons: Array<{
          reason: string;
          count: number;
          unique_reporters: number;
        }>;
        total_reports: number;
        unique_reporters: Set<string>;
        first_reported: string;
        latest_reported: string;
      }> = {}

      filteredItems.forEach(item => {
        if (!groupedByPost[item.post_id]) {
          groupedByPost[item.post_id] = {
            post_id: item.post_id,
            reasons: [],
            total_reports: 0,
            unique_reporters: new Set(),
            first_reported: item.first_reported,
            latest_reported: item.latest_reported
          }
        }

        groupedByPost[item.post_id].reasons.push({
          reason: item.reason,
          count: item.report_count,
          unique_reporters: item.unique_reporters.size
        })
        
        groupedByPost[item.post_id].total_reports += item.report_count
        
        // Add unique reporters
        item.unique_reporters.forEach((reporter: string) => {
          groupedByPost[item.post_id].unique_reporters.add(reporter)
        })
        
        // Update dates
        if (new Date(item.first_reported) < new Date(groupedByPost[item.post_id].first_reported)) {
          groupedByPost[item.post_id].first_reported = item.first_reported
        }
        if (new Date(item.latest_reported) > new Date(groupedByPost[item.post_id].latest_reported)) {
          groupedByPost[item.post_id].latest_reported = item.latest_reported
        }
      })

      // Fetch post details
      const postIds = Object.keys(groupedByPost)
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(name, email, avatar_url)
        `)
        .in('id', postIds)

      if (!postsData) {
        setReportSummaries([])
        setPendingThresholdReports(0)
        return
      }

      // Create summaries
      const summaries: ReportSummary[] = Object.values(groupedByPost).map(item => {
        const post = postsData.find(p => p.id === item.post_id)
        
        // Sort reasons by count (highest first)
        const sortedReasons = item.reasons.sort((a, b) => b.count - a.count)
        
        return {
          post_id: item.post_id,
          post_title: post?.movie_title || 'Unknown',
          report_count: item.total_reports,
          unique_reporters: item.unique_reporters.size,
          first_reported: item.first_reported,
          latest_reported: item.latest_reported,
          status: 'pending',
          common_reasons: sortedReasons.map(r => r.reason),
          reason_counts: sortedReasons.reduce((acc, r) => {
            acc[r.reason] = r.count
            return acc
          }, {} as Record<string, number>),
          reasons_with_counts: sortedReasons,
          post: post ? {
            id: post.id,
            movie_title: post.movie_title,
            content: post.content || '',
            user_id: post.user_id,
            published_at: post.published_at,
            view_count: post.view_count || 0,
            status: post.status || 'draft',
            visibility: post.visibility || 'public',
            movie_poster_url: post.movie_poster_url,
            user: post.user
          } : undefined
        }
      })

      // Sort by total reports (highest first)
      const sortedSummaries = summaries.sort((a, b) => b.report_count - a.report_count)
      
      setReportSummaries(sortedSummaries)
      setPendingThresholdReports(sortedSummaries.length)
      setDebugInfo(`Found ${sortedSummaries.length} posts with ${filterMinReports}+ reports for same reasons`)

      // Send notifications for threshold posts
      if (sortedSummaries.length > 0) {
        await createThresholdNotifications(sortedSummaries)
      }

    } catch (error: any) {
      console.error('Error fetching report summaries:', error)
      setDebugInfo(`Report summaries error: ${error.message}`)
      setReportSummaries([])
      setPendingThresholdReports(0)
    }
  }

  const createThresholdNotifications = async (summaries: ReportSummary[]) => {
    try {
      const now = new Date().toISOString()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      const newThresholdPosts = summaries.filter(summary => {
        const latestReport = new Date(summary.latest_reported)
        const fiveMinutesAgoDate = new Date(fiveMinutesAgo)
        return latestReport > fiveMinutesAgoDate
      })

      // Create notifications for new threshold posts
      for (const summary of newThresholdPosts) {
        // Check if notification already exists
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'admin_report')
          .eq('metadata->>post_id', summary.post_id)
          .eq('metadata->>threshold_reached', 'true')
          .single()

        if (!existingNotif && summary.post) {
          // Get the most common reason
          const mostCommonReason = summary.reasons_with_counts?.[0]?.reason || 'multiple reasons'
          const reasonCount = summary.reasons_with_counts?.[0]?.count || summary.report_count
          
          // Create notification for admin
          const notification = {
            user_id: 'admin',
            type: 'admin_report',
            message: `Post "${summary.post_title}" has ${reasonCount} reports for "${mostCommonReason}"`,
            metadata: {
              post_id: summary.post_id,
              post_title: summary.post_title,
              report_count: reasonCount,
              common_reason: mostCommonReason,
              threshold_reached: true,
              created_at: now
            },
            is_read: false,
            created_at: now
          }

          await supabase
            .from('notifications')
            .insert([notification])

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Multiple Reports - Same Reason', {
              body: `"${summary.post_title}" has ${reasonCount} reports for "${mostCommonReason}"`,
              icon: '/icon.png',
              tag: `threshold-${summary.post_id}`
            })
          }
        }
      }
    } catch (error) {
      console.error('Error creating threshold notifications:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'admin_report')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (!error && notificationsData) {
        setNotifications(notificationsData)
        
        // Count threshold notifications
        const thresholdCount = notificationsData.filter(
          (n: any) => n.metadata?.threshold_reached
        ).length
        
        setUnreadNotifications(thresholdCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markNotificationsAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('type', 'admin_report')
        .eq('is_read', false)

      if (!error) {
        setUnreadNotifications(0)
        setNotifications([])
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  // ==================== REALTIME FUNCTIONALITY ====================

  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel('admin-reports')
    setBroadcastChannel(channel)

    const handleChannelMessage = (event: MessageEvent) => {
      const { type, action, data } = event.data
      
      if (type === 'reports') {
        console.log('Report broadcast received:', action, data)
        
        if (action === 'new' || action === 'threshold_reached') {
          // Refresh all report-related data
          Promise.all([
            fetchReports(),
            fetchDashboardStats(),
            fetchReportSummaries(),
            fetchNotifications()
          ]).then(() => {
            console.log('All report data refreshed')
            
            // Show browser notification for threshold reached
            if (action === 'threshold_reached' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Multiple Reports - Same Reason', {
                body: `"${data.post?.movie_title || 'Unknown'}" has ${data.report_count || 2} reports for "${data.common_reason || 'same reason'}"`,
                icon: '/icon.png',
                tag: `threshold-${data.post_id}`
              })
            }
          })
        }
      }
    }

    channel.addEventListener('message', handleChannelMessage)

    // Real-time subscription for reports
    const reportsSubscription = supabase
      .channel('reports-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports'
        },
        async (payload) => {
          console.log('Real-time report inserted:', payload)
          
          // Refresh report data
          fetchReports()
          fetchDashboardStats()
          fetchReportSummaries()
          fetchNotifications()
          
          // Check if this creates a threshold for same reason
          const reason = payload.new.reason || payload.new.report_type || 'other'
          const { data: sameReasonReports, error: reasonError } = await supabase
            .from('reports')
            .select('id')
            .eq('post_id', payload.new.post_id)
            .eq('status', 'pending')
            .eq('reason', reason)

          if (!reasonError && sameReasonReports && sameReasonReports.length === 2) {
            // Get post details
            const { data: postData } = await supabase
              .from('posts')
              .select('movie_title')
              .eq('id', payload.new.post_id)
              .single()
            
            // Send threshold notification via broadcast
            if (typeof BroadcastChannel !== 'undefined') {
              const thresholdChannel = new BroadcastChannel('admin-reports')
              thresholdChannel.postMessage({
                type: 'reports',
                action: 'threshold_reached',
                data: {
                  post_id: payload.new.post_id,
                  post: postData,
                  report_count: sameReasonReports.length,
                  common_reason: reason,
                  is_threshold_reached: true
                }
              })
              thresholdChannel.close()
            }
            
            // Trigger custom event
            window.dispatchEvent(new CustomEvent('admin-reports-updated', {
              detail: {
                type: 'reports',
                action: 'threshold_reached',
                data: {
                  post_id: payload.new.post_id,
                  post: postData,
                  report_count: sameReasonReports.length,
                  common_reason: reason,
                  is_threshold_reached: true
                }
              }
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('Real-time report updated:', payload)
          fetchReports()
          fetchDashboardStats()
          fetchReportSummaries()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reports'
        },
        (payload) => {
          console.log('Real-time report deleted:', payload)
          fetchReports()
          fetchDashboardStats()
          fetchReportSummaries()
        }
      )
      .subscribe()

    const handleCustomEvent = (event: CustomEvent) => {
      const { type, action, data } = event.detail
      if (type === 'reports' && (action === 'new' || action === 'threshold_reached')) {
        console.log('Custom event received:', action)
        fetchReports()
        fetchDashboardStats()
        fetchReportSummaries()
        fetchNotifications()
      }
    }

    window.addEventListener('admin-reports-updated', handleCustomEvent as EventListener)

    return () => {
      channel.removeEventListener('message', handleChannelMessage)
      channel.close()
      reportsSubscription.unsubscribe()
      window.removeEventListener('admin-reports-updated', handleCustomEvent as EventListener)
    }
  }, [supabase])

  // ==================== REPORT MANAGEMENT FUNCTIONS ====================

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) {
        console.error('Error updating report status:', error)
        alert('Failed to update report status')
        return
      }

      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, status, updated_at: new Date().toISOString() } : report
      ))

      fetchDashboardStats()
      fetchReportSummaries()
      
      alert(`Report marked as ${status}`)
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Failed to update report')
    }
  }

  const handleBulkResolvePostReports = async (postId: string, action: 'accept' | 'reject') => {
    const actionText = action === 'accept' ? 'resolve' : 'dismiss'
    
    if (!confirm(`Are you sure you want to ${actionText} all reports for this post?`)) return
    
    try {
      const status = action === 'accept' ? 'resolved' : 'dismissed'
      
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('post_id', postId)
        .eq('status', 'pending')

      if (error) {
        console.error(`Error ${actionText}ing reports:`, error)
        alert(`Failed to ${actionText} reports`)
        return
      }

      // Update local state
      setReports(prev => prev.map(report => 
        report.post_id === postId && report.status === 'pending' 
          ? { ...report, status, updated_at: new Date().toISOString() }
          : report
      ))

      // Remove from summaries
      setReportSummaries(prev => prev.filter(summary => summary.post_id !== postId))
      
      fetchDashboardStats()
      fetchReportSummaries()
      
      alert(`All reports for this post have been ${actionText}d`)
    } catch (error) {
      console.error(`Error ${actionText}ing reports:`, error)
      alert(`Failed to ${actionText} reports`)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)

      if (error) {
        console.error('Error deleting report:', error)
        alert('Failed to delete report')
        return
      }

      setReports(prev => prev.filter(report => report.id !== reportId))
      setReportsCount(prev => prev - 1)
      fetchReportSummaries()
      
      alert('Report deleted successfully')
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    }
  }

  const handleDeletePostFromReport = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This will also delete all associated reports.')) return
    
    try {
      setDeletingPostId(postId)
      
      await deleteAllPostRelatedData(postId)

      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .select()

      if (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post')
        return
      }

      if (!data || data.length === 0) {
        alert('Post was not deleted (may have been removed already)')
        return
      }

      setReports(prev => prev.filter(report => report.post_id !== postId))
      setReportSummaries(prev => prev.filter(summary => summary.post_id !== postId))
      fetchDashboardStats()
      
      alert('Post and associated reports deleted successfully')
    } catch (error: any) {
      console.error('Error deleting post:', error)
      alert(`Failed to delete post: ${error.message}`)
    } finally {
      setDeletingPostId(null)
    }
  }

  const handleBulkUpdateReports = async (status: Report['status']) => {
    if (selectedReports.length === 0) {
      alert('Please select reports to update')
      return
    }

    if (!confirm(`Mark ${selectedReports.length} selected reports as ${status}?`)) return
    
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedReports)

      if (error) {
        console.error('Error bulk updating reports:', error)
        alert('Failed to update reports')
        return
      }

      setReports(prev => prev.map(report => 
        selectedReports.includes(report.id) 
          ? { ...report, status, updated_at: new Date().toISOString() }
          : report
      ))

      setSelectedReports([])
      setIsSelectAllReports(false)
      fetchDashboardStats()
      fetchReportSummaries()
      
      alert(`${selectedReports.length} reports marked as ${status}`)
    } catch (error) {
      console.error('Error bulk updating reports:', error)
      alert('Failed to update reports')
    }
  }

  const handleBulkDeleteReports = async () => {
    if (selectedReports.length === 0) {
      alert('Please select reports to delete')
      return
    }

    if (!confirm(`Delete ${selectedReports.length} selected reports?`)) return
    
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .in('id', selectedReports)

      if (error) {
        console.error('Error bulk deleting reports:', error)
        alert('Failed to delete reports')
        return
      }

      setReports(prev => prev.filter(report => !selectedReports.includes(report.id)))
      setReportsCount(prev => prev - selectedReports.length)
      setSelectedReports([])
      setIsSelectAllReports(false)
      fetchDashboardStats()
      fetchReportSummaries()
      
      alert(`${selectedReports.length} reports deleted successfully`)
    } catch (error) {
      console.error('Error bulk deleting reports:', error)
      alert('Failed to delete reports')
    }
  }

  // ==================== POST MANAGEMENT FUNCTIONS ====================

  const deleteAllPostRelatedData = async (postId: string) => {
    try {
      try {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
      } catch {}

      try {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
      } catch {}

      try {
        await supabase
          .from('reports')
          .delete()
          .eq('post_id', postId)
      } catch {}

      try {
        await supabase
          .from('comments')
          .delete()
          .eq('post_id', postId)
      } catch {}

      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('post_id', postId)
      } catch {}
    } catch (error) {
      console.error('Error in deleteAllPostRelatedData:', error)
      throw error
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return
    
    try {
      setDeletingPostId(postId)
      await deleteAllPostRelatedData(postId)

      const {data, error} = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .select()
        
        if (error) {
          console.error('delete failed:', error)
          alert(`Database error: post was NOT deleted`)
          return
        }

        if (!data || data.length === 0) {
          alert(`Delete blocked by RLS or policy: post was NOT deleted`)
          return
        }

        setPosts(prev => prev.filter(p => p.id !== postId))
        setStats(prev => ({
          ...prev,
          totalPosts: Math.max(0, prev.totalPosts - 1),
          publishedPosts: Math.max(0, prev.publishedPosts - 1),
        }))

        alert('Post permanently deleted from database')

    } catch (err: any) {
        console.error(err)
        alert(err.message || 'Delete failed')
    } finally {
        setDeletingPostId(null)
    }
  }

  const handleDeleteSelectedPosts = async () => {
    if (selectedPosts.length === 0) {
      alert('No posts selected')
      return
    }

    if (!confirm(`Delete ${selectedPosts.length} selected posts permanently?`)) {
      return
    }

    try {
      setIsDataLoading(true)
      let deletedIds: string[] = []

      for (const postId of selectedPosts) {
        await deleteAllPostRelatedData(postId)

        const { data, error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId)
          .select('id')

        if (error) {
          console.error(`Failed to delete post ${postId}`, error)
          continue
        }

        if (!data || data.length === 0) {
          console.error(`RLS blocked deletion of post ${postId}`)
          continue
        }

        deletedIds.push(postId)
      }

      if (deletedIds.length === 0) {
        alert('No posts were deleted (blocked by security policy)')
        return
      }

      setPosts(prev => prev.filter(p => !deletedIds.includes(p.id)))
      setStats(prev => ({
        ...prev,
        totalPosts: Math.max(0, prev.totalPosts - deletedIds.length),
        publishedPosts: Math.max(0, prev.publishedPosts - deletedIds.length),
      }))

      setSelectedPosts([])
      setIsSelectAllPosts(false)

      alert(`${deletedIds.length} posts permanently deleted`)

    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Bulk delete failed')
    } finally {
      setIsDataLoading(false)
    }
  }

  // ==================== USER MANAGEMENT FUNCTIONS ====================

  const deleteAllUserRelatedData = async (userId: string) => {
    try {
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)

      if (userPosts && userPosts.length > 0) {
        for (const post of userPosts) {
          await deleteAllPostRelatedData(post.id)
        }
        
        await supabase
          .from('posts')
          .delete()
          .eq('user_id', userId)
      }

      try {
        await supabase
          .from('comments')
          .delete()
          .eq('user_id', userId)
      } catch {}

      try {
        await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', userId)
      } catch {}
      
      try {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId)
      } catch {}
      
      try {
        await supabase
          .from('reports')
          .delete()
          .eq('user_id', userId)
      } catch {}
      
      try {
        await supabase
          .from('follows')
          .delete()
          .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
      } catch {}

      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
      } catch {}
    } catch (error) {
      console.error('Error in deleteAllUserRelatedData:', error)
      throw error
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account? All their posts, comments, and data will be permanently deleted.')) {
      return
    }

    try {
      setDeletingUserId(userId)
      await deleteAllUserRelatedData(userId)

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select()

      if (profileError) {
        console.error('Error deleting profile:', profileError)
        alert(`Failed to delete user account: ${profileError.message || 'Unknown error'}`)
        return
      }

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      setStats(prev => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - 1)
      }))

      alert('User account deleted successfully from database!')
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user account: ${error.message || 'Unknown error'}`)
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleDeleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} selected users? All their data will be permanently deleted.`)) {
      return
    }

    try {
      setIsDataLoading(true)
      let deletedCount = 0
      
      for (const userId of selectedUsers) {
        try {
          await deleteAllUserRelatedData(userId)

          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

          if (!profileError) {
            deletedCount++
          } else {
            console.error(`Error deleting user ${userId}:`, profileError)
          }
        } catch (error: any) {
          console.error(`Error processing user ${userId}:`, error)
        }
      }

      setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user.id)))
      setStats(prev => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - deletedCount)
      }))

      setSelectedUsers([])
      setIsSelectAllUsers(false)
      
      alert(`${deletedCount} users deleted successfully from database!`)
    } catch (error: any) {
      console.error('Error deleting selected users:', error)
      alert('Failed to delete selected users. Please try again.')
    } finally {
      setIsDataLoading(false)
    }
  }

  // ==================== COMMENT MANAGEMENT FUNCTIONS ====================

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingCommentId(commentId)
      
      const { data, error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .select()

      if (deleteError) {
        console.error('Error deleting comment:', deleteError)
        alert('Failed to delete comment. Please try again.')
        return
      }

      if (!data || data.length === 0) {
        alert('Comment was not deleted (may have been removed already)')
        return
      }

      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId))
      setStats(prev => ({
        ...prev,
        totalComments: Math.max(0, prev.totalComments - 1)
      }))

      alert('Comment deleted successfully from database!')
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const handleDeleteSelectedComments = async () => {
    if (selectedComments.length === 0) {
      alert('Please select comments to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedComments.length} selected comments? This action cannot be undone.`)) {
      return
    }

    try {
      setIsDataLoading(true)
      
      const { data, error: deleteError } = await supabase
        .from('comments')
        .delete()
        .in('id', selectedComments)
        .select()

      if (deleteError) {
        console.error('Error deleting comments:', deleteError)
        alert('Failed to delete comments. Please try again.')
        setIsDataLoading(false)
        return
      }

      const deletedCount = data?.length || 0

      setComments(prevComments => prevComments.filter(comment => !selectedComments.includes(comment.id)))
      setStats(prev => ({
        ...prev,
        totalComments: Math.max(0, prev.totalComments - deletedCount)
      }))

      setSelectedComments([])
      setIsSelectAllComments(false)
      
      alert(`${deletedCount} comments deleted successfully from database!`)
    } catch (error) {
      console.error('Error deleting selected comments:', error)
      alert('Failed to delete selected comments. Please try again.')
    } finally {
      setIsDataLoading(false)
    }
  }

  // ==================== MESSAGE FUNCTIONS ====================

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return

    setIsSendingMessage(true)
    try {
      const messageData = {
        user_id: selectedUser.id,
        type: 'message',
        message: 'New message from admin',
        is_read: false,
        metadata: {
          content: newMessage.trim(),
          sender_id: 'admin',
          sender_name: 'Admin',
          sender_username: 'admin',
          is_admin_message: true
        }
      }

      const { error } = await supabase
        .from('notifications')
        .insert([messageData])

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Please try again.')
        return
      }

      const newMsg: Message = {
        id: `temp_${Date.now()}`,
        content: newMessage.trim(),
        sender_id: 'admin',
        receiver_id: selectedUser.id,
        created_at: new Date().toISOString(),
        is_read: false,
        sender: {
          name: 'Admin',
          email: 'admin@movie-reel.com'
        }
      }

      setMessages(prev => [newMsg, ...prev])
      setNewMessage('')
      alert('Message sent successfully!')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleMessageUser = (user: UserProfile) => {
    setSelectedUser(user)
    setActiveSection('messages')
    fetchUserMessages(user.id)
  }

  // ==================== UTILITY FUNCTIONS ====================

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Unknown date'
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const formatShortDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Unknown'
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'spam': 'Spam',
      'inappropriate': 'Inappropriate',
      'hate_speech': 'Hate Speech',
      'misinformation': 'False Information',
      'copyright': 'Copyright Violation',
      'harassment': 'Harassment',
      'other': 'Other'
    }
    return labels[type] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'reviewed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'reviewed': return <Eye className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'dismissed': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  // ==================== FILTERING FUNCTIONS ====================

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.movie_title.toLowerCase().includes(searchPostTerm.toLowerCase()) ||
                         post.user?.name.toLowerCase().includes(searchPostTerm.toLowerCase())
    
    if (filterPostStatus === 'all') return matchesSearch
    if (filterPostStatus === 'published') return matchesSearch && post.status === 'published'
    if (filterPostStatus === 'draft') return matchesSearch && post.status === 'draft'
    return matchesSearch
  })

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUserTerm.toLowerCase())
  )

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchCommentTerm.toLowerCase()) ||
    comment.user?.name.toLowerCase().includes(searchCommentTerm.toLowerCase()) ||
    comment.post?.movie_title.toLowerCase().includes(searchCommentTerm.toLowerCase())
  )

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.post?.movie_title?.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
      report.reporter?.name?.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
      report.reporter?.email?.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
      report.reason?.toLowerCase().includes(searchReportTerm.toLowerCase())
    
    if (filterReportStatus === 'all') return matchesSearch
    return matchesSearch && report.status === filterReportStatus
  })

  const filteredReportSummaries = reportSummaries.filter(summary => 
    summary.post_title.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
    summary.post?.user?.name?.toLowerCase().includes(searchReportTerm.toLowerCase()) ||
    summary.common_reasons?.some(reason => reason.toLowerCase().includes(searchReportTerm.toLowerCase()))
  )

  // ==================== SELECTION HANDLERS ====================

  const handlePostSelect = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  const handleSelectAllPosts = () => {
    if (isSelectAllPosts) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(filteredPosts.map(post => post.id))
    }
    setIsSelectAllPosts(!isSelectAllPosts)
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAllUsers = () => {
    if (isSelectAllUsers) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
    setIsSelectAllUsers(!isSelectAllUsers)
  }

  const handleCommentSelect = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId) 
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    )
  }

  const handleSelectAllComments = () => {
    if (isSelectAllComments) {
      setSelectedComments([])
    } else {
      setSelectedComments(filteredComments.map(comment => comment.id))
    }
    setIsSelectAllComments(!isSelectAllComments)
  }

  const handleReportSelect = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    )
  }

  const handleSelectAllReports = () => {
    if (isSelectAllReports) {
      setSelectedReports([])
    } else {
      setSelectedReports(filteredReports.map(report => report.id))
    }
    setIsSelectAllReports(!isSelectAllReports)
  }

  const handleViewPostPreview = (post: Post) => {
    setSelectedPostPreview(post)
    setShowPostPreview(true)
  }

  // ==================== POST PREVIEW MODAL ====================

  const PostPreviewModal = () => {
    if (!showPostPreview || !selectedPostPreview) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                <FilmIcon className="inline mr-2 mb-1" size={20} />
                Post Preview: {selectedPostPreview.movie_title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                By <span className="font-medium text-blue-600 dark:text-blue-400">{selectedPostPreview.user?.name || 'Unknown'}</span> • 
                Published on {formatDate(selectedPostPreview.published_at)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.open(`/post/${selectedPostPreview.id}`, '_blank')}
                className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                title="Open in new tab"
              >
                <Maximize2 size={18} />
                <span className="font-medium">View Full Post</span>
              </button>
              <button
                onClick={() => setShowPostPreview(false)}
                className="p-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors shadow-lg"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedPostPreview.movie_title}
              </h4>
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {selectedPostPreview.content || 'No content available'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <div className="flex justify-between items-center">
              <button
                onClick={() => handleDeletePost(selectedPostPreview.id)}
                className="px-4 py-2 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deletingPostId === selectedPostPreview.id}
              >
                {deletingPostId === selectedPostPreview.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                <span>Delete Post</span>
              </button>
              
              <button
                onClick={() => setShowPostPreview(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== COMPONENT RENDERING ====================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
          {debugInfo && (
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2 max-w-md mx-auto">
              {debugInfo}
            </p>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <PostPreviewModal />
      
      {/* Header with Notifications */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) {
                    markNotificationsAsRead()
                  }
                }}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Reports Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded-lg ${
                              notification.metadata?.threshold_reached 
                                ? 'bg-red-100 dark:bg-red-900/30' 
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}>
                              {notification.metadata?.threshold_reached ? (
                                <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                              ) : (
                                <Flag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.message}
                              </p>
                              {notification.metadata?.common_reason && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  Reason: {notification.metadata.common_reason}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setActiveSection('threshold-reports')
                          setShowNotifications(false)
                        }}
                        className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        View threshold reports
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-linear-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full border border-green-200 dark:border-green-800">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Admin Mode
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
              title="Back to Home"
            >
              <Home size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar with Reports Section */}
        <div className={`
          ${isSidebarOpen ? 'fixed inset-y-0 left-0 z-40 lg:relative lg:inset-auto' : 'hidden lg:block'}
          ${isSidebarCollapsed ? 'w-20' : 'w-72'}
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          h-[calc(100vh-5rem)] lg:h-auto lg:min-h-[calc(100vh-5rem)]
          transition-all duration-300
          shrink-0
        `}>
          <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-6 p-2">
              {!isSidebarCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-base">A</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Admin Panel</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Direct Access</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title={isSidebarCollapsed ? "Expand" : "Collapse"}
              >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>
            
            <nav className="space-y-2 flex-1">
              {/* Dashboard */}
              <button
                onClick={() => {
                  setActiveSection('dashboard')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'dashboard'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Dashboard' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <BarChart size={20} />
                  {!isSidebarCollapsed && <span className="text-base">Dashboard</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
              
              {/* Threshold Reports Section */}
              <button
                onClick={() => {
                  setActiveSection('threshold-reports')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 relative ${
                  activeSection === 'threshold-reports'
                    ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Multiple Reports (Same Reason)' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <AlertOctagon size={20} />
                  {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-base">Multiple Reports</span>
                      {pendingThresholdReports > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          pendingThresholdReports > 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 animate-pulse'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {pendingThresholdReports}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
                
                {/* Badge for collapsed sidebar */}
                {isSidebarCollapsed && pendingThresholdReports > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center ${
                    pendingThresholdReports > 0 
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {pendingThresholdReports > 9 ? '9+' : pendingThresholdReports}
                  </span>
                )}
              </button>
              
              {/* All Reports Section */}
              <button
                onClick={() => {
                  setActiveSection('reports')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 relative ${
                  activeSection === 'reports'
                    ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'All Reports' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <Flag size={20} />
                  {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-base">All Reports</span>
                      {reportsCount > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          stats.pendingReports > 0 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {reportsCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
              
              {/* Messages */}
              <button
                onClick={() => {
                  setActiveSection('messages')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'messages'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Messages' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <MessageSquare size={20} />
                  {!isSidebarCollapsed && <span className="text-base">Messages</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
              
              {/* Posts */}
              <button
                onClick={() => {
                  setActiveSection('posts')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'posts'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Movie Posts' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <Film size={20} />
                  {!isSidebarCollapsed && <span className="text-base">Movie Posts</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
              
              {/* Users */}
              <button
                onClick={() => {
                  setActiveSection('users')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'users'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Users' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <Users size={20} />
                  {!isSidebarCollapsed && <span className="text-base">Users</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
              
              {/* Comments */}
              <button
                onClick={() => {
                  setActiveSection('comments')
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 ${
                  activeSection === 'comments'
                    ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={isSidebarCollapsed ? 'Comments' : ''}
              >
                <div className={`flex items-center ${!isSidebarCollapsed && 'space-x-3'}`}>
                  <MessageCircle size={20} />
                  {!isSidebarCollapsed && <span className="text-base">Comments</span>}
                </div>
                {!isSidebarCollapsed && <ChevronRight size={16} />}
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 min-h-[calc(100vh-5rem)] overflow-auto`}>
          <div className="p-6">
            {/* Threshold Reports Section */}
            {activeSection === 'threshold-reports' && (
              <div className="space-y-6">
                {/* Stats Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertOctagon size={22} />
                        Posts with Multiple Reports (Same Reason)
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                          Priority Review
                        </span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Posts that have been reported 2+ times for the SAME reason require immediate attention
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search posts or reasons..."
                          value={searchReportTerm}
                          onChange={(e) => setSearchReportTerm(e.target.value)}
                          className="pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-48 transition-all"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          Min Reports:
                        </label>
                        <select
                          value={filterMinReports}
                          onChange={(e) => {
                            setFilterMinReports(Number(e.target.value))
                            fetchReportSummaries()
                          }}
                          className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        >
                          <option value={2}>2+ Reports (Same Reason)</option>
                          <option value={3}>3+ Reports (Same Reason)</option>
                          <option value={5}>5+ Reports (Same Reason)</option>
                          <option value={10}>10+ Reports (Same Reason)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">Total Posts</p>
                          <p className="text-2xl font-bold text-red-900 dark:text-red-200">{pendingThresholdReports}</p>
                        </div>
                        <AlertOctagon className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Total Reports</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                            {reportSummaries.reduce((sum, item) => sum + item.report_count, 0)}
                          </p>
                        </div>
                        <Flag className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Different Reasons</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                            {reportSummaries.reduce((sum, item) => sum + (item.common_reasons?.length || 0), 0)}
                          </p>
                        </div>
                        <Tag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Movie Title
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total Reports
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Common Reasons (Count)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Unique Reporters
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Latest Report
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isDataLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center">
                              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading threshold reports...</p>
                            </td>
                          </tr>
                        ) : filteredReportSummaries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center">
                              <CheckCircle className="w-10 h-10 text-green-300 dark:text-green-600 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No posts found with {filterMinReports}+ reports for the same reason
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredReportSummaries.map((summary) => (
                            <tr key={summary.post_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  {summary.post?.movie_poster_url ? (
                                    <img
                                      src={summary.post.movie_poster_url}
                                      alt={summary.post_title}
                                      className="w-12 h-16 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                      <FilmIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {summary.post_title}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      By: {summary.post?.user?.name || 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    summary.report_count >= 10 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                      : summary.report_count >= 5
                                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                  }`}>
                                    {summary.report_count}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1 max-w-xs">
                                  {summary.reasons_with_counts?.map((reasonItem, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                        {reasonItem.reason}
                                      </span>
                                      <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                                        reasonItem.count >= 5
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                      }`}>
                                        {reasonItem.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {summary.unique_reporters}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(summary.latest_reported)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPostPreview(summary.post!)
                                      setShowPostPreview(true)
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                                    title="View Post"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  
                                  <div className="relative group">
                                    <button className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors">
                                      <CheckCircle size={16} />
                                    </button>
                                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                      <button
                                        onClick={() => handleBulkResolvePostReports(summary.post_id, 'accept')}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                                      >
                                        <CheckCircle size={14} />
                                        Accept & Resolve
                                      </button>
                                      <button
                                        onClick={() => handleBulkResolvePostReports(summary.post_id, 'reject')}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
                                      >
                                        <XCircle size={14} />
                                        Reject & Dismiss
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      setActiveSection('reports')
                                      setSearchReportTerm(summary.post_title)
                                      setFilterReportStatus('pending')
                                    }}
                                    className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg transition-colors"
                                    title="View Individual Reports"
                                  >
                                    <Flag size={16} />
                                  </button>
                                  
                                  {summary.post && (
                                    <button
                                      onClick={() => handleDeletePostFromReport(summary.post_id)}
                                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                      title="Delete Post"
                                      disabled={deletingPostId === summary.post_id}
                                    >
                                      {deletingPostId === summary.post_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 size={16} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {!isDataLoading && filteredReportSummaries.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {filteredReportSummaries.length} posts with {filterMinReports}+ reports for the same reason
                        </p>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={fetchReportSummaries}
                            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                            title="Refresh"
                            disabled={isDataLoading}
                          >
                            <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* All Reports Section */}
            {activeSection === 'reports' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Flag size={22} />
                        All Reports
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full">
                          {reportsCount} total
                        </span>
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all individual reports
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search reports or reasons..."
                          value={searchReportTerm}
                          onChange={(e) => setSearchReportTerm(e.target.value)}
                          className="pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-48 transition-all"
                        />
                      </div>
                      
                      <select
                        value={filterReportStatus}
                        onChange={(e) => setFilterReportStatus(e.target.value as any)}
                        className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedReports.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {selectedReports.length} reports selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleBulkUpdateReports('reviewed')}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-800/30 dark:text-blue-300 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Mark as Reviewed
                          </button>
                          <button
                            onClick={() => handleBulkUpdateReports('resolved')}
                            className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/30 dark:text-green-300 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Mark as Resolved
                          </button>
                          <button
                            onClick={() => handleBulkUpdateReports('dismissed')}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Dismiss
                          </button>
                        </div>
                        <button
                          onClick={handleBulkDeleteReports}
                          className="px-3 py-1.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                        >
                          Delete Selected
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReports([])
                            setIsSelectAllReports(false)
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelectAllReports}
                              onChange={handleSelectAllReports}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                              disabled={isDataLoading}
                            />
                            <span>Movie Title</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reporter
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reported At
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {isDataLoading ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading reports...</p>
                          </td>
                        </tr>
                      ) : filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center">
                            <Flag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No reports found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedReports.includes(report.id)}
                                  onChange={() => handleReportSelect(report.id)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {report.post?.movie_title || 'Unknown Post'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    By: {report.post?.user?.name || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {report.reporter?.avatar_url ? (
                                  <img
                                    src={report.reporter.avatar_url}
                                    alt={report.reporter.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {report.reporter?.name || 'Anonymous'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {report.reporter?.email || 'No email'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                                  {getReportTypeLabel(report.report_type)}
                                </span>
                                {report.reason && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-37.5">
                                    {report.reason}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                  {report.description || report.reason || 'No description provided'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(report.status)}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(report.created_at)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {report.post && (
                                  <button
                                    onClick={() => {
                                      setSelectedPostPreview(report.post!)
                                      setShowPostPreview(true)
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                                    title="View Post"
                                  >
                                    <Eye size={16} />
                                  </button>
                                )}
                                
                                <div className="relative group">
                                  <button className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors">
                                    <CheckCircle size={16} />
                                  </button>
                                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                    <button
                                      onClick={() => updateReportStatus(report.id, 'reviewed')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                                    >
                                      Mark Reviewed
                                    </button>
                                    <button
                                      onClick={() => updateReportStatus(report.id, 'resolved')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      Mark Resolved
                                    </button>
                                    <button
                                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                                
                                {report.post && (
                                  <button
                                    onClick={() => handleDeletePostFromReport(report.post_id)}
                                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Post"
                                    disabled={deletingPostId === report.post_id}
                                  >
                                    {deletingPostId === report.post_id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors"
                                  title="Delete Report"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {!isDataLoading && filteredReports.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredReports.length} of {reports.length} reports
                        {stats.pendingReports > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 text-xs rounded-full">
                            {stats.pendingReports} pending
                          </span>
                        )}
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setActiveSection('threshold-reports')}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-800/30 dark:text-red-300 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <AlertOctagon size={14} />
                          View Same-Reason Reports ({pendingThresholdReports})
                        </button>
                        <button
                          onClick={fetchReports}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="Refresh"
                          disabled={isDataLoading}
                        >
                          <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Grid with Reports */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-7 h-7 opacity-80" />
                      <span className="text-2xl font-bold">{stats.totalUsers}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2">Total Users</h3>
                    <p className="text-blue-100 text-sm opacity-90">{stats.todayUsers} new today</p>
                  </div>

                  <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Film className="w-7 h-7 opacity-80" />
                      <span className="text-2xl font-bold">{stats.totalPosts}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2">Total Posts</h3>
                    <p className="text-purple-100 text-sm opacity-90">{stats.publishedPosts} published</p>
                  </div>

                  <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <MessageCircle className="w-7 h-7 opacity-80" />
                      <span className="text-2xl font-bold">{stats.totalComments}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2">Total Comments</h3>
                    <p className="text-green-100 text-sm opacity-90">Across all posts</p>
                  </div>

                  <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <BarChart className="w-7 h-7 opacity-80" />
                      <span className="text-2xl font-bold">{Math.round((stats.publishedPosts / Math.max(stats.totalPosts, 1)) * 100)}%</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2">Published Rate</h3>
                    <p className="text-amber-100 text-sm opacity-90">Posts published</p>
                  </div>

                  <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <AlertOctagon className="w-7 h-7 opacity-80" />
                      <span className="text-2xl font-bold">{stats.thresholdReports}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2">Posts with 2+ Reports (Same Reason)</h3>
                    <p className="text-red-100 text-sm opacity-90">Require immediate attention</p>
                  </div>
                </div>

                {/* Quick Actions with Reports Link */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <button
                      onClick={() => setActiveSection('threshold-reports')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg hover:shadow-lg transition-all duration-200 ${
                        pendingThresholdReports > 0
                          ? 'bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 animate-pulse'
                          : 'bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      <AlertOctagon className={`w-7 h-7 mb-2 ${
                        pendingThresholdReports > 0
                          ? 'text-red-600 dark:text-red-400 animate-bounce'
                          : 'text-red-600 dark:text-red-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Review Same-Reason Reports</span>
                      {pendingThresholdReports > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {pendingThresholdReports}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('reports')}
                      className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Flag className="w-7 h-7 text-orange-600 dark:text-orange-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">All Reports</span>
                      {reportsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                          {reportsCount > 9 ? '9+' : reportsCount}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('messages')}
                      className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <MessageSquare className="w-7 h-7 text-blue-600 dark:text-blue-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Send Message</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('posts')}
                      className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Film className="w-7 h-7 text-purple-600 dark:text-purple-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Posts</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveSection('users')}
                      className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Users className="w-7 h-7 text-green-600 dark:text-green-400 mb-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">View Users</span>
                    </button>
                  </div>
                </div>

                {/* Recent Threshold Reports */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <AlertOctagon className="mr-2" size={20} />
                      Recent Posts with Multiple Reports (Same Reason)
                    </h3>
                    <button
                      onClick={() => setActiveSection('threshold-reports')}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {reportSummaries.slice(0, 5).map(summary => (
                      <div key={summary.post_id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              summary.report_count >= 10 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : summary.report_count >= 5
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {summary.report_count} reports
                            </span>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {summary.post_title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {summary.common_reasons?.slice(0, 2).join(', ')} • {summary.unique_reporters} unique reporters
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleBulkResolvePostReports(summary.post_id, 'accept')}
                            className="p-1.5 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors"
                            title="Accept & Resolve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          {summary.post && (
                            <button
                              onClick={() => {
                                setSelectedPostPreview(summary.post!)
                                setShowPostPreview(true)
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                              title="View Post"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {reportSummaries.length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle className="w-8 h-8 text-green-300 dark:text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No posts with multiple reports for same reason</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Users</h3>
                    <div className="space-y-3">
                      {filteredUsers.slice(0, 5).map(userItem => (
                        <div key={userItem.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                          <div className="flex items-center space-x-3">
                            {userItem.avatar_url ? (
                              <img src={userItem.avatar_url} alt={userItem.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-37.5">{userItem.name}</h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-37.5">{userItem.email}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {userItem.created_at ? formatDate(userItem.created_at).split(',')[0] : 'Recent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
                    <div className="space-y-3">
                      {filteredPosts.slice(0, 5).map(post => (
                        <div key={post.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{post.movie_title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">By {post.user?.name || 'Unknown'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              post.status === 'published' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : post.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Section */}
            {activeSection === 'messages' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100vh-10rem)]">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={22} />
                    Message Users
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Chat with users and provide support
                  </p>
                </div>

                <div className="flex flex-col lg:flex-row h-[calc(100%-4.5rem)]">
                  {/* Users List */}
                  <div className="lg:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchUserTerm}
                          onChange={(e) => setSearchUserTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {filteredUsers.map(userItem => (
                        <div
                          key={userItem.id}
                          onClick={() => {
                            setSelectedUser(userItem)
                            fetchUserMessages(userItem.id)
                          }}
                          className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                            selectedUser?.id === userItem.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {userItem.avatar_url ? (
                              <img
                                src={userItem.avatar_url}
                                alt={userItem.name}
                                className="w-10 h-10 rounded-full border border-white dark:border-gray-800"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {userItem.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {userItem.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="lg:w-2/3 flex flex-col">
                    {selectedUser ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {selectedUser.avatar_url ? (
                                <img
                                  src={selectedUser.avatar_url}
                                  alt={selectedUser.name}
                                  className="w-10 h-10 rounded-full border border-white dark:border-gray-800"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                              )}
                              <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                  {selectedUser.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {selectedUser.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                          {messages.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No messages yet. Start a conversation!
                              </p>
                            </div>
                          ) : (
                            [...messages].reverse().map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_id === 'admin' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-md lg:max-w-lg rounded-lg p-3 shadow-sm ${
                                    message.sender_id === 'admin'
                                      ? 'bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-600'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p className="text-xs opacity-75 mt-1">
                                    {formatDate(message.created_at)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                              onClick={handleSendMessage}
                              disabled={isSendingMessage || !newMessage.trim()}
                              className="px-4 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-sm text-sm"
                            >
                              {isSendingMessage ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send size={16} />
                              )}
                              <span>Send</span>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select a user to start messaging
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Posts Section */}
            {activeSection === 'posts' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Film size={22} />
                        Movie Posts Management
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all movie posts
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search posts..."
                          value={searchPostTerm}
                          onChange={(e) => setSearchPostTerm(e.target.value)}
                          className="pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-48 transition-all"
                        />
                      </div>
                      
                      <select
                        value={filterPostStatus}
                        onChange={(e) => setFilterPostStatus(e.target.value)}
                        className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedPosts.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {selectedPosts.length} posts selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDeleteSelectedPosts}
                          className="px-3 py-1.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm flex items-center gap-2"
                          disabled={isDataLoading || selectedPosts.some(id => deletingPostId === id)}
                        >
                          {isDataLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete Selected
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPosts([])
                            setIsSelectAllPosts(false)
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelectAllPosts}
                              onChange={handleSelectAllPosts}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                              disabled={isDataLoading || deletingPostId !== null}
                            />
                            <span>Movie Title</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Published
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {isDataLoading && !posts.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading posts...</p>
                          </td>
                        </tr>
                      ) : filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center">
                            <Film className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No posts found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedPosts.includes(post.id)}
                                  onChange={() => handlePostSelect(post.id)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                  disabled={isDataLoading || deletingPostId === post.id}
                                />
                                <span className="text-sm text-gray-900 dark:text-white truncate max-w-50">
                                  {post.movie_title}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {post.user?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {post.user?.email}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(post.published_at)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                post.status === 'published'
                                  ? 'bg-linear-to-r from-green-100 to-emerald-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                  : post.status === 'draft'
                                  ? 'bg-linear-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {post.view_count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewPostPreview(post)}
                                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Preview Post"
                                  disabled={deletingPostId === post.id}
                                >
                                  <EyeOff size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete Post"
                                  disabled={isDataLoading || deletingPostId === post.id}
                                >
                                  {deletingPostId === post.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {!isDataLoading && filteredPosts.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredPosts.length} of {posts.length} posts
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-linear-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 text-sm rounded-full">
                          Total Posts: {posts.length}
                        </span>
                        <button
                          onClick={fetchPosts}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="Refresh"
                          disabled={isDataLoading || deletingPostId !== null}
                        >
                          <RefreshCw size={16} className={(isDataLoading || deletingPostId !== null) ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Users Section */}
            {activeSection === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={22} />
                        Users Management
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all user accounts
                      </p>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchUserTerm}
                        onChange={(e) => setSearchUserTerm(e.target.value)}
                        className="pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-48 transition-all"
                      />
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedUsers.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {selectedUsers.length} users selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDeleteSelectedUsers}
                          className="px-3 py-1.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
                          disabled={isDataLoading}
                        >
                          {isDataLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Delete Selected'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUsers([])
                            setIsSelectAllUsers(false)
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelectAllUsers}
                              onChange={handleSelectAllUsers}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                              disabled={isDataLoading}
                            />
                            <span>User</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Posts
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {isDataLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading users...</p>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(userItem.id)}
                                  onChange={() => handleUserSelect(userItem.id)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                  disabled={isDataLoading}
                                />
                                <div className="flex items-center space-x-3">
                                  {userItem.avatar_url ? (
                                    <img
                                      src={userItem.avatar_url}
                                      alt={userItem.name}
                                      className="w-10 h-10 rounded-full border border-white dark:border-gray-800 cursor-pointer"
                                      onClick={() => {
                                        setSelectedUserProfile(userItem)
                                        setShowUserProfileModal(true)
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center border border-white dark:border-gray-800 cursor-pointer"
                                      onClick={() => {
                                        setSelectedUserProfile(userItem)
                                        setShowUserProfileModal(true)
                                      }}
                                    >
                                      <User className="w-5 h-5 text-white" />
                                    </div>
                                  )}
                                  <div>
                                    <div 
                                      className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                      onClick={() => {
                                        setSelectedUserProfile(userItem)
                                        setShowUserProfileModal(true)
                                      }}
                                    >
                                      {userItem.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      ID: {userItem.id.substring(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white truncate max-w-50">
                                  {userItem.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(userItem.created_at || '')}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Film className="w-4 h-4 text-gray-400" />
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  (userItem.posts_count || 0) > 0
                                    ? 'bg-linear-to-r from-green-100 to-emerald-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                  {userItem.posts_count || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleMessageUser(userItem)}
                                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors hover:scale-110 active:scale-95"
                                  title="Message User"
                                  disabled={isDataLoading}
                                >
                                  <MessageSquare size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(userItem.id)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete User Account"
                                  disabled={isDataLoading || deletingUserId === userItem.id}
                                >
                                  {deletingUserId === userItem.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {!isDataLoading && filteredUsers.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredUsers.length} of {users.length} users
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-linear-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 text-sm rounded-full">
                          Total Users: {users.length}
                        </span>
                        <button
                          onClick={fetchUsers}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="Refresh"
                          disabled={isDataLoading}
                        >
                          <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            {activeSection === 'comments' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MessageCircle size={22} />
                        Comments Management
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        View and manage all comments
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search comments..."
                          value={searchCommentTerm}
                          onChange={(e) => setSearchCommentTerm(e.target.value)}
                          className="pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-48 transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteSelectedComments}
                          className="px-3 py-2.5 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm whitespace-nowrap"
                          disabled={selectedComments.length === 0 || isDataLoading}
                        >
                          {isDataLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            `Delete Selected (${selectedComments.length})`
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  {selectedComments.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          {selectedComments.length} comments selected
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedComments([])
                            setIsSelectAllComments(false)
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelectAllComments}
                              onChange={handleSelectAllComments}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                              disabled={isDataLoading}
                            />
                            <span>Comment</span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Movie Post
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {isDataLoading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading comments...</p>
                          </td>
                        </tr>
                      ) : filteredComments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center">
                            <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No comments found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredComments.map((comment) => (
                          <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-start space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedComments.includes(comment.id)}
                                  onChange={() => handleCommentSelect(comment.id)}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 mt-1"
                                  disabled={isDataLoading}
                                />
                                <div className="max-w-md">
                                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                {comment.user?.avatar_url ? (
                                  <img
                                    src={comment.user.avatar_url}
                                    alt={comment.user.name}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {comment.user?.name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {comment.user?.email || 'No email'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-md">
                                <p className="text-sm text-gray-900 dark:text-white truncate">
                                  {comment.post?.movie_title || 'Unknown Post'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(comment.created_at)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors"
                                  title="Delete Comment"
                                  disabled={isDataLoading || deletingCommentId === comment.id}
                                >
                                  {deletingCommentId === comment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {!isDataLoading && filteredComments.length > 0 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredComments.length} of {comments.length} comments
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-linear-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300 text-sm rounded-full">
                          Total Comments: {comments.length}
                        </span>
                        <button
                          onClick={fetchComments}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-all"
                          title="Refresh"
                          disabled={isDataLoading}
                        >
                          <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* User Profile Modal */}
      {showUserProfileModal && selectedUserProfile && (
        <AuthorProfileModal
          userId={selectedUserProfile.id}
          isOpen={showUserProfileModal}
          onClose={() => setShowUserProfileModal(false)}
        />
      )}
    </div>
  )
}