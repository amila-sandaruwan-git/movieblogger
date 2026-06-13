// app/api/debug-auth/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          aud: session.user.aud
        },
        expiresAt: session.expires_at
      } : null,
      user: user ? {
        id: user.id,
        email: user.email,
        aud: user.aud
      } : null,
      errors: {
        session: sessionError?.message,
        user: userError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}