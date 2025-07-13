import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user can access this persona
    const persona = await prisma.persona.findUnique({
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

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Check access permissions
    const personaWithSharing = persona as any
    const isOwner = persona.createdBy === userId
    const isPublic = personaWithSharing.isPublic === true
    const hasShareToken = personaWithSharing.shareToken !== null

    if (!isOwner && !isPublic && !hasShareToken) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Add access information to the response
    const responseData = {
      ...persona,
      isOwner,
      accessType: isOwner ? 'owner' : isPublic ? 'public' : 'shared'
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    // Get update data from request
    const updateData = await request.json()

    // Debug logging
    console.log('=== PERSONA UPDATE DEBUG ===')
    console.log('Persona ID:', id)
    console.log('Update data keys:', Object.keys(updateData))
    console.log('Metadata exists:', !!updateData.metadata)
    if (updateData.metadata) {
      console.log('Metadata keys:', Object.keys(updateData.metadata))
      console.log('Political compass in metadata:', !!updateData.metadata.politicalCompass)
      console.log('Political compass data:', updateData.metadata.politicalCompass)
    }
    console.log('=== END DEBUG ===')

    // Verify persona ownership
    const existingPersona = await prisma.persona.findFirst({
      where: { 
        id: id,
        createdBy: userId 
      },
    })

    if (!existingPersona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Update the persona
    const updatedPersona = await prisma.persona.update({
      where: { id },
      data: {
        name: updateData.name,
        age: updateData.age,
        occupation: updateData.occupation,
        location: updateData.location,
        introduction: updateData.introduction,
        personalityTraits: updateData.personalityTraits,
        interests: updateData.interests,
        inclusivityAttributes: updateData.inclusivityAttributes,
        appliedSuggestions: updateData.appliedSuggestions,
        metadata: updateData.metadata
      }
    })

    return NextResponse.json(updatedPersona)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
