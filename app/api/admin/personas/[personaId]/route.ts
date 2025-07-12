import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions)
  return session?.user?.email === 'amircincy@gmail.com'
}

interface RouteParams {
  params: Promise<{ personaId: string }>
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { personaId } = await params

    // Check if persona exists
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      select: { id: true, name: true }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Delete the persona and all related data (cascade will handle related records)
    await prisma.persona.delete({
      where: { id: personaId }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Persona "${persona.name}" deleted successfully` 
    })
  } catch (error) {
    console.error('Failed to delete persona:', error)
    return NextResponse.json({ error: 'Failed to delete persona' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    if (!await isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { personaId } = await params
    const body = await req.json()
    const { action, isPublic } = body

    if (action === 'toggle-visibility') {
      const updatedPersona = await prisma.persona.update({
        where: { id: personaId },
        data: { isPublic },
        select: { id: true, name: true, isPublic: true }
      })

      return NextResponse.json({ 
        success: true, 
        message: `Persona visibility updated to ${isPublic ? 'public' : 'private'}`,
        persona: updatedPersona
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update persona:', error)
    return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })
  }
}
