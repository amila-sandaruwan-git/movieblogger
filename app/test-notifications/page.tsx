// app/test-notifications/page.tsx - FIXED welcomeMessage call
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notificationHelpers } from '@/lib/notifications'

export default function TestNotifications() {
  const [status, setStatus] = useState('')
  const supabase = createClient()

  const testTableExists = async () => {
    setStatus('Checking table...')
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1)
      
      if (error) {
        setStatus(`Table error: ${error.message}`)
      } else {
        setStatus(`Table exists! Data: ${JSON.stringify(data)}`)
      }
    } catch (error: any) {
      setStatus(`Exception: ${error.message}`)
    }
  }

  const testInsert = async () => {
    setStatus('Testing insert...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStatus('No user logged in')
        return
      }

      // Call with 1 argument: userId only
      const result = await notificationHelpers.welcomeMessage(user.id)
      setStatus(`Insert result: ${JSON.stringify(result)}`)
    } catch (error: any) {
      setStatus(`Insert error: ${error.message}`)
    }
  }

  const checkLocalStorage = () => {
    const pending = localStorage.getItem('pending_notifications')
    setStatus(`LocalStorage: ${pending || 'empty'}`)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Notifications</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testTableExists}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Check Table Exists
        </button>
        
        <button
          onClick={testInsert}
          className="px-4 py-2 bg-green-500 text-white rounded ml-2"
        >
          Test Insert
        </button>
        
        <button
          onClick={checkLocalStorage}
          className="px-4 py-2 bg-yellow-500 text-white rounded ml-2"
        >
          Check LocalStorage
        </button>
      </div>
      
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Status:</h2>
        <pre className="whitespace-pre-wrap">{status}</pre>
      </div>
    </div>
  )
}