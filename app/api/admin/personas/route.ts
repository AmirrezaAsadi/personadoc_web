import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return false
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  })
  
  return user?.role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const personas = await prisma.persona.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        isPublic: true,
        shareCount: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            interactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const personasWithCounts = personas.map(persona => ({
      id: persona.id,
      name: persona.name,
      createdAt: persona.createdAt.toISOString(),
      creator: persona.creator,
      isPublic: persona.isPublic,
      shareCount: persona.shareCount,
      interactionCount: persona._count.interactions
    }))

    return NextResponse.json({ personas: personasWithCounts })
  } catch (error) {
    console.error('Failed to fetch personas:', error)
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
  }
}
