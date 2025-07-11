import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FileUploadManager, TextExtractor } from '@/lib/file-management'
import { researchRAG } from '@/lib/research-rag'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID (handling both OAuth and credentials)
    let userId = (session.user as any).id
    if (!userId && session.user.email) {
      const prisma = (await import('@/lib/prisma')).prisma
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }

    const personaId = params.id
    const { files, fields } = await FileUploadManager.handleFormData(request)

    const {
      title,
      description,
      category,
      source,
      tags,
      relevantDate,
      content: manualContent,
      dataSourceTypes,
      hasFiles,
      filesMetadata
    } = fields

    let content = manualContent || ''

    // Get the persona and current metadata
    const prisma = (await import('@/lib/prisma')).prisma
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const currentMetadata = persona.metadata as any || {}
    const researchData = currentMetadata.uploadedResearch || []

    // Create new research entry
    const newResearchEntry = {
      id: Date.now().toString(),
      title: title || 'Untitled Research',
      description,
      content,
      category: category || 'document',
      files: files.length > 0 ? files : [],
      source,
      relevantDate: relevantDate ? new Date(relevantDate).toISOString() : new Date().toISOString(),
      tags: tags ? JSON.parse(tags) : [],
      dataSourceTypes: dataSourceTypes ? JSON.parse(dataSourceTypes) : [],
      createdAt: new Date().toISOString(),
      createdBy: userId,
      ragProcessed: false
    }

    researchData.push(newResearchEntry)

    // Update persona metadata
    await prisma.persona.update({
      where: { id: personaId },
      data: {
        metadata: {
          ...currentMetadata,
          uploadedResearch: researchData
        }
      }
    })

    // If we have files, prepare them for RAG processing (base64 format)
    let processedFiles: any[] = []
    if (files.length > 0) {
      // Convert uploaded files to the format expected by RAG system
      for (const file of files) {
        try {
          // Read file content as base64
          const fs = await import('fs/promises')
          const path = await import('path')
          const filePath = path.join(process.cwd(), 'public', file.url)
          const fileBuffer = await fs.readFile(filePath)
          const base64Content = fileBuffer.toString('base64')
          
          processedFiles.push({
            name: file.fileName,
            type: file.fileType,
            content: base64Content
          })
        } catch (error) {
          console.error(`Failed to process file ${file.fileName}:`, error)
        }
      }
    }

    // Update the persona's research metadata for RAG processing
    const ragResearchData = {
      uploadedFiles: processedFiles,
      manualKnowledge: manualContent || '',
      dataSourceTypes: dataSourceTypes ? JSON.parse(dataSourceTypes) : [],
      researchMetadata: {
        title,
        category,
        source,
        relevantDate,
        tags: tags ? JSON.parse(tags) : []
      }
    }

    // Update persona with RAG-compatible research data
    const updatedResearch = {
      ...currentMetadata.research,
      uploadedFiles: [
        ...(currentMetadata.research?.uploadedFiles || []),
        ...processedFiles
      ],
      manualKnowledge: currentMetadata.research?.manualKnowledge 
        ? currentMetadata.research.manualKnowledge + '\n\n' + (manualContent || '')
        : (manualContent || ''),
      dataSourceTypes: Array.from(new Set([
        ...(currentMetadata.research?.dataSourceTypes || []),
        ...(dataSourceTypes ? JSON.parse(dataSourceTypes) : [])
      ]))
    }

    await prisma.persona.update({
      where: { id: personaId },
      data: {
        metadata: {
          ...currentMetadata,
          research: updatedResearch,
          uploadedResearch: researchData
        }
      }
    })

    return NextResponse.json({
      success: true,
      research: newResearchEntry,
      filesUploaded: files.length,
      readyForRAG: processedFiles.length > 0 || (manualContent && manualContent.length > 100)
    })

  } catch (error) {
    console.error('Research upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload research data' },
      { status: 500 }
    )
  }
}

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
    const url = new URL(request.url)
    const category = url.searchParams.get('category')

    const prisma = (await import('@/lib/prisma')).prisma
    
    const persona = await prisma.persona.findUnique({
      where: { id: personaId }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}
    let research = metadata.uploadedResearch || []

    // Filter by category if specified
    if (category) {
      research = research.filter((item: any) => item.category === category)
    }

    // Sort by date
    research.sort((a: any, b: any) => 
      new Date(b.relevantDate).getTime() - new Date(a.relevantDate).getTime()
    )

    return NextResponse.json({ research })

  } catch (error) {
    console.error('Research fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch research data' },
      { status: 500 }
    )
  }
}
