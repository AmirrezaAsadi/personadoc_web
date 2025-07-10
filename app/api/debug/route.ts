import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session,
      env: process.env.NODE_ENV,
      nextauth_url: process.env.NEXTAUTH_URL,
      has_google_id: !!process.env.GOOGLE_CLIENT_ID,
      has_google_secret: !!process.env.GOOGLE_CLIENT_SECRET,
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
