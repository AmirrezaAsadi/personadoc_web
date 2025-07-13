import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// In-memory storage for demo purposes
// In production, you'd want to use a database
const experimentsStore = new Map()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id || session.user.email
    
    // Get user's experiments from storage
    const userExperiments = experimentsStore.get(userId) || []
    
    return NextResponse.json(userExperiments)

  } catch (error) {
    console.error('Error loading experiments:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id || session.user.email
    const experiment = await request.json()
    
    // Get existing experiments
    const userExperiments = experimentsStore.get(userId) || []
    
    // Add new experiment
    userExperiments.push({
      ...experiment,
      id: experiment.id || `exp-${Date.now()}`,
      createdAt: new Date().toISOString()
    })
    
    // Save back to storage
    experimentsStore.set(userId, userExperiments)
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving experiment:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
