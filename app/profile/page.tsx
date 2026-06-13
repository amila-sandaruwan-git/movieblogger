// app/profile/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface ProfileData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  facebook_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  achievements: any[]
  reading_history: any[]
}

interface SocialLink {
  key: 'facebook_url' | 'instagram_url' | 'twitter_url' | 'linkedin_url'
  label: string
  icon: string
  domain: string
  baseUrl: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<ProfileData>>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [urlErrors, setUrlErrors] = useState<{[key: string]: string}>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const socialLinks: SocialLink[] = [
    { 
      key: 'facebook_url', 
      label: 'Facebook', 
      icon: '📘', 
      domain: 'facebook.com',
      baseUrl: 'https://facebook.com/'
    },
    { 
      key: 'instagram_url', 
      label: 'Instagram', 
      icon: '📷', 
      domain: 'instagram.com',
      baseUrl: 'https://instagram.com/'
    },
    { 
      key: 'twitter_url', 
      label: 'Twitter', 
      icon: '🐦', 
      domain: 'twitter.com',
      baseUrl: 'https://twitter.com/'
    },
    { 
      key: 'linkedin_url', 
      label: 'LinkedIn', 
      icon: '💼', 
      domain: 'linkedin.com',
      baseUrl: 'https://linkedin.com/in/'
    }
  ]

