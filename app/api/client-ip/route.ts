// app/api/client-ip/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Get IP from various headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
    
    let ip = 'unknown'
    
    if (cfConnectingIp) {
      ip = cfConnectingIp
    } else if (forwardedFor) {
      // x-forwarded-for can be a comma-separated list, take the first one
      ip = forwardedFor.split(',')[0].trim()
    } else if (realIp) {
      ip = realIp
    }
    
    // In development, return a placeholder
    if (process.env.NODE_ENV === 'development') {
      ip = '127.0.0.1'
    }
    
    return NextResponse.json({ ip })
  } catch (error) {
    console.error('Error getting client IP:', error)
    return NextResponse.json({ ip: 'unknown' })
  }
}