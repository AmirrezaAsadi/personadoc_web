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

    // Get the current persona - only allow owners to apply suggestions
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found or not authorized' }, { status: 404 })
    }

    // Parse existing data
    let inclusivityAttributes: any = {}
    let appliedSuggestions: any[] = []
    
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

    // Add the suggestion to inclusivity attributes
    const category = suggestion.icon_type || 'general'
    if (!inclusivityAttributes[category]) {
      inclusivityAttributes[category] = []
    }
    
    // Check if suggestion already exists
    const exists = inclusivityAttributes[category].includes(suggestion.label)
    if (!exists) {
      inclusivityAttributes[category].push(suggestion.label)
    }

    // Add to applied suggestions with timestamp and version info
    const appliedSuggestion = {
      label: suggestion.label,
      icon_type: suggestion.icon_type,
      description: suggestion.description,
      appliedAt: new Date().toISOString(),
      version: 'current' // Could be enhanced with actual versioning
    }

    // Check if this exact suggestion was already applied
    const alreadyApplied = appliedSuggestions.some(s => 
      s.label === suggestion.label && s.icon_type === suggestion.icon_type
    )

    if (!alreadyApplied) {
      appliedSuggestions.push(appliedSuggestion)
    }

    // Update the persona
    const updatedPersona = await prisma.persona.update({
      where: { id },
      data: {
        inclusivityAttributes: inclusivityAttributes,
        appliedSuggestions: appliedSuggestions,
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

    // Return the updated persona with owner info
    const responseData = {
      ...updatedPersona,
      isOwner: true,
      accessType: 'owner',
      appliedSuggestion: appliedSuggestion
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Apply suggestion error:', error)
    return NextResponse.json({ 
      error: 'Failed to apply suggestion',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
