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

  const statCards = [
    { label: 'Movie Reviews', value: stats.totalReviews },
    { label: 'Community Members', value: stats.totalUsers },
    { label: 'Film Genres', value: stats.totalGenres },
    { label: 'Unique Movies', value: stats.totalMovies },
  ]

  const missionPoints = [
    'Democratize film criticism by giving everyone a voice',
    'Connect passionate movie enthusiasts from around the globe',
    'Preserve diverse perspectives on cinema for future generations',
  ]

  const active = teamMembers[activeTeamMember]

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* ================= HERO ================= */}
      <header className="relative isolate overflow-hidden border-b border-white/10">
        <img src="/browse.jpg" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
        <div className="mb-vignette absolute inset-0 -z-10" />
        <div className="mb-container animate-fade-up py-24 text-center sm:py-32">
          <p className="mb-eyebrow mb-5 inline-flex items-center gap-2">
            <Sparkles size={14} /> Since 2023
          </p>
          <h1 className="mb-display mx-auto max-w-4xl text-5xl font-semibold leading-[1.05] sm:text-7xl">
            About <span className="text-gold-400">MovieBlogger</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl">
            Where movie lovers unite to share, discover, and celebrate the magic of cinema.
          </p>
        </div>
      </header>

      {/* ================= MISSION ================= */}
      <section className="mb-container py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-eyebrow mb-3 inline-flex items-center gap-2"><Target size={14} /> Our mission</p>
            <h2 className="mb-section-title !text-3xl sm:!text-4xl">A stage for every film lover&apos;s voice.</h2>
            <p className="mt-5 text-lg leading-relaxed text-gray-400">
              At MovieBlogger, we&apos;re on a mission to create the most vibrant and authentic community for movie lovers worldwide.
              We believe that every film deserves thoughtful discussion and every moviegoer deserves a platform to share their voice.
            </p>
            <ul className="mt-8 space-y-4">
              {missionPoints.map(p => (
                <li key={p} className="flex items-start gap-3 text-gray-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-400">
                    <CheckCircle size={14} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statCards.map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl border border-white/10 bg-ink-800/60 p-6 transition hover:-translate-y-1 hover:border-gold-400/40 ${i % 2 === 1 ? 'sm:translate-y-6 hover:sm:translate-y-5' : ''}`}
              >
                <div className="mb-display text-4xl font-semibold text-gold-400">{s.value.toLocaleString()}+</div>
                <div className="mt-1 text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="border-y border-white/10 bg-ink-900/60 py-20">
        <div className="mb-container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-eyebrow mb-3">What we stand for</p>
            <h2 className="mb-section-title">Our Core Values</h2>
            <p className="mt-3 text-gray-400">The principles that guide everything we do at MovieBlogger</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div key={index} className="mb-card !h-auto p-6">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400 ring-1 ring-gold-400/20">
                  {value.icon}
                </span>
                <h3 className="mb-display mb-2 text-lg font-semibold text-white">{value.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="mb-container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-eyebrow mb-3">The experience</p>
          <h2 className="mb-section-title">Why Choose MovieBlogger?</h2>
          <p className="mt-3 text-gray-400">Experience cinema discussion like never before</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-ink-800/50 p-6 transition hover:border-gold-400/30">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">
                {feature.icon}
              </span>
              <div>
                <h3 className="mb-display text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section className="border-t border-white/10 bg-ink-900/60 py-20">
        <div className="mb-container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-eyebrow mb-3 inline-flex items-center gap-2"><Users size={14} /> The crew</p>
            <h2 className="mb-section-title">Meet Our Team</h2>
            <p className="mt-3 text-gray-400">A passionate group of film enthusiasts and tech innovators</p>
          </div>

          <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setActiveTeamMember(index)}
                onMouseEnter={() => setActiveTeamMember(index)}
                aria-pressed={activeTeamMember === index}
                className={`rounded-2xl border p-6 text-left transition-all duration-300 ${
                  activeTeamMember === index
                    ? '-translate-y-1 border-gold-400/60 bg-ink-800 shadow-[0_18px_40px_-18px_rgba(245,196,81,0.3)]'
                    : 'border-white/10 bg-ink-800/50 hover:border-white/20'
                }`}
              >
                <div className="mb-4 flex items-center gap-4">
                  <img src={member.avatar} alt={member.name} className="h-14 w-14 rounded-full border-2 border-gold-400/70 bg-ink-700" />
                  <div className="min-w-0">
                    <h3 className="mb-display truncate font-semibold text-white">{member.name}</h3>
                    <p className="text-xs text-gold-400">{member.role}</p>
                  </div>
                </div>
                <p className="mb-4 line-clamp-3 text-sm text-gray-400">{member.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill, idx) => (
                    <span key={idx} className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-gray-300">{skill}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Active member spotlight */}
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-ink-800/70 p-6 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <img src={active.avatar} alt={active.name} className="h-24 w-24 rounded-full border-2 border-gold-400 bg-ink-700" />
              <div>
                <h3 className="mb-display text-3xl font-semibold">{active.name}</h3>
                <p className="text-lg text-gold-400">{active.role}</p>
              </div>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-gray-300">{active.bio}</p>

            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Favorite genres</p>
              <div className="flex flex-wrap gap-2">
                {active.favoriteGenres.map((genre, idx) => (
                  <span key={idx} className="mb-chip">{genre}</span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Currently watching:</span>
                <span className="font-medium text-gold-400">5+ films/week</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Movie buff for:</span>
                <span className="font-medium text-gold-400">15+ years</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="mb-container py-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-gradient-to-br from-gold-500/15 via-ink-800 to-ink-900 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-400/20 blur-3xl" />
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400 text-ink-950">
            <Sparkles size={26} />
          </span>
          <h2 className="mb-display text-3xl font-semibold sm:text-4xl">Ready to Join Our Community?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Share your movie insights, discover hidden gems, and connect with fellow cinephiles from around the world.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {user ? (
              <>
                <Link href="/dashboard" className="mb-btn-primary !px-8 !py-3.5 !text-base">Write a Review <span>→</span></Link>
                <Link href="/reviews" className="mb-btn-ghost !px-8 !py-3.5 !text-base">Explore Reviews</Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="mb-btn-primary !px-8 !py-3.5 !text-base">Join Free <span>→</span></Link>
                <Link href="/reviews" className="mb-btn-ghost !px-8 !py-3.5 !text-base">Browse Reviews</Link>
              </>
            )}
          </div>
          <p className="mt-6 text-sm text-gray-500">No credit card required • Join thousands of movie lovers</p>
        </div>
      </section>
    </div>
  )
}