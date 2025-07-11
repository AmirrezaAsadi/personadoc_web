import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PersonaDocFormat } from '@/lib/personadoc-format'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const options = {
      createAsTemplate: formData.get('createAsTemplate') === 'true',
      preserveId: formData.get('preserveId') === 'true',
      importFiles: formData.get('importFiles') === 'true',
      importInteractions: formData.get('importInteractions') === 'true'
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.personaDoc')) {
      return NextResponse.json({ error: 'Invalid file type. Expected .personaDoc file' }, { status: 400 })
    }

    // Parse PersonaDoc file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const parsedData = await PersonaDocFormat.parsePersonaDoc(fileBuffer)

    const { manifest, persona: originalPersona, research, timeline, versions, interactions, files } = parsedData

    // Create new persona (or update existing if preserveId is true and user owns it)
    let newPersonaId = originalPersona.id
    let existingPersona = null

    if (options.preserveId) {
      existingPersona = await prisma.persona.findFirst({
        where: { 
          id: originalPersona.id,
          createdBy: userId
        }
      })
    }

    let personaData: any = {
      name: existingPersona ? `${originalPersona.name} (Updated)` : `${originalPersona.name} (Imported)`,
      age: originalPersona.age,
      occupation: originalPersona.occupation,
      location: originalPersona.location,
      introduction: originalPersona.introduction,
      personalityTraits: originalPersona.personalityTraits,
      interests: originalPersona.interests,
      gadgets: originalPersona.gadgets,
      createdBy: userId
    }

    // Prepare metadata
    const importedMetadata: any = {
      imported: {
        originalId: originalPersona.id,
        importedAt: new Date().toISOString(),
        importedBy: userId,
        sourceVersion: manifest.formatVersion,
        originalExportDate: manifest.personaDoc.exportedAt
      }
    }

    // Add research data
    if (research?.length) {
      importedMetadata.uploadedResearch = research.map((item: any) => ({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate new ID
        createdBy: userId,
        importedFrom: item.id
      }))
    }

    // Add timeline events
    if (timeline?.length) {
      importedMetadata.timelineEvents = timeline.map((event: any) => ({
        ...event,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdBy: userId,
        importedFrom: event.id
      }))
    }

    // Add versions
    if (versions?.length) {
      importedMetadata.versions = versions.map((version: any) => ({
        ...version,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdBy: userId,
        importedFrom: version.id
      }))
      importedMetadata.currentVersion = versions.find((v: any) => v.isActive)?.version || '1.0'
    }

    personaData.metadata = importedMetadata

    let newPersona
    if (existingPersona && options.preserveId) {
      // Update existing persona
      newPersona = await prisma.persona.update({
        where: { id: existingPersona.id },
        data: personaData
      })
      newPersonaId = existingPersona.id
    } else {
      // Create new persona
      if (!options.preserveId) {
        delete personaData.id
      }
      newPersona = await prisma.persona.create({
        data: personaData
      })
      newPersonaId = newPersona.id
    }

    // Import files if requested
    let importedFiles = 0
    if (options.importFiles && files?.size) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', newPersonaId)
      await mkdir(uploadsDir, { recursive: true })

      for (const [filePath, fileBuffer] of files.entries()) {
        try {
          const fullPath = join(uploadsDir, filePath.replace(/^research\/files\/[^\/]+\//, ''))
          await mkdir(join(fullPath, '..'), { recursive: true })
          await writeFile(fullPath, fileBuffer)
          importedFiles++
        } catch (error) {
          console.error(`Failed to import file ${filePath}:`, error)
        }
      }
    }

    // Import interactions if requested
    let importedInteractions = 0
    if (options.importInteractions && interactions?.length) {
      const interactionData = interactions.map((interaction: any) => ({
        personaId: newPersonaId,
        userId: userId,
        content: interaction.content,
        response: interaction.response,
        createdAt: new Date(interaction.createdAt)
      }))

      await prisma.interaction.createMany({
        data: interactionData
      })
      importedInteractions = interactions.length
    }

    // Create import timeline event
    await prisma.persona.update({
      where: { id: newPersonaId },
      data: {
        metadata: {
          ...importedMetadata,
          timelineEvents: [
            ...(importedMetadata.timelineEvents || []),
            {
              id: Date.now().toString(),
              title: 'Persona Imported',
              description: `Imported from PersonaDoc file: ${file.name}`,
              eventType: 'milestone',
              eventDate: new Date().toISOString(),
              importance: 8,
              category: 'import',
              color: '#10B981',
              icon: 'download',
              createdBy: userId,
              createdAt: new Date().toISOString()
            }
          ]
        }
      }
    })

    return NextResponse.json({
      success: true,
      persona: newPersona,
      imported: {
        personaId: newPersonaId,
        researchItems: research?.length || 0,
        timelineEvents: timeline?.length || 0,
        versions: versions?.length || 0,
        interactions: importedInteractions,
        files: importedFiles,
        isUpdate: !!existingPersona
      },
      manifest
    })

  } catch (error) {
    console.error('PersonaDoc import error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import PersonaDoc file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
