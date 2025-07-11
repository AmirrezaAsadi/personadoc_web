import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const personaId = params.id

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID
    let userId = (session.user as any).id
    if (!userId && session.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }

    const personaId = params.id
    const body = await request.json()

    const {
      version,
      name,
      changes,
      branchFrom,
      branchName,
      notes,
      personaUpdates
    } = body

    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}
    const versions = metadata.versions || []

    // Create snapshot of current persona state with any updates
    const updatedPersonaData = {
      name: personaUpdates?.name || persona.name,
      age: personaUpdates?.age || persona.age,
      occupation: personaUpdates?.occupation || persona.occupation,
      location: personaUpdates?.location || persona.location,
      introduction: personaUpdates?.introduction || persona.introduction,
      personalityTraits: personaUpdates?.personalityTraits || persona.personalityTraits,
      interests: personaUpdates?.interests || persona.interests,
      gadgets: personaUpdates?.gadgets || persona.gadgets
    }

    const newVersion = {
      id: `v${version}`,
      version,
      name: name || `${updatedPersonaData.name} - Version ${version}`,
      snapshot: updatedPersonaData,
      changes,
      branchFrom,
      branchName,
      isActive: false,
      isDraft: true,
      notes,
      createdAt: new Date().toISOString(),
      createdBy: userId
    }

    versions.push(newVersion)

    // Update persona metadata
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        metadata: {
          ...metadata,
          versions
        }
      }
    })

    return NextResponse.json({
      success: true,
      version: newVersion
    })

  } catch (error) {
    console.error('Version creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const personaId = params.id
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
