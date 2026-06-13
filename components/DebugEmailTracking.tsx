// components/DebugEmailTracking.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugEmailTracking({ postId }: { postId: string }) {
  const [views, setViews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
    fetchViews()
  }, [postId])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    console.log('Current logged-in user:', user)
  }

  const fetchViews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('post_views')
      .select('*')
      .eq('post_id', parseInt(postId))
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('Error fetching views:', error)
    } else {
      setViews(data || [])
      console.log('Recent views:', data)
    }
    setLoading(false)
  }

  const testTrackView = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const testData = {
      post_id: parseInt(postId),
      user_id: user?.id || null,
      user_email: user?.email || null,
      ip_address: '127.0.0.1',
      user_agent: navigator.userAgent,
      session_id: 'test-' + Date.now(),
      view_type: 'test_view'
    }
    
    console.log('Test insert with data:', testData)
    
    const { error, data } = await supabase
      .from('post_views')
      .insert([testData])
      .select()
    
    if (error) {
      console.error('Test insert error:', error)
      alert('Error: ' + error.message)
    } else {
      console.log('Test insert success:', data)
      alert('Success! Check console for details.')
      fetchViews()
    }
  }

  return (
    <div className="mt-4 p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">🔍 Email Tracking Debug</h3>
      
      <div className="mb-2 text-sm">
        <strong>Current User:</strong> {currentUser ? (
          <span className="text-green-600">
            {currentUser.email} (ID: {currentUser.id})
          </span>
        ) : (
          <span className="text-red-600">Not logged in</span>
        )}
      </div>

      <button
        onClick={testTrackView}
        className="px-3 py-1 bg-red-600 text-white rounded text-sm mb-3"
      >
        Test Track View
      </button>

      <div className="text-sm font-medium mb-1">Recent Views ({views.length}):</div>
      <div className="max-h-40 overflow-y-auto text-xs space-y-1">
        {views.map(view => (
          <div key={view.id} className="border-b border-red-200 pb-1">
            <div><strong>Email:</strong> {view.user_email || '❌ NULL'}</div>
            <div><strong>User ID:</strong> {view.user_id || 'NULL'}</div>
            <div><strong>IP:</strong> {view.ip_address}</div>
            <div><strong>Time:</strong> {new Date(view.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}