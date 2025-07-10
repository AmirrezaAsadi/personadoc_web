import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json([])
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json([])
    }

    const personas = await prisma.persona.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(personas)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Find or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { name: session.user.name },
      create: {
        email: session.user.email,
        name: session.user.name,
      },
    })
    
    const persona = await prisma.persona.create({
      data: {
        name: body.name,
        age: body.age,
        occupation: body.occupation,
        location: body.location,
        introduction: body.introduction,
        personalityTraits: body.personalityTraits || [],
        interests: body.interests || [],
        gadgets: body.gadgets || [],
        createdBy: user.id,
      },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ 
      error: 'Failed to create persona', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
