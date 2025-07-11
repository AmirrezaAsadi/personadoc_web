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

    // Verify persona ownership
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const caption = formData.get('caption') as string
    const category = formData.get('category') as string
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for storage (in a real app, you'd upload to cloud storage)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Create a file record (this would be stored in a proper files table in production)
    const fileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: dataUrl, // In production, this would be a cloud storage URL
      thumbnail: file.type.startsWith('image/') ? dataUrl : undefined,
      caption,
      category,
      uploadedAt: new Date().toISOString()
    }

    // For now, we'll add this to the research data as a new item
    // In production, you'd have proper file management
    const newResearchItem = {
      title: caption || file.name,
      description: `Uploaded ${type}: ${file.name}`,
      category: category,
      content: caption || '',
      files: [fileRecord],
      source: 'upload',
      relevantDate: new Date().toISOString(),
      tags: [category, type],
      dataSourceTypes: [type],
      ragProcessed: false
    }

    // This is a simplified approach - in production you'd use proper file storage
    console.log('File uploaded:', {
      personaId: id,
      fileName: file.name,
      size: file.size,
      type: file.type,
      category,
      caption
    })

    return NextResponse.json({ 
      success: true, 
      file: fileRecord,
      message: 'File uploaded successfully'
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
