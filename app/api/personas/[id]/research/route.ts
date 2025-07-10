import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { researchRAG } from '@/lib/research-rag'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Get user ID
    let userId = (session.user as any).id
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    // Get persona with metadata
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Extract research data from metadata
    const personaWithMetadata = persona as any
    const metadata = typeof personaWithMetadata.metadata === 'string' 
      ? JSON.parse(personaWithMetadata.metadata) 
      : personaWithMetadata.metadata || {}

    const researchData = metadata.research || {}

    // Process research data with RAG
    const chunksProcessed = await researchRAG.processPersonaResearch(id, researchData)

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${chunksProcessed} research chunks`,
      chunksProcessed 
    })

  } catch (error) {
    console.error('Error processing research data:', error)
    return NextResponse.json({ error: 'Failed to process research data' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Delete research data from Pinecone
    await researchRAG.deletePersonaResearch(id)

    return NextResponse.json({ 
      success: true, 
      message: 'Research data deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting research data:', error)
    return NextResponse.json({ error: 'Failed to delete research data' }, { status: 500 })
  }
}
