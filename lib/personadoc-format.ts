import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'
import { readFile } from 'fs/promises'
import { join } from 'path'

// PersonaDoc file format handler
export class PersonaDocFormat {
  private static readonly FORMAT_VERSION = '1.0'
  private static readonly MIME_TYPE = 'application/vnd.personadoc'

  static async createPersonaDoc(personaId: string, options: {
    includeInteractions?: boolean
    includeFiles?: boolean
    includeImages?: boolean
  } = {}): Promise<Buffer> {
    // Get complete persona data
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        interactions: options.includeInteractions,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!persona) {
      throw new Error('Persona not found')
    }

    const metadata = persona.metadata as any || {}
    const zip = new JSZip()

    // 1. Create manifest.json
    const manifest = {
      formatVersion: this.FORMAT_VERSION,
      personaDoc: {
        name: persona.name,
        id: persona.id,
        exportedAt: new Date().toISOString(),
        exportedBy: persona.creator.email,
        version: metadata.currentVersion || '1.0'
      },
      contents: {
        hasInteractions: options.includeInteractions && persona.interactions?.length > 0,
        hasResearchFiles: options.includeFiles && metadata.uploadedResearch?.some((r: any) => r.files?.length > 0),
        hasImages: options.includeImages && ((persona.metadata as any)?.profileImage || metadata.uploadedResearch?.some((r: any) => 
          r.files?.some((f: any) => f.fileType?.startsWith('image/'))
        )),
        researchCount: metadata.uploadedResearch?.length || 0,
        versionsCount: metadata.versions?.length || 0,
        timelineEventsCount: metadata.timelineEvents?.length || 0
      }
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // 2. Create persona.json (core persona data)
    const personaData = {
      id: persona.id,
      name: persona.name,
      age: persona.age,
      occupation: persona.occupation,
      location: persona.location,
      introduction: persona.introduction,
      personalityTraits: persona.personalityTraits,
      interests: persona.interests,
      gadgets: persona.gadgets,
      createdAt: persona.createdAt,
      createdBy: persona.createdBy,
      creator: persona.creator,
      profileImage: (persona.metadata as any)?.profileImage
    }
    zip.file('persona.json', JSON.stringify(personaData, null, 2))

    // 3. Create research data and files
    if (metadata.uploadedResearch?.length) {
      const researchFolder = zip.folder('research')
      const filesFolder = researchFolder!.folder('files')
      
      const researchMetadata = []
      
      for (const research of metadata.uploadedResearch) {
        // Store research metadata
        const researchItem = {
          id: research.id,
          title: research.title,
          description: research.description,
          content: research.content,
          category: research.category,
          source: research.source,
          relevantDate: research.relevantDate,
          tags: research.tags,
          dataSourceTypes: research.dataSourceTypes,
          createdAt: research.createdAt,
          createdBy: research.createdBy,
          files: research.files?.map((f: any) => ({
            fileName: f.fileName,
            fileType: f.fileType,
            fileSize: f.fileSize,
            url: f.url
          })) || []
        }
        researchMetadata.push(researchItem)

        // Include actual files if requested
        if (options.includeFiles && research.files?.length) {
          for (const file of research.files) {
            try {
              const filePath = join(process.cwd(), 'public', file.url)
              const fileBuffer = await readFile(filePath)
              filesFolder!.file(`${research.id}/${file.fileName}`, fileBuffer)
            } catch (error) {
              console.error(`Failed to include file ${file.fileName}:`, error)
            }
          }
        }
      }
      
      researchFolder!.file('metadata.json', JSON.stringify(researchMetadata, null, 2))
    }

    // 4. Create timeline.json
    if (metadata.timelineEvents?.length) {
      zip.file('timeline.json', JSON.stringify(metadata.timelineEvents, null, 2))
    }

    // 5. Create versions.json
    if (metadata.versions?.length) {
      zip.file('versions.json', JSON.stringify(metadata.versions, null, 2))
    }

    // 6. Create interactions.json
    if (options.includeInteractions && persona.interactions?.length) {
      const interactionsData = persona.interactions.map(interaction => ({
        id: interaction.id,
        content: interaction.content,
        response: interaction.response,
        createdAt: interaction.createdAt,
        userId: interaction.userId
      }))
      zip.file('interactions.json', JSON.stringify(interactionsData, null, 2))
    }

    // 7. Include images/assets
    if (options.includeImages) {
      const assetsFolder = zip.folder('assets')
      
      // Profile image
      const profileImage = (persona.metadata as any)?.profileImage
      if (profileImage) {
        try {
          const imagePath = join(process.cwd(), 'public', profileImage)
          const imageBuffer = await readFile(imagePath)
          const imageName = profileImage.split('/').pop() || 'profile.jpg'
          assetsFolder!.file(imageName, imageBuffer)
        } catch (error) {
          console.error('Failed to include profile image:', error)
        }
      }
    }

    // Generate the ZIP file
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
  }

  static async parsePersonaDoc(fileBuffer: Buffer): Promise<{
    manifest: any
    persona: any
    research?: any[]
    timeline?: any[]
    versions?: any[]
    interactions?: any[]
    files?: Map<string, Buffer>
  }> {
    const zip = await JSZip.loadAsync(fileBuffer)
    
    // Parse manifest
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) {
      throw new Error('Invalid PersonaDoc file: missing manifest.json')
    }
    const manifest = JSON.parse(await manifestFile.async('text'))
    
    // Validate format version
    if (manifest.formatVersion !== this.FORMAT_VERSION) {
      throw new Error(`Unsupported PersonaDoc version: ${manifest.formatVersion}`)
    }
    
    // Parse persona data
    const personaFile = zip.file('persona.json')
    if (!personaFile) {
      throw new Error('Invalid PersonaDoc file: missing persona.json')
    }
    const persona = JSON.parse(await personaFile.async('text'))
    
    const result: any = { manifest, persona }
    
    // Parse optional components
    const researchFile = zip.file('research/metadata.json')
    if (researchFile) {
      result.research = JSON.parse(await researchFile.async('text'))
    }
    
    const timelineFile = zip.file('timeline.json')
    if (timelineFile) {
      result.timeline = JSON.parse(await timelineFile.async('text'))
    }
    
    const versionsFile = zip.file('versions.json')
    if (versionsFile) {
      result.versions = JSON.parse(await versionsFile.async('text'))
    }
    
    const interactionsFile = zip.file('interactions.json')
    if (interactionsFile) {
      result.interactions = JSON.parse(await interactionsFile.async('text'))
    }
    
    // Extract files
    const files = new Map<string, Buffer>()
    const researchFilesFolder = zip.folder('research/files')
    if (researchFilesFolder) {
      for (const [fileName, file] of Object.entries(researchFilesFolder.files)) {
        if (!file.dir) {
          files.set(fileName, await file.async('nodebuffer'))
        }
      }
    }
    
    const assetsFolder = zip.folder('assets')
    if (assetsFolder) {
      for (const [fileName, file] of Object.entries(assetsFolder.files)) {
        if (!file.dir) {
          files.set(`assets/${fileName}`, await file.async('nodebuffer'))
        }
      }
    }
    
    if (files.size > 0) {
      result.files = files
    }
    
    return result
  }

  static getFileExtension(): string {
    return '.personaDoc'
  }

  static getMimeType(): string {
    return this.MIME_TYPE
  }
}
