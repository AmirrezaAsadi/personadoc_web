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

    // Get persona data
    const persona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // For now, return mock data - in a real app, you'd store this in the database
    const connections = (persona as any).metadata?.socialConnections || []

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error loading social circle:', error)
    return NextResponse.json({ error: 'Failed to load social circle' }, { status: 500 })
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

    const body = await request.json()
    const { connections } = body

    // Get persona
    const persona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Update persona metadata with social connections
    const updatedMetadata = {
      ...((persona as any).metadata || {}),
      socialConnections: connections
    }

    await prisma.persona.update({
      where: { id: id },
      data: { metadata: updatedMetadata } as any
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating social circle:', error)
    return NextResponse.json({ error: 'Failed to update social circle' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { connectionId } = body

    // Get persona
    const persona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Get current connections and filter out the one to delete
    const currentConnections = (persona as any).metadata?.socialConnections || []
    const updatedConnections = currentConnections.filter((conn: any) => conn.id !== connectionId)

    // Update persona metadata
    const updatedMetadata = {
      ...((persona as any).metadata || {}),
      socialConnections: updatedConnections
    }

    await prisma.persona.update({
      where: { id: id },
      data: { metadata: updatedMetadata } as any
    })

    return NextResponse.json({ success: true, deletedConnectionId: connectionId })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
  }
}
