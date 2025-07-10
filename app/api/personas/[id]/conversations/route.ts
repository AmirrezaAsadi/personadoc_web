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

    // Get conversation history for this persona
    const interactions = await prisma.interaction.findMany({
      where: { personaId: id },
      orderBy: { createdAt: 'asc' },
      take: 50
    })

    // Transform interactions to message format
    const messages = interactions.flatMap((interaction) => [
      {
        type: 'user',
        content: interaction.content,
        timestamp: interaction.createdAt.toLocaleTimeString()
      },
      {
        type: 'persona',
        content: interaction.response,
        timestamp: interaction.createdAt.toLocaleTimeString()
      }
    ])

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error loading conversations:', error)
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 })
  }
}
