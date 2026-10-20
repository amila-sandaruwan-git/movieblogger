// app/api/notify-subscribers/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { postTitle, postExcerpt, postId } = await request.json()

    if (!postTitle || !postId) {
      return NextResponse.json({ error: 'Missing post data' }, { status: 400 })
    }

    // Use the service role key to bypass RLS and fetch all subscribers safely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all active subscribers
    const { data: subscribers, error } = await supabase
      .from('subscribers')
      .select('email')
      .eq('is_active', true)

    if (error) throw error
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers to notify' })
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const postUrl = `${siteUrl}/post/${postId}`

    // Send emails
    const emailPromises = subscribers.map((sub) =>
      resend.emails.send({
        from: 'MovieBlogger <onboarding@resend.dev>', // Change this to your verified domain in Resend later
        to: sub.email,
        subject: `New Movie Review: ${postTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #6b21a8;">New Review Alert! 🎬</h2>
            <p style="font-size: 16px; color: #333;">
              A new review has just been published on MovieBlogger:
            </p>
            <h3 style="color: #1f2937; margin-top: 20px;">${postTitle}</h3>
            <p style="color: #4b5563; font-style: italic;">
              "${postExcerpt || 'Click below to read the full review.'}"
            </p>
            <a href="${postUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">
              Read Full Review
            </a>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              You are receiving this because you subscribed to MovieBlogger.
            </p>
          </div>
        `,
      })
    )

    await Promise.all(emailPromises)

    return NextResponse.json({ success: true, count: subscribers.length })
  } catch (error: any) {
    console.error('Email notification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}