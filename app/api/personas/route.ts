import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { researchRAG } from '@/lib/research-rag'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json([])
    }

    // For credentials provider, use the session user ID directly
    let userId = (session.user as any).id

    // For OAuth providers, find user by email
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json([])
    }

    const personas = await prisma.persona.findMany({
      where: { createdBy: userId },
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
    
    // Validate minimum age
    if (body.age && body.age < 18) {
      return NextResponse.json({ 
        error: 'Age must be 18 or older. We do not allow simulation of minors.' 
      }, { status: 400 })
    }
    
    // For credentials provider, use the session user ID directly
    let userId = (session.user as any).id

    // For OAuth providers, find or create user by email
    if (!userId) {
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: { name: session.user.name },
        create: {
          email: session.user.email,
          name: session.user.name,
        },
      })
      userId = user.id
    }
    
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
        // Store extended persona data in metadata field as JSON
        metadata: body.metadata || {},
        createdBy: userId,
      } as any, // Cast to bypass TypeScript strict checking
    })

    // Process research data if present
    if (body.metadata?.research) {
      try {
        await researchRAG.processPersonaResearch(persona.id, body.metadata.research)
        console.log(`Research data processed for persona ${persona.id}`)
      } catch (error) {
        console.error('Error processing research data:', error)
        // Don't fail persona creation if research processing fails
      }
    }

    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ 
      error: 'Failed to create persona', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
