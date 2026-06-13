// components/ViewCount.tsx - WITH OPTION TO HIDE DETAILS
'use client'

import { Eye, Users, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ViewCountProps {
  initialCount: number
  postId: string
  showIcon?: boolean
  showBreakdown?: boolean
  showDetailedStats?: boolean  // New prop
  className?: string
}

interface ViewBreakdown {
  authenticated_views: number
  anonymous_views: number
  unique_authenticated_users: number
  unique_emails: number
  unique_sessions: number
}

export function ViewCount({ 
  initialCount, 
  postId, 
  showIcon = true,
  showBreakdown = false,
  showDetailedStats = false,  // Default to false
  className = ''
}: ViewCountProps) {
  const [currentCount, setCurrentCount] = useState(initialCount)
  const [isUpdating, setIsUpdating] = useState(false)
  const [breakdown, setBreakdown] = useState<ViewBreakdown | null>(null)
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false)
  const [breakdownError, setBreakdownError] = useState<string | null>(null)

  // Fetch breakdown on mount
  useEffect(() => {
    if (showBreakdown) {
      fetchBreakdown()
    }
  }, [postId, showBreakdown])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`post-${postId}-views`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`
        },
        (payload) => {
          const newCount = payload.new.view_count
          if (newCount !== undefined && newCount !== currentCount) {
            setCurrentCount(newCount)
            setIsUpdating(true)
            setTimeout(() => setIsUpdating(false), 1000)
            
            // Refresh breakdown if showing
            if (showBreakdown) {
              fetchBreakdown()
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, currentCount, showBreakdown])

  const fetchBreakdown = async () => {
    setIsLoadingBreakdown(true)
    setBreakdownError(null)
    
    try {
      const response = await fetch(`/api/view-breakdown?postId=${postId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error ${response.status}`)
      }
      
      const data = await response.json()
      setBreakdown(data)
    } catch (error) {
      console.error('Failed to fetch breakdown:', error)
      setBreakdownError(error instanceof Error ? error.message : 'Failed to load breakdown')
    } finally {
      setIsLoadingBreakdown(false)
    }
  }

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        {showIcon && (
          <Eye size={16} className="text-gray-600 dark:text-gray-400" />
        )}
        
        <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${
          isUpdating ? 'scale-105 transition-transform duration-300' : ''
        }`}>
          {formatNumber(currentCount)} view{currentCount !== 1 ? 's' : ''}
          {isUpdating && (
            <span className="ml-2 text-xs text-green-600 animate-pulse">↑</span>
          )}
        </span>
      </div>
      
      {/* Simple breakdown without detailed stats */}
      {showBreakdown && !showDetailedStats && breakdown && (
        <div className="mt-2">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{formatNumber(breakdown.authenticated_views)} logged-in</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>{formatNumber(breakdown.anonymous_views)} anonymous</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Full detailed breakdown */}
      {showBreakdown && showDetailedStats && breakdown && (
        <div className="mt-2">
          {isLoadingBreakdown ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
              <span>Loading breakdown...</span>
            </div>
          ) : breakdownError ? (
            <div className="text-xs text-red-500 dark:text-red-400">
              {breakdownError}
            </div>
          ) : breakdown ? (
            <div className="flex flex-col gap-1">
              {/* Main breakdown */}
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  <span>{formatNumber(breakdown.authenticated_views)} logged-in</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{formatNumber(breakdown.anonymous_views)} anonymous</span>
                </div>
              </div>
              
              {/* Detailed stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-1 pt-1 border-t border-gray-100 dark:border-gray-700">
                <span title="Unique authenticated users">
                  👤 {formatNumber(breakdown.unique_authenticated_users)} users
                </span>
                <span title="Unique email addresses">
                  📧 {formatNumber(breakdown.unique_emails)} emails
                </span>
                <span title="Unique sessions">
                  🔄 {formatNumber(breakdown.unique_sessions)} sessions
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}