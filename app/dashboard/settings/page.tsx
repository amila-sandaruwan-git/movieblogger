// app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  User, 
  Mail, 
  Calendar, 
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  role: string
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
}

interface DeletionRequest {
  id: string
  user_id: string
  requested_at: string
  scheduled_deletion_date: string
  status: 'pending' | 'cancelled' | 'completed'
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
    checkDeletionRequest()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkDeletionRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      setDeletionRequest(data || null)
    } catch (error) {
      console.error('Error checking deletion request:', error)
    }
  }

  const requestAccountDeletion = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Calculate deletion date (7 days from now)
      const deletionDate = new Date()
      deletionDate.setDate(deletionDate.getDate() + 7)

      // Create deletion request
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          requested_at: new Date().toISOString(),
          scheduled_deletion_date: deletionDate.toISOString(),
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setDeletionRequest(data)
      setSuccess('Account deletion request submitted. Your account will be deleted in 7 days.')
      setShowDeleteConfirm(false)
      setConfirmText('')
      
    } catch (error) {
      console.error('Error requesting deletion:', error)
      setError('Failed to request account deletion. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDeletionRequest = async () => {
    if (!confirm('Are you sure you want to cancel the account deletion request?')) return

    setIsDeleting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('account_deletion_requests')
        .update({ status: 'cancelled' })
        .eq('id', deletionRequest?.id)

      if (error) throw error

      setDeletionRequest(null)
      setSuccess('Account deletion request has been cancelled.')
    } catch (error) {
      console.error('Error cancelling deletion:', error)
      setError('Failed to cancel deletion request. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (scheduledDate: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledDate)
    const diffTime = scheduled.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Your personal information and public profile details
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{profile?.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile?.role}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{profile?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-gray-900 dark:text-white">
                  {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bio</p>
              <p className="text-gray-900 dark:text-white">{profile.bio}</p>
            </div>
          )}

          {/* Social Links */}
          {(profile?.facebook_url || profile?.instagram_url || profile?.twitter_url || profile?.linkedin_url) && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Social Links</p>
              <div className="flex gap-3">
                {profile?.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                    Twitter
                  </a>
                )}
                {profile?.instagram_url && (
                  <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700">
                    Instagram
                  </a>
                )}
                {profile?.facebook_url && (
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    Facebook
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account Management</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage your account settings and data
          </p>
        </div>
        
        <div className="p-6">
          {deletionRequest ? (
            // Show pending deletion request
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Account Deletion Scheduled
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                    Your account is scheduled for deletion on{' '}
                    <strong>{formatDate(deletionRequest.scheduled_deletion_date)}</strong>
                    ({getDaysRemaining(deletionRequest.scheduled_deletion_date)} days remaining)
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                    All your posts, comments, and data will be permanently deleted. This action cannot be undone.
                  </p>
                  <button
                    onClick={cancelDeletionRequest}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 inline mr-2" />
                    )}
                    Cancel Deletion
                  </button>
                </div>
              </div>
            </div>
          ) : showDeleteConfirm ? (
            // Show delete confirmation form
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    This action will schedule your account for deletion in 7 days. You can cancel anytime before then.
                    All your data including posts, comments, and profile information will be permanently removed.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      Type <strong className="font-mono">DELETE MY ACCOUNT</strong> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                      className="w-full md:w-96 px-4 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={requestAccountDeletion}
                      disabled={isDeleting || confirmText !== 'DELETE MY ACCOUNT'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 inline mr-2" />
                          Schedule Deletion
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setConfirmText('')
                        setError(null)
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show delete account button
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete Account
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Warning: This action cannot be undone. Your account will be scheduled for deletion after 7 days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}