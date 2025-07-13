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

    // Get the persona with detailed metadata analysis
    const persona = await prisma.persona.findUnique({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Check if user can access this persona (owner or public)
    const isOwner = persona.createdBy === userId
    const isPublic = (persona as any).isPublic === true

    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Debug information
    const metadata = persona.metadata as any || {}
    
    const debugInfo = {
      personaId: persona.id,
      personaName: persona.name,
      hasMetadata: !!persona.metadata,
      metadataKeys: Object.keys(metadata),
      politicalCompassExists: !!metadata.politicalCompass,
      politicalCompassData: metadata.politicalCompass || null,
      personalityExists: !!metadata.personality,
      personalityKeys: metadata.personality ? Object.keys(metadata.personality) : [],
      fullMetadataStructure: metadata,
      metadataSize: JSON.stringify(metadata).length
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