  // Function to validate social media URLs
  const validateSocialUrl = (url: string, social: SocialLink): boolean => {
    if (!url) return true // Empty URLs are valid (user can clear the field)
    
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.includes(social.domain)
    } catch {
      return false
    }
  }

  // Function to format URL - add https:// if missing and ensure it's for the correct platform
  const formatSocialUrl = (url: string, social: SocialLink): string => {
    if (!url) return ''
    
    // If it's just a username, prepend the base URL
    if (!url.includes('://') && !url.startsWith('www.')) {
      return `${social.baseUrl}${url}`
    }
    
    // If it has www but no protocol, add https://
    if (url.startsWith('www.')) {
      return `https://${url}`
    }
    
    // If it's missing protocol, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    
    return url
  }

  // Function to check if a social link is provided and valid
  const hasValidSocialLink = (socialKey: SocialLink['key']): boolean => {
    const url = profile?.[socialKey] as string | null
    if (!url) return false
    
    const social = socialLinks.find(s => s.key === socialKey)
    return social ? validateSocialUrl(url, social) : false
  }

  // Function to get social link status color
  const getSocialLinkStatus = (socialKey: SocialLink['key']): 'valid' | 'invalid' | 'empty' => {
    const url = profile?.[socialKey] as string | null
    if (!url) return 'empty'
    
    const social = socialLinks.find(s => s.key === socialKey)
    return social && validateSocialUrl(url, social) ? 'valid' : 'invalid'
  }

  // Function to refresh app data
  const refreshAppData = useCallback(async () => {
    try {
      // Refresh the router to update all client components
      router.refresh()
    } catch (error) {
      console.error('Error refreshing app data:', error)
    }
  }, [router])

  // Check if form has changes
  const checkForChanges = useCallback(() => {
    if (!profile) return false
    
    const hasChanges = 
      formData.name !== profile.name ||
      formData.bio !== profile.bio ||
      formData.facebook_url !== profile.facebook_url ||
      formData.instagram_url !== profile.instagram_url ||
      formData.twitter_url !== profile.twitter_url ||
      formData.linkedin_url !== profile.linkedin_url ||
      avatarFile !== null ||
      bannerFile !== null
    
    setHasUnsavedChanges(hasChanges)
    return hasChanges
  }, [profile, formData, avatarFile, bannerFile])

  // Manual save function
  const handleSave = async () => {
    if (!profile || !isEditing) return

    // Validate all social URLs before saving
    const newUrlErrors: {[key: string]: string} = {}
    let hasErrors = false
    
    socialLinks.forEach(social => {
      const url = formData[social.key] as string | undefined
      if (url && !validateSocialUrl(url, social)) {
        newUrlErrors[social.key] = `Please enter a valid ${social.label} URL`
        hasErrors = true
      }
    })

    if (hasErrors) {
      setUrlErrors(newUrlErrors)
      return
    }

    setIsSaving(true)
    setError(null)
    setUrlErrors({})
    
    try {
      let avatarUrl = formData.avatar_url
      let bannerUrl = formData.banner_url

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `private/${profile.id}/${Date.now()}_avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      // Upload new banner if selected
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop()
        const fileName = `private/${profile.id}/${Date.now()}_banner.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, bannerFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName)

        bannerUrl = publicUrl
      }

      // Format social URLs before saving
      const formattedFormData = { ...formData }
      socialLinks.forEach(social => {
        const url = formData[social.key] as string | undefined
        if (url) {
          (formattedFormData as any)[social.key] = formatSocialUrl(url, social)
        }
      })

      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formattedFormData.name,
          bio: formattedFormData.bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          facebook_url: formattedFormData.facebook_url,
          instagram_url: formattedFormData.instagram_url,
          linkedin_url: formattedFormData.linkedin_url,
          twitter_url: formattedFormData.twitter_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      // Refresh the entire app to update homepage and all components
      await refreshAppData()

      // Update local state with the saved data
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile)
        setFormData(updatedProfile)
      }

      // Exit edit mode and reset states
      setIsEditing(false)
      setHasUnsavedChanges(false)
      setAvatarFile(null)
      setBannerFile(null)
      
      console.log('Save successful')
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError('Save failed: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)

    // Clear error for social URL fields when user starts typing
    if (field.includes('_url') && urlErrors[field]) {
      setUrlErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [urlErrors])

  useEffect(() => {
    fetchProfile()
  }, [])

  // Check for changes whenever formData or files change
  useEffect(() => {
    if (isEditing) {
      checkForChanges()
    }
  }, [formData, avatarFile, bannerFile, isEditing, checkForChanges])

  // Add real-time subscription for profile updates
  useEffect(() => {
    if (!profile?.id) return

    // Subscribe to real-time profile changes
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`
        },
        (payload) => {
          // Update local state with new data
          const updatedProfile = payload.new as ProfileData
          setProfile(updatedProfile)
          setFormData(updatedProfile)
          
          // Refresh the app to update other components
          refreshAppData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase, refreshAppData])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error('Authentication error: ' + userError.message)
      }
      
      if (!user) {
        router.push('/login')
        return
      }

      console.log('Fetching profile for user:', user.id)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          await createProfile(user)
          return
        }
        
        throw new Error('Failed to fetch profile: ' + profileError.message)
      }

      console.log('Profile found:', data)
      setProfile(data)
      setFormData(data)
      
    } catch (error: any) {
      console.error('Error in fetchProfile:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const createProfile = async (user: any) => {
    try {
      console.log('Creating new profile for user:', user.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || 
                user.user_metadata?.full_name || 
                user.user_metadata?.user_name || 
                user.email?.split('@')[0] ||
                'User',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     user.user_metadata?.image,
          banner_url: null,
          bio: null,
          facebook_url: null,
          instagram_url: null,
          linkedin_url: null,
          twitter_url: null,
          achievements: [],
          reading_history: []
        })
        .select()
        .single()

      if (error) {
        throw new Error('Failed to create profile: ' + error.message)
      }

      console.log('Profile created:', data)
      setProfile(data)
      setFormData(data)
      
    } catch (error: any) {
      console.error('Error creating profile:', error)
      setError(error.message)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)

      if (error) throw error

      // Update both states immediately
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null)
      setFormData(prev => ({ ...prev, avatar_url: null }))
      
      // Refresh app data
      await refreshAppData()
      
    } catch (error: any) {
      console.error('Error removing avatar:', error)
      setError(error.message)
    }
  }

  const handleRemoveBanner = async () => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banner_url: null })
        .eq('id', profile.id)

      if (error) throw error

      // Update both states immediately
      setProfile(prev => prev ? { ...prev, banner_url: null } : null)
      setFormData(prev => ({ ...prev, banner_url: null }))
      
      // Refresh app data
      await refreshAppData()
      
    } catch (error: any) {
      console.error('Error removing banner:', error)
      setError(error.message)
    }
  }

  const handleSocialUrlChange = (socialKey: SocialLink['key'], value: string) => {
    handleFieldChange(socialKey, value)
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setFormData(profile)
    }
    setAvatarFile(null)
    setBannerFile(null)
    setUrlErrors({})
    setHasUnsavedChanges(false)
  }

  const handleEditProfile = () => {
    setIsEditing(true)
    if (profile) {
      setFormData(profile)
    }
    setAvatarFile(null)
    setBannerFile(null)
    setUrlErrors({})
    setHasUnsavedChanges(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading profile...</div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">Error: {error}</div>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="ml-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg mb-4">Profile not found</div>
          <button
            onClick={fetchProfile}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 right-0 px-4 py-3"
          >
            ×
          </button>
        </div>
      )}

      {/* Banner Cover Image */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-800">
        {isEditing ? (
          <div className="relative h-full">
            {/* Show banner preview if a new file is selected */}
            {bannerFile ? (
              <div className="w-full h-full">
                <img
                  src={URL.createObjectURL(bannerFile)}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                  Preview - Click Save to confirm
                </div>
              </div>
            ) : formData.banner_url ? (
              <Image
                src={formData.banner_url || ''}
                alt="Banner"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white text-lg">No banner image</span>
              </div>
            )}
            
            {/* Banner buttons - REDESIGNED to match profile image button style */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {/* Upload Button - Circle style like profile image */}
              <div className="relative">
                <input
                  type="file"
                  id="banner-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBannerFile(e.target.files[0])
                      setHasUnsavedChanges(true)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  className="bg-black dark:bg-white text-white dark:text-black p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors inline-flex items-center justify-center"
                  title={formData.banner_url || bannerFile ? 'Change Banner' : 'Add Banner'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Delete Button - Only show if there's a banner */}
              {(formData.banner_url || bannerFile) && (
                <button
                  onClick={handleRemoveBanner}
                  className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center"
                  title="Delete Banner"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ) : profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white text-lg">No banner image</span>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        {/* Profile Image and Basic Info */}
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-700 overflow-hidden">
              {isEditing && avatarFile ? (
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : isEditing && formData.avatar_url ? (
                <Image
                  src={formData.avatar_url || ''}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : !isEditing && profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600 dark:text-gray-300">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Profile image buttons */}
            {isEditing && (
              <div className="absolute bottom-0 right-0 flex space-x-1">
                <div className="relative">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatarFile(e.target.files[0])
                        setHasUnsavedChanges(true)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="bg-white dark:bg-gray-700 p-2 rounded-full cursor-pointer shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors inline-flex items-center justify-center"
                    title="Change Profile Image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                {(formData.avatar_url || avatarFile) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors inline-flex items-center justify-center"
                    title="Remove Profile Image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Name and Actions */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                {isEditing ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="text-3xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white text-gray-900 dark:text-white"
                    />
                    {hasUnsavedChanges && (
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                        Unsaved
                      </span>
                    )}
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                )}
                <p className="text-gray-600 dark:text-gray-400 mt-1">{profile.email}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                {isEditing ? (
                  // Show Cancel and Save buttons when editing
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !hasUnsavedChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  // Show Edit Profile button when not editing
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your profile content... */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bio and Social Links */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio/About */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
                {isEditing && hasUnsavedChanges && (
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    Unsaved
                  </span>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full h-32 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-white resize-none"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {profile.bio || 'No bio provided yet.'}
                </p>
              )}
            </div>

            {/* Social Media Links */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Social Links</h2>
                {isEditing && hasUnsavedChanges && (
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialLinks.map((social) => {
                  const status = getSocialLinkStatus(social.key)
                  const statusColors = {
                    valid: 'text-green-600 dark:text-green-400',
                    invalid: 'text-red-500 dark:text-red-400 opacity-60',
                    empty: 'text-gray-400 dark:text-gray-500 opacity-50'
                  }
                  
                  return (
                    <div key={social.key} className="flex items-center space-x-3">
                      <div className={`text-2xl transition-all duration-300 ${
                        status === 'valid' 
                          ? 'scale-110 filter brightness-110' 
                          : status === 'invalid'
                          ? 'opacity-60'
                          : 'opacity-50'
                      }`}>
                        {social.icon}
                      </div>
                      {isEditing ? (
                        <div className="flex-1">
                          <input
                            type="url"
                            value={formData[social.key] as string || ''}
                            onChange={(e) => handleSocialUrlChange(social.key, e.target.value)}
                            placeholder={`${social.label} URL or username`}
                            className={`w-full bg-white dark:bg-gray-700 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-gray-900 dark:text-white ${
                              urlErrors[social.key] 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-gray-300 dark:border-gray-600 focus:ring-black dark:focus:ring-white'
                            }`}
                          />
                          {urlErrors[social.key] && (
                            <p className="text-red-500 text-xs mt-1">{urlErrors[social.key]}</p>
                          )}
                          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                            Example: {social.baseUrl}username
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <p className={`font-medium transition-colors duration-300 ${statusColors[status]}`}>
                            {social.label}
                          </p>
                          {/* Hide the actual URL, only show status */}
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {status === 'valid' 
                              ? 'Connected' 
                              : status === 'invalid'
                              ? 'Invalid URL'
                              : 'Not connected'
                            }
                          </p>
                          {status === 'valid' && (
                            <a 
                              href={profile[social.key] as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                            >
                              Visit {social.label}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Achievements and Reading History */}
          <div className="space-y-6">
            {/* Achievements/Badges */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
              <div className="space-y-2">
                {profile.achievements && profile.achievements.length > 0 ? (
                  profile.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{achievement.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No achievements yet</p>
                )}
              </div>
            </div>

            {/* Reading History */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recently Viewed</h2>
              <div className="space-y-2">
                {profile.reading_history && profile.reading_history.length > 0 ? (
                  profile.reading_history.slice(0, 5).map((item, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Viewed {new Date(item.viewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">No recent views</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}