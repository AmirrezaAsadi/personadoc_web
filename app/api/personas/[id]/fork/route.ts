import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Get the original persona
    const originalPersona = await prisma.persona.findUnique({
      where: { id: id },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!originalPersona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Check if user can access this persona (must be public or shared)
    const isOwner = originalPersona.createdBy === userId
    const isPublic = (originalPersona as any).isPublic === true
    const hasShareToken = (originalPersona as any).shareToken !== null

    if (!isOwner && !isPublic && !hasShareToken) {
      return NextResponse.json({ error: 'Cannot clone private persona' }, { status: 403 })
    }

    // Don't allow users to fork their own personas
    if (isOwner) {
      return NextResponse.json({ error: 'Cannot clone your own persona' }, { status: 400 })
    }

    // Create a forked copy
    const forkedPersona = await prisma.persona.create({
      data: {
        name: `${originalPersona.name} (Clone)`,
        age: originalPersona.age,
        occupation: originalPersona.occupation,
        location: originalPersona.location,
        introduction: originalPersona.introduction,
        personalityTraits: originalPersona.personalityTraits as any,
        interests: originalPersona.interests as any,
        inclusivityAttributes: originalPersona.inclusivityAttributes as any,
        appliedSuggestions: originalPersona.appliedSuggestions as any,
        metadata: originalPersona.metadata as any,
        isPublic: false, // Forked personas are private by default
        shareToken: null,
        shareCount: 0,
        allowComments: false,
        createdBy: userId,
        parentId: originalPersona.id, // Track the original persona
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    // Add fork information to response
    const responseData = {
      ...forkedPersona,
      isOwner: true,
      accessType: 'owner',
      originalCreator: originalPersona.creator
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Fork error:', error)
    return NextResponse.json({ error: 'Failed to clone persona' }, { status: 500 })
  }
}
