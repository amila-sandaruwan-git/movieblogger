import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cf = request.headers.get('cf-connecting-ip')
  const ff = request.headers.get('x-forwarded-for')
  const ri = request.headers.get('x-real-ip')
  let ip = 'unknown'
  if (cf) ip = cf
  else if (ff) ip = ff.split(',')[0].trim()
  else if (ri) ip = ri
  return NextResponse.json({ ip })
}