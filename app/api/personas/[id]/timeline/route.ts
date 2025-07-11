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
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const eventType = url.searchParams.get('eventType')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // For now, generate timeline from existing data since we haven't migrated yet
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        interactions: {
          orderBy: { createdAt: 'asc' },
          take: limit
        }
      }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Generate timeline events from existing data
    const timelineEvents = []

    // Add persona creation event
    timelineEvents.push({
      id: `creation-${persona.id}`,
      title: 'Persona Created',
      description: `${persona.name} was created`,
      eventType: 'milestone',
      eventDate: persona.createdAt,
      importance: 10,
      category: 'creation',
      color: '#22C55E',
      icon: 'user-plus'
    })

    // Add interaction events
    persona.interactions.forEach((interaction, index) => {
      timelineEvents.push({
        id: `interaction-${interaction.id}`,
        title: `Interaction ${index + 1}`,
        description: `Conversation: ${interaction.content.substring(0, 100)}...`,
        eventType: 'interaction',
        eventDate: interaction.createdAt,
        importance: 5,
        category: 'conversation',
        color: '#3B82F6',
        icon: 'message-circle',
        interactionId: interaction.id
      })
    })

    // Add research upload events from metadata
    const metadata = persona.metadata as any || {}
    const uploadedResearch = metadata.uploadedResearch || []
    
    uploadedResearch.forEach((research: any) => {
      timelineEvents.push({
        id: `research-${research.id}`,
        title: `Research Added: ${research.title}`,
        description: research.description || 'Research data uploaded',
        eventType: 'insight',
        eventDate: new Date(research.relevantDate),
        importance: 6,
        category: 'research',
        color: '#F59E0B',
        icon: 'file-text',
        researchId: research.id
      })
    })

    // Filter and sort
    let filteredEvents = timelineEvents

    if (startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.eventDate) >= new Date(startDate)
      )
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.eventDate) <= new Date(endDate)
      )
    }

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => 
        event.eventType === eventType
      )
    }

    // Sort by date (newest first)
    filteredEvents.sort((a, b) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    )

    return NextResponse.json({
      timeline: filteredEvents.slice(0, limit),
      totalEvents: filteredEvents.length
    })

  } catch (error) {
    console.error('Timeline fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: personaId } = await params
    const body = await request.json()

    const {
      title,
      description,
      eventType,
      eventDate,
      importance = 5,
      category,
      color,
      icon
    } = body

    // For now, store timeline events in persona metadata
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}
    const timelineEvents = metadata.timelineEvents || []

    const newEvent = {
      id: Date.now().toString(),
      title,
      description,
      eventType,
      eventDate: new Date(eventDate).toISOString(),
      importance,
      category,
      color,
      icon,
      createdAt: new Date().toISOString(),
      createdBy: userId
    }

    timelineEvents.push(newEvent)

    await prisma.persona.update({
      where: { id: personaId },
      data: {
        metadata: {
          ...metadata,
          timelineEvents
        }
      }
    })

    return NextResponse.json({
      success: true,
      event: newEvent
    })

  } catch (error) {
    console.error('Timeline creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create timeline event' },
      { status: 500 }
    )
  }
}
