import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personaId } = await params

    // Get persona with versions from metadata
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}
    const versions = metadata.versions || []

    // If no versions exist, create an initial version
    if (versions.length === 0) {
      const initialVersion = {
        id: 'v1.0',
        version: '1.0',
        name: `${persona.name} - Initial Version`,
        snapshot: {
          name: persona.name,
          age: persona.age,
          occupation: persona.occupation,
          location: persona.location,
          introduction: persona.introduction,
          personalityTraits: persona.personalityTraits,
          interests: persona.interests,
          gadgets: persona.gadgets,
          metadata: persona.metadata
        },
        isActive: true,
        isDraft: false,
        notes: 'Initial version',
        createdAt: persona.createdAt.toISOString(),
        createdBy: persona.createdBy
      }

      versions.push(initialVersion)

      await prisma.persona.update({
        where: { id: personaId },
        data: {
          metadata: {
            ...metadata,
            versions,
            currentVersion: '1.0'
          }
        }
      })
    }

    return NextResponse.json({
      versions: versions.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      currentVersion: metadata.currentVersion || '1.0'
    })

  } catch (error) {
    console.error('Versions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { personaData, versionNotes } = body

    // Check if user owns the persona
    const existingPersona = await prisma.persona.findFirst({
      where: { 
        id: id,
        createdBy: userId 
      },
    })

    if (!existingPersona) {
      return NextResponse.json({ error: 'Persona not found or access denied' }, { status: 404 })
    }

    // Get existing versions from metadata
    const metadata = existingPersona.metadata as any || {}
    const versions = metadata.versions || []

    // Generate new version number
    const lastVersion = versions.length > 0 
      ? Math.max(...versions.map((v: any) => parseFloat(v.version))) 
      : 0
    const nextVersionNumber = (lastVersion + 0.1).toFixed(1)

    // Create new version
    const newVersion = {
      id: `v${nextVersionNumber}`,
      version: nextVersionNumber,
      name: `${personaData.name} - Version ${nextVersionNumber}`,
      snapshot: {
        name: personaData.name,
        age: personaData.age,
        occupation: personaData.occupation,
        location: personaData.location,
        introduction: personaData.introduction,
        personalityTraits: personaData.personalityTraits || [],
        interests: personaData.interests || []
      },
      isActive: false, // New versions start as inactive
      isDraft: true,  // Mark as draft initially
      notes: versionNotes || `Version ${nextVersionNumber} - Updated via edit modal`,
      createdAt: new Date().toISOString()
    }

    // Add new version to the versions array
    const updatedVersions = [...versions, newVersion]

    // Update the persona with new data and version
    const updatedPersona = await prisma.persona.update({
      where: { id: id },
      data: {
        name: personaData.name,
        age: personaData.age,
        occupation: personaData.occupation,
        location: personaData.location,
        introduction: personaData.introduction,
        personalityTraits: personaData.personalityTraits || [],
        interests: personaData.interests || [],
        currentVersion: nextVersionNumber,
        updatedAt: new Date(),
        metadata: {
          ...metadata,
          versions: updatedVersions
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      persona: updatedPersona,
      version: newVersion,
      message: `Version ${nextVersionNumber} created successfully`
    })
  } catch (error) {
    console.error('Error creating persona version:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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
    const { versionId, action } = body

    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}
    const versions = metadata.versions || []

    const versionIndex = versions.findIndex((v: any) => v.id === versionId)
    if (versionIndex === -1) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    if (action === 'publish') {
      // Mark all versions as inactive
      versions.forEach((v: any) => {
        v.isActive = false
        v.isDraft = false
      })

      // Activate the selected version
      versions[versionIndex].isActive = true
      versions[versionIndex].isDraft = false

      // Update persona with the version's snapshot
      const versionSnapshot = versions[versionIndex].snapshot

      await prisma.persona.update({
        where: { id: personaId },
        data: {
          name: versionSnapshot.name,
          age: versionSnapshot.age,
          occupation: versionSnapshot.occupation,
          location: versionSnapshot.location,
          introduction: versionSnapshot.introduction,
          personalityTraits: versionSnapshot.personalityTraits,
          interests: versionSnapshot.interests,
          gadgets: versionSnapshot.gadgets,
          metadata: {
            ...metadata,
            versions,
            currentVersion: versions[versionIndex].version
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Version published successfully',
        activeVersion: versions[versionIndex]
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Version update error:', error)
    return NextResponse.json(
      { error: 'Failed to update version' },
      { status: 500 }
    )
  }
}
