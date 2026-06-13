// app/about/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  Film, 
  Users, 
  Award, 
  Heart, 
  Globe, 
  Star, 
  Zap, 
  TrendingUp, 
  MessageSquare,
  Shield,
  Sparkles,
  CheckCircle,
  Clock,
  Target,
  Eye
} from 'lucide-react'

interface PostStats {
  genre_tags: any[]
  movie_title?: string
}

export default function AboutPage() {
  const [user, setUser] = useState<any>(null)
  const [userWithProfile, setUserWithProfile] = useState<any>(null)
  const [activeTeamMember, setActiveTeamMember] = useState(0)
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalUsers: 0,
    totalGenres: 0,
    totalMovies: 0
  })

  const supabase = createClient()

  const teamMembers = [
    {
      id: 1,
      name: "Alex Morgan",
      role: "Founder & Lead Developer",
      bio: "Passionate cinephile with 10+ years in software engineering. Believes every movie has a story worth telling.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      skills: ["React", "Next.js", "Cinematography"],
      favoriteGenres: ["Sci-Fi", "Thriller", "Documentary"]
    },
    {
      id: 2,
      name: "Samira Patel",
      role: "Head of Content",
      bio: "Film critic and journalist with a background in film studies. Curates our featured reviews and editorials.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samira",
      skills: ["Film Criticism", "Content Strategy", "Community Building"],
      favoriteGenres: ["Drama", "Animation", "Foreign Films"]
    },
    {
      id: 3,
      name: "Marcus Chen",
      role: "UI/UX Designer",
      bio: "Creates beautiful, intuitive interfaces that make discovering movies a delightful experience.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
      skills: ["Figma", "Motion Design", "User Research"],
      favoriteGenres: ["Action", "Fantasy", "Film Noir"]
    },
    {
      id: 4,
      name: "Elena Rossi",
      role: "Community Manager",
      bio: "Builds and nurtures our growing community of movie enthusiasts from around the world.",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
      skills: ["Community Engagement", "Social Media", "Event Planning"],
      favoriteGenres: ["Romance", "Comedy", "Musical"]
    }
  ]

  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Passion for Cinema",
      description: "We believe every movie has value and every opinion matters in the world of cinema.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community First",
      description: "Our platform thrives on the diverse perspectives of movie lovers worldwide.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Authenticity",
      description: "Genuine, unbiased reviews from real people who love movies as much as you do.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Perspective",
      description: "Celebrating cinema from Hollywood blockbusters to hidden international gems.",
      color: "from-purple-500 to-violet-500"
    }
  ]

  const features = [
    {
      icon: <Star className="w-5 h-5" />,
      title: "Personalized Recommendations",
      description: "Get movie suggestions tailored to your taste and watching history."
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Rich Discussions",
      description: "Engage in meaningful conversations with fellow movie enthusiasts."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Trending Insights",
      description: "Stay updated with what's hot in the world of cinema."
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Fast & Intuitive",
      description: "Beautiful interface that makes browsing and reviewing effortless."
    }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Fetch profile for current user
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', currentUser.id)
          .single()

        const name = profile?.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User'
        const avatar = profile?.avatar_url || currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null

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

      // Fetch stats - Fixed: Include movie_title in the select
      const { data: postsData } = await supabase
        .from('posts')
        .select('genre_tags, movie_title')
        .eq('status', 'published')
        .eq('visibility', 'public')

      const { data: profilesData } = await supabase
        .from('user_public_profiles')
        .select('id')

      if (postsData) {
        const allGenres = Array.from(new Set(postsData.flatMap(post => post.genre_tags || [])))
        const uniqueMovies = Array.from(new Set(
          postsData
            .map(post => post.movie_title)
            .filter((title): title is string => Boolean(title))
        ))

        setStats({
          totalReviews: postsData.length,
          totalUsers: profilesData?.length || 0,
          totalGenres: allGenres.length,
          totalMovies: uniqueMovies.length
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set fallback stats if fetch fails
      setStats({
        totalReviews: 1250,
        totalUsers: 320,
        totalGenres: 28,
        totalMovies: 850
      })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Film className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                About <span className="text-blue-600 dark:text-blue-400">MovieReel</span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Where movie lovers unite to share, discover, and celebrate the magic of cinema.
            </p>
            
            <div className="inline-flex items-center space-x-4 text-lg text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Since 2023
              </span>
              <span>•</span>
              <span>Made with ❤️ for film enthusiasts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                At MovieReel, we're on a mission to create the most vibrant and authentic community for movie lovers worldwide. 
                We believe that every film deserves thoughtful discussion and every moviegoer deserves a platform to share their voice.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Democratize film criticism by giving everyone a voice
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Connect passionate movie enthusiasts from around the globe
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1 shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Preserve diverse perspectives on cinema for future generations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-linear-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {stats.totalReviews.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Movie Reviews</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {stats.totalUsers.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Community Members</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {stats.totalGenres.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Film Genres</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">
                      {stats.totalMovies.toLocaleString()}+
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Unique Movies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do at MovieReel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${value.color} flex items-center justify-center mb-4`}>
                  <div className="text-white">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose MovieReel?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience cinema discussion like never before
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center shrink-0">
                  <div className="text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-linear-to-br from-gray-900 to-black text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-linear-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Meet Our Team</h2>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              A passionate group of film enthusiasts and tech innovators
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
            {teamMembers.map((member, index) => (
              <div 
                key={member.id}
                className={`bg-gray-800 rounded-xl p-6 shadow-lg transition-all duration-300 cursor-pointer ${
                  activeTeamMember === index 
                    ? 'ring-2 ring-yellow-500 transform -translate-y-1' 
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveTeamMember(index)}
                onMouseEnter={() => setActiveTeamMember(index)}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-16 h-16 rounded-full border-2 border-yellow-500"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{member.name}</h3>
                    <p className="text-yellow-400 text-sm">{member.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-gray-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs mb-1">Favorite Genres</div>
                    <div className="flex flex-wrap gap-1">
                      {member.favoriteGenres.map((genre, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-yellow-500/20 rounded text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Active Team Member Details */}
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-8">
            <div className="flex items-center gap-6">
              <img 
                src={teamMembers[activeTeamMember].avatar} 
                alt={teamMembers[activeTeamMember].name}
                className="w-20 h-20 rounded-full border-2 border-yellow-500"
              />
              <div>
                <h3 className="text-2xl font-bold">{teamMembers[activeTeamMember].name}</h3>
                <p className="text-yellow-400 text-lg">{teamMembers[activeTeamMember].role}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                {teamMembers[activeTeamMember].bio}
              </p>
              <div className="mt-6 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Currently watching:</span>
                  <span className="text-yellow-400">5+ films/week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Movie buff for:</span>
                  <span className="text-yellow-400">15+ years</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Community CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-12">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Join Our Community?
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Share your movie insights, discover hidden gems, and connect with fellow cinephiles from around the world.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-medium text-lg inline-flex items-center justify-center gap-2"
                  >
                    <span>Write a Review</span>
                    <span>→</span>
                  </Link>
                  <Link 
                    href="/reviews"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-300 font-medium text-lg"
                  >
                    Explore Reviews
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/signup"
                    className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-medium text-lg inline-flex items-center justify-center gap-2"
                  >
                    <span>Join Free</span>
                    <span>→</span>
                  </Link>
                  <Link 
                    href="/reviews"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-300 font-medium text-lg"
                  >
                    Browse Reviews
                  </Link>
                </>
              )}
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mt-6 text-sm">
              No credit card required • Join thousands of movie lovers
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-linear-to-br from-gray-900 to-black text-white py-16 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Film className="w-6 h-6 text-blue-400" />
                <span className="text-2xl font-bold">MovieReel</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Your ultimate guide to the world of cinema. Discover reviews, news, and hidden gems from passionate movie lovers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Links
              </h4>
              <ul className="space-y-3 text-gray-400">
                <li>
                  <Link href="/reviews" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                    Reviews
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-2 group">
                    <span className="w-0 h-0 rounded-full bg-blue-500 group-hover:w-2 group-hover:h-2 transition-all" />
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Stay Updated
              </h4>
              <p className="text-gray-400 mb-4 text-sm">
                Get the latest movie news and reviews delivered to your inbox.
              </p>
              <div className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} MovieReel. All rights reserved.</p>
            <p className="text-sm mt-2">Made with ❤️ for the love of cinema</p>
          </div>
        </div>
      </footer>
    </div>
  )
}