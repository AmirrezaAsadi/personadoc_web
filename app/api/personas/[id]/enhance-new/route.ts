import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { suggestion } = await request.json()
    
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
    
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Parse existing data
    let metadata: any = {}
    let inclusivityAttributes: any = {}
    let appliedSuggestions: any[] = []
    
    try {
      metadata = typeof (persona as any).metadata === 'string' 
        ? JSON.parse((persona as any).metadata) 
        : (persona as any).metadata || {}
    } catch (error) {
      metadata = {}
    }

    try {
      inclusivityAttributes = typeof (persona as any).inclusivityAttributes === 'string'
        ? JSON.parse((persona as any).inclusivityAttributes)
        : (persona as any).inclusivityAttributes || {}
    } catch (error) {
      inclusivityAttributes = {}
    }

    try {
      appliedSuggestions = typeof (persona as any).appliedSuggestions === 'string'
        ? JSON.parse((persona as any).appliedSuggestions)
        : (persona as any).appliedSuggestions || []
    } catch (error) {
      appliedSuggestions = []
    }

    // Create enhanced persona data for new version
    const enhancedInclusivityAttributes = {
      ...inclusivityAttributes,
      [suggestion.icon_type]: [...(inclusivityAttributes[suggestion.icon_type] || []), suggestion.label]
    }

    const newAppliedSuggestion = {
      label: suggestion.label,
      icon_type: suggestion.icon_type,
      description: suggestion.description,
      appliedAt: new Date().toISOString(),
      version: 'next'
    }

    const enhancedAppliedSuggestions = [...appliedSuggestions, newAppliedSuggestion]

    // Get current versions from metadata
    const currentVersions = metadata.versions || []
    const nextVersionNumber = currentVersions.length + 1
    const newVersionId = `v${nextVersionNumber}.0`

    // Create new version object
    const newVersion = {
      id: newVersionId,
      version: `${nextVersionNumber}.0`,
      name: `${persona.name} - ${suggestion.label} Perspective`,
      snapshot: {
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        location: persona.location,
        introduction: persona.introduction,
        personalityTraits: persona.personalityTraits as any,
        interests: persona.interests as any,
        inclusivityAttributes: enhancedInclusivityAttributes,
        appliedSuggestions: enhancedAppliedSuggestions,
        metadata: metadata
      },
      isActive: true,
      isDraft: false,
      notes: `Applied ${suggestion.icon_type} perspective: ${suggestion.label}`,
      createdAt: new Date().toISOString(),
      appliedSuggestion: newAppliedSuggestion
    }

    // Mark all other versions as inactive
    const updatedVersions = currentVersions.map((v: any) => ({ ...v, isActive: false }))
    updatedVersions.push(newVersion)

    // Update persona with new version data and make the new version active
    const updatedPersona = await prisma.persona.update({
      where: { id },
      data: {
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        location: persona.location,
        introduction: persona.introduction,
        personalityTraits: persona.personalityTraits as any,
        interests: persona.interests as any,
        inclusivityAttributes: enhancedInclusivityAttributes,
        appliedSuggestions: enhancedAppliedSuggestions,
        metadata: {
          ...metadata,
          versions: updatedVersions,
          currentVersion: newVersionId
        },
        updatedAt: new Date()
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

    return NextResponse.json({ 
      success: true,
      enhancedPersona: {
        ...updatedPersona,
        isOwner: true,
        accessType: 'owner'
      },
      newVersion,
      versions: updatedVersions,
      appliedSuggestions: enhancedAppliedSuggestions,
      originalSuggestion: suggestion,
      message: `Created new version "${newVersion.version}" with ${suggestion.icon_type} perspective: ${suggestion.label}`
    })

  } catch (error) {
    console.error('Error enhancing persona:', error)
    return NextResponse.json({ 
      error: 'Failed to create new version with perspective',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
