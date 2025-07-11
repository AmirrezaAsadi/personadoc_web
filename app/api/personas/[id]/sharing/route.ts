import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personaId } = await params
    const body = await request.json()
    const { action, isPublic, allowComments } = body

    // Verify persona ownership
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: { creator: { select: { email: true } } }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    if (persona.creator.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized - not persona owner' }, { status: 403 })
    }

    switch (action) {
      case 'generateShareLink': {
        // Generate a unique share token
        const shareToken = nanoid(16) // 16 character unique ID
        
        const updatedPersona = await prisma.persona.update({
          where: { id: personaId },
          data: {
            shareToken,
            sharedAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          shareToken: updatedPersona.shareToken,
          shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/persona/${shareToken}`
        })
      }

      case 'revokeShareLink': {
        await prisma.persona.update({
          where: { id: personaId },
          data: {
            shareToken: null,
            sharedAt: null,
            shareCount: 0
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Share link revoked'
        })
      }

      case 'updateSharing': {
        const updateData: any = {}
        
        if (typeof isPublic === 'boolean') {
          updateData.isPublic = isPublic
          if (isPublic && !persona.sharedAt) {
            updateData.sharedAt = new Date()
          }
        }
        
        if (typeof allowComments === 'boolean') {
          updateData.allowComments = allowComments
        }

        const updatedPersona = await prisma.persona.update({
          where: { id: personaId },
          data: updateData
        })

        return NextResponse.json({
          success: true,
          isPublic: updatedPersona.isPublic,
          allowComments: updatedPersona.allowComments
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Persona sharing error:', error)
    return NextResponse.json(
      { error: 'Failed to update sharing settings' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: personaId } = await params

    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      select: {
        isPublic: true,
        shareToken: true,
        shareCount: true,
        allowComments: true,
        sharedAt: true
      }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    return NextResponse.json(persona)

  } catch (error) {
    console.error('Error fetching sharing settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sharing settings' },
      { status: 500 }
    )
  }
}
