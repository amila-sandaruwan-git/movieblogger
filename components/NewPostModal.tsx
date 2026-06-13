// components/NewPostModal.tsx
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NewPostModalProps {
  onClose: () => void
  onPostCreated: () => void
}

interface PostFormData {
  title: string
  content: string
  excerpt: string
  movie_title: string
  movie_background_title: string
  movie_poster_url: string
  release_date: string
  director: string
  cast: string[]
  genre_tags: string[]
  duration: string
  language: string
  rating: number
  rating_scale: '5' | '10'
  trailer_url: string
  categories: string[]
  tags: string[]
  status: 'draft' | 'published' | 'private' | 'scheduled'
  visibility: 'public' | 'private'
  comments_enabled: boolean
  scheduled_for: string
}

export default function NewPostModal({ onClose, onPostCreated }: NewPostModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    excerpt: '',
    movie_title: '',
    movie_background_title: '',
    movie_poster_url: '',
    release_date: '',
    director: '',
    cast: [],
    genre_tags: [],
    duration: '',
    language: '',
    rating: 0,
    rating_scale: '5',
    trailer_url: '',
    categories: [],
    tags: [],
    status: 'draft',
    visibility: 'public',
    comments_enabled: true,
    scheduled_for: '',
  })

  const [currentCast, setCurrentCast] = useState('')
  const [currentGenre, setCurrentGenre] = useState('')
  const [currentCategory, setCurrentCategory] = useState('')
  const [currentTag, setCurrentTag] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Common options
  const genreOptions = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'Biography', 'Family', 'History', 'Musical', 'Sport', 'War', 'Western']
  const categoryOptions = ['Review', 'News', 'Upcoming', 'Trailer', 'Hollywood', 'Bollywood', 'Sinhala', 'Tamil', 'Korean', 'Japanese', 'Chinese', 'European', 'Independent', 'Classic', 'Modern']
  const languageOptions = ['English', 'Sinhala', 'Tamil', 'Hindi', 'Korean', 'Japanese', 'Chinese', 'French', 'Spanish', 'German', 'Italian', 'Russian', 'Other']

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle array fields
  const handleAddToArray = (field: 'cast' | 'genre_tags' | 'categories' | 'tags', currentValue: string, setCurrentValue: (value: string) => void) => {
    if (currentValue.trim() && !formData[field].includes(currentValue.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], currentValue.trim()]
      }))
      setCurrentValue('')
    }
  }

  const handleRemoveFromArray = (field: 'cast' | 'genre_tags' | 'categories' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Handle form submission
  const handleSubmit = async (action: 'publish' | 'draft') => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Validate required fields
      if (!formData.movie_title.trim()) {
        throw new Error('Movie title is required')
      }
      if (!formData.content.trim()) {
        throw new Error('Post content is required')
      }

      const postData = {
        title: formData.title || null,
        content: formData.content,
        excerpt: formData.excerpt || null,
        movie_title: formData.movie_title,
        movie_background_title: formData.movie_background_title || null,
        movie_poster_url: formData.movie_poster_url || null,
        release_date: formData.release_date || null,
        director: formData.director || null,
        cast: formData.cast.length > 0 ? formData.cast : null,
        genre_tags: formData.genre_tags.length > 0 ? formData.genre_tags : null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        language: formData.language || null,
        rating: parseFloat(formData.rating.toString()) || 0,
        rating_scale: formData.rating_scale,
        trailer_url: formData.trailer_url || null,
        categories: formData.categories.length > 0 ? formData.categories : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        status: action === 'publish' ? 'published' : 'draft',
        visibility: formData.visibility,
        comments_enabled: formData.comments_enabled,
        published_at: action === 'publish' ? new Date().toISOString() : null,
        scheduled_for: formData.scheduled_for || null,
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single()

      if (error) throw error

      onPostCreated()
      
    } catch (error: any) {
      console.error('Error saving post:', error)
      setError(error.message || 'Failed to save post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Movie Title *
              </label>
              <input
                type="text"
                value={formData.movie_title}
                onChange={(e) => handleInputChange('movie_title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter movie title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Post Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Write your review here..."
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movie Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Release Date
                </label>
                <input
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => handleInputChange('release_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Director
                </label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => handleInputChange('director', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Director name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex items-center space-x-4">
                <select
                  value={formData.rating_scale}
                  onChange={(e) => handleInputChange('rating_scale', e.target.value as '5' | '10')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="5">Out of 5</option>
                  <option value="10">Out of 10</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={formData.rating_scale}
                  step="0.5"
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="4.5"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories & Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </label>
                <select
                  value={currentCategory}
                  onChange={(e) => setCurrentCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select category</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddToArray('categories', currentCategory, setCurrentCategory)}
                  className="mt-2 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  Add Category
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="comments-enabled"
                checked={formData.comments_enabled}
                onChange={(e) => handleInputChange('comments_enabled', e.target.checked)}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black dark:focus:ring-white dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="comments-enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable comments
              </label>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    currentStep > step ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Basic Info</span>
            <span>Details</span>
            <span>Settings</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Draft'}
              </button>

              {currentStep === 3 ? (
                <button
                  onClick={() => handleSubmit('publish')}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-300"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}