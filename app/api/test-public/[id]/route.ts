import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Test endpoint - check if persona is publicly accessible
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

    // Check if it's public
    const personaWithSharing = persona as any
    const isPublic = personaWithSharing.isPublic === true

    if (!isPublic) {
      return NextResponse.json({ 
        error: 'Persona is not public',
        isPublic: false 
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      isPublic: true,
      persona: {
        id: persona.id,
        name: persona.name,
        occupation: persona.occupation,
        location: persona.location,
        introduction: persona.introduction,
        creator: persona.creator
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
