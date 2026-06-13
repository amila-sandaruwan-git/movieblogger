// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user to check if this is their first time
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (!existingProfile) {
          // Create profile for new Google user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              auth_provider: 'google',
              email_confirmed: true,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (profileError) {
            console.error('Error creating profile for Google user:', profileError)
          } else {
            // Send welcome notification
            try {
              const { notificationHelpers } = await import('@/lib/notifications')
              await notificationHelpers.welcomeMessage(user.id)
            } catch (notifError) {
              console.error('Error sending welcome notification:', notifError)
            }
          }
        }
      }
    }
  }
  
  // Redirect to home page after successful authentication
  return NextResponse.redirect(new URL('/', request.url))
}