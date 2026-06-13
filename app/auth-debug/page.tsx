// app/auth-debug/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AuthDebugPage() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClient()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const testDirectGoogleLogin = async () => {
    setLoading(true)
    addLog('Starting Google login test...')
    
    try {
      addLog('Calling supabase.auth.signInWithOAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        addLog(`ERROR: ${error.message}`)
        throw error
      }
      
      addLog(`Success! Redirecting to: ${data.url}`)
      
    } catch (err: any) {
      addLog(`CATCH ERROR: ${err.message}`)
      setLoading(false)
    }
  }

  const testGetSession = async () => {
    addLog('Checking current session...')
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      addLog(`Session error: ${error.message}`)
    } else if (session) {
      addLog(`Session found for: ${session.user.email}`)
    } else {
      addLog('No active session')
    }
  }

  const testGetUser = async () => {
    addLog('Getting current user...')
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      addLog(`User error: ${error.message}`)
    } else if (user) {
      addLog(`User found: ${user.email}`)
    } else {
      addLog('No user logged in')
    }
  }

  const testSignOut = async () => {
    addLog('Signing out...')
    await supabase.auth.signOut()
    addLog('Signed out')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OAuth Debug Tool</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testDirectGoogleLogin}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Redirecting...' : 'Test Google Login'}
        </button>
        
        <button
          onClick={testGetSession}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2"
        >
          Check Session
        </button>
        
        <button
          onClick={testGetUser}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
        >
          Get User
        </button>
        
        <button
          onClick={testSignOut}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2"
        >
          Sign Out
        </button>
      </div>
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        <div className="font-bold mb-2">Debug Logs:</div>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h2 className="font-bold mb-2">Checklist:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Is Google Provider enabled in Supabase?</li>
          <li>Are Client ID and Client Secret correct?</li>
          <li>Is http://localhost:3000/auth/callback in Google's authorized redirect URIs?</li>
          <li>Is your Supabase URL correct in .env.local?</li>
          <li>Check browser console for errors (F12)</li>
        </ul>
      </div>
    </div>
  )
}