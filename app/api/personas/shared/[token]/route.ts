import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Share token required' }, { status: 400 })
    }

    // Find persona by ID (temporary implementation until sharing fields are available)
    // In a real implementation, this would use shareToken
    const persona = await prisma.persona.findUnique({
      where: { 
        id: token, // Using ID as token for now
      },
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
        // Share-related fields (when available)
        // shareCount: true,
        // allowComments: true,
        // Include creator info
        creator: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found or link expired' }, { status: 404 })
    }

    // Increment share count (when field is available)
    // await prisma.persona.update({
    //   where: { id: persona.id },
    //   data: { shareCount: { increment: 1 } }
    // })

    // For now, add mock values for missing fields
    const enrichedPersona = {
      ...persona,
      shareCount: 0,
      allowComments: false,
    }

    return NextResponse.json(enrichedPersona)
  } catch (error) {
    console.error('Shared persona access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
