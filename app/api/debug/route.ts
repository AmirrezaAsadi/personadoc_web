import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Basic debug information
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      session: {
        user: session.user.email,
        authenticated: !!session.user
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        database: !!process.env.DATABASE_URL,
        openai: !!process.env.OPENAI_API_KEY,
        pinecone: !!process.env.PINECONE_API_KEY
      }
    }

    // Test database connection
    try {
      const personaCount = await prisma.persona.count()
      debugInfo.database = {
        connected: true,
        personaCount
      }
    } catch (error) {
      debugInfo.database = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug route error:', error)
    return NextResponse.json({ 
      error: 'Debug route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    return NextResponse.json({
      message: 'Debug POST endpoint',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug POST error:', error)
    return NextResponse.json({ 
      error: 'Debug POST failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
