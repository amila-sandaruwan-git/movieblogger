// app/api/subscribe/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()
    
    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check if email already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 400 }
        )
      } else {
        // Reactivate subscription
        const { error: updateError } = await supabase
          .from('subscribers')
          .update({ 
            is_active: true,
            unsubscribed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', email)

        if (updateError) {
          console.error('Error reactivating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Your subscription has been reactivated!',
          isReactivated: true
        })
      }
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        ip_address: ip,
        user_agent: userAgent
      })

    if (insertError) {
      console.error('Error inserting subscriber:', insertError)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed!',
      isReactivated: false
    })

  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}