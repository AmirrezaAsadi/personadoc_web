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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'user', 'public', 'shared', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get user ID
    let userId = (session.user as any).id
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let whereConditions: any = {}
    
    // Build search conditions based on type
    if (type === 'user') {
      whereConditions = {
        createdBy: userId,
      }
    } else if (type === 'public') {
      // For now, return empty array since sharing not yet fully implemented
      whereConditions = {
        createdBy: 'never_match',
      }
    } else if (type === 'shared') {
      // For now, return empty array since sharing not yet fully implemented
      whereConditions = {
        createdBy: 'never_match',
      }
    } else {
      // 'all' - for now just user's personas
      whereConditions = {
        createdBy: userId,
      }
    }

    // Add search query conditions
    if (query.trim()) {
      const searchConditions = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { occupation: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { introduction: { contains: query, mode: 'insensitive' } },
          { personalityTraits: { hasSome: [query] } },
          { interests: { hasSome: [query] } },
        ]
      }

      if (whereConditions.OR) {
        // Combine with existing OR conditions
        whereConditions = {
          AND: [
            whereConditions,
            searchConditions
          ]
        }
      } else {
        // Add to existing conditions
        whereConditions = {
          AND: [
            whereConditions,
            searchConditions
          ]
        }
      }
    }

    const personas = await prisma.persona.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        age: true,
        occupation: true,
        location: true,
        introduction: true,
        personalityTraits: true,
        interests: true,
        profileImage: true,
        createdAt: true,
        metadata: true,
        createdBy: true,
        // Include creator info for public/shared personas
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Add ownership and access info to each persona
    const enrichedPersonas = personas.map(persona => ({
      ...persona,
      isOwner: persona.createdBy === userId,
      accessType: persona.createdBy === userId 
        ? 'owner' 
        : 'public' // For now, simplified logic
    }))

    return NextResponse.json(enrichedPersonas)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
