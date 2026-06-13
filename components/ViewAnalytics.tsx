// components/ViewAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, Users, Globe, Clock, TrendingUp, Monitor, Smartphone, Tablet } from 'lucide-react'
import { formatNumber } from '@/utils/helpers'

interface ViewAnalyticsProps {
  postId: string
}

interface AnalyticsData {
  total: number
  unique: number
  today: number
  loggedIn: number
  anonymous: number
  byCountry: Array<{ country: string; count: number }>
  byDevice: Array<{ device: string; count: number }>
  byBrowser: Array<{ browser: string; count: number }>
}

export function ViewAnalytics({ postId }: ViewAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    total: 0,
    unique: 0,
    today: 0,
    loggedIn: 0,
    anonymous: 0,
    byCountry: [],
    byDevice: [],
    byBrowser: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createClient()
      
      // Fetch all analytics data
      const [
        totalRes,
        uniqueRes,
        todayRes,
        loggedInRes,
        anonymousRes,
        countryRes,
        deviceRes,
        browserRes
      ] = await Promise.all([
        supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', postId),
        supabase.from('post_views').select('session_id').eq('post_id', postId),
        supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', postId).gt('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', postId).not('user_id', 'is', null),
        supabase.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', postId).is('user_id', null),
        supabase.from('post_views').select('country').eq('post_id', postId).not('country', 'is', null),
        supabase.from('post_views').select('device_type').eq('post_id', postId).not('device_type', 'is', null),
        supabase.from('post_views').select('browser').eq('post_id', postId).not('browser', 'is', null)
      ])

      // Process data
      const countries = new Map<string, number>()
      countryRes.data?.forEach(item => {
        if (item.country) {
          countries.set(item.country, (countries.get(item.country) || 0) + 1)
        }
      })

      const devices = new Map<string, number>()
      deviceRes.data?.forEach(item => {
        if (item.device_type) {
          devices.set(item.device_type, (devices.get(item.device_type) || 0) + 1)
        }
      })

      const browsers = new Map<string, number>()
      browserRes.data?.forEach(item => {
        if (item.browser) {
          browsers.set(item.browser, (browsers.get(item.browser) || 0) + 1)
        }
      })

      setAnalytics({
        total: totalRes.count || 0,
        unique: new Set(uniqueRes.data?.map(v => v.session_id)).size,
        today: todayRes.count || 0,
        loggedIn: loggedInRes.count || 0,
        anonymous: anonymousRes.count || 0,
        byCountry: Array.from(countries.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
        byDevice: Array.from(devices.entries()).map(([device, count]) => ({ device, count })),
        byBrowser: Array.from(browsers.entries()).map(([browser, count]) => ({ browser, count })).sort((a, b) => b.count - a.count)
      })
      setIsLoading(false)
    }

    fetchAnalytics()

    // Subscribe to real-time updates
    const supabase = createClient()
    const channel = supabase
      .channel(`analytics-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_views',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchAnalytics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'desktop': return <Monitor size={16} />
      case 'mobile': return <Smartphone size={16} />
      case 'tablet': return <Tablet size={16} />
      default: return <Monitor size={16} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(analytics.total)}
          </p>
        </div>
        
        <div className="bg-linear-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(analytics.unique)}
          </p>
        </div>
        
        <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(analytics.today)}
          </p>
        </div>
        
        <div className="bg-linear-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Logged In</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(analytics.loggedIn)}
          </p>
        </div>
        
        <div className="bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Anonymous</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(analytics.anonymous)}
          </p>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Countries */}
        {analytics.byCountry.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Views by Country</span>
            </div>
            <div className="space-y-2">
              {analytics.byCountry.slice(0, 5).map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{country}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Devices */}
        {analytics.byDevice.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Device Types</span>
            </div>
            <div className="space-y-2">
              {analytics.byDevice.map(({ device, count }) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device)}
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{device}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Browsers */}
        {analytics.byBrowser.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Browser Usage</span>
            </div>
            <div className="space-y-2">
              {analytics.byBrowser.slice(0, 5).map(({ browser, count }) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{browser}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}