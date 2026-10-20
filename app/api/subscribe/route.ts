import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email' }, { status: 400 })
    }
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing?.is_active) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 })
    }

    if (existing) {
      await supabase.from('subscribers').update({ is_active: true, unsubscribed_at: null }).eq('email', email)
      return NextResponse.json({ success: true, message: 'Subscription reactivated!' })
    }

    const { error } = await supabase.from('subscribers').insert({
      email: email.toLowerCase().trim(),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    })

    if (error) return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Successfully subscribed!' })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}