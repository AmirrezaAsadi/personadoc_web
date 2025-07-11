import { PrismaClient } from '@prisma/client'
import type { 
  Persona, 
  PersonaVersion, 
  ResearchData, 
  TimelineEvent, 
  Interaction 
} from '@prisma/client'

const prisma = new PrismaClient()

// Persona Versioning and Branching
export class PersonaVersionManager {
  static async createVersion(
    personaId: string, 
    userId: string, 
    versionData: {
      name: string
      version: string
      snapshot: any
      changes?: any
      branchFrom?: string
      branchName?: string
      notes?: string
    }
  ) {
    const newVersion = await prisma.personaVersion.create({
      data: {
        personaId,
        createdBy: userId,
        isActive: false,
        isDraft: true,
        ...versionData
      }
    })

    // Create timeline event for version creation
    await TimelineManager.createEvent({
      personaId,
      title: `Version ${versionData.version} Created`,
      description: `New version: ${versionData.name}`,
      eventType: 'milestone',
      eventDate: new Date(),
      importance: 7,
      category: 'versioning',
      color: '#8B5CF6',
      icon: 'git-branch',
      createdBy: userId
    })

    return newVersion
  }

  static async publishVersion(versionId: string, personaId: string) {
    // Deactivate current active version
    await prisma.personaVersion.updateMany({
      where: { personaId, isActive: true },
      data: { isActive: false }
    })

    // Activate new version
    const newActiveVersion = await prisma.personaVersion.update({
      where: { id: versionId },
      data: { isActive: true, isDraft: false }
    })

    // Update persona's current version
    await prisma.persona.update({
      where: { id: personaId },
      data: { currentVersion: newActiveVersion.version }
    })

    return newActiveVersion
  }

  static async branchPersona(
    personaId: string, 
    userId: string, 
    branchData: {
      name: string
      version: string
      branchName: string
      changes?: any
    }
  ) {
    const originalPersona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: { versions: { where: { isActive: true } } }
    })

    if (!originalPersona) throw new Error('Persona not found')

    const activeVersion = originalPersona.versions[0]
    
    return this.createVersion(personaId, userId, {
      ...branchData,
      branchFrom: activeVersion?.id,
      snapshot: activeVersion?.snapshot || {}
    })
  }
}

// Research Data Management
export class ResearchManager {
  static async uploadResearchData(
    personaId: string,
    userId: string,
    data: {
      title: string
      description?: string
      content: string
      category: string
      fileUrl?: string
      fileName?: string
      fileType?: string
      fileSize?: number
      source?: string
      relevantDate?: Date
      tags?: string[]
      insights?: any
    }
  ) {
    const research = await prisma.researchData.create({
      data: {
        personaId,
        createdBy: userId,
        confidence: 0.8, // Default confidence
        ...data,
        tags: data.tags || []
      }
    })

    // Create timeline event for research upload
    await TimelineManager.createEvent({
      personaId,
      title: `Research Added: ${data.title}`,
      description: data.description || 'New research data uploaded',
      eventType: 'insight',
      eventDate: data.relevantDate || new Date(),
      researchDataId: research.id,
      importance: 6,
      category: 'research',
      color: '#F59E0B',
      icon: 'file-text',
      createdBy: userId
    })

    return research
  }

  static async analyzeResearchConnections(personaId: string) {
    const researchData = await prisma.researchData.findMany({
      where: { personaId },
      orderBy: { relevantDate: 'desc' }
    })

    // Simple connection analysis based on common tags and keywords
    const connections: Record<string, string[]> = {}
    
    researchData.forEach(item => {
      const tags = Array.isArray(item.tags) ? item.tags : []
      const keywords = item.content.toLowerCase().split(/\s+/).slice(0, 20)
      
      connections[item.id] = researchData
        .filter(other => other.id !== item.id)
        .filter(other => {
          const otherTags = Array.isArray(other.tags) ? other.tags : []
          const otherKeywords = other.content.toLowerCase().split(/\s+/).slice(0, 20)
          
          // Check for tag overlap
          const tagOverlap = tags.some(tag => otherTags.includes(tag))
          
          // Check for keyword overlap
          const keywordOverlap = keywords.some(word => 
            word.length > 3 && otherKeywords.includes(word)
          )
          
          return tagOverlap || keywordOverlap
        })
        .map(other => other.id)
    })

    // Update research items with connections
    for (const [itemId, connectedIds] of Object.entries(connections)) {
      await prisma.researchData.update({
        where: { id: itemId },
        data: { connections: connectedIds }
      })
    }

    return connections
  }
}

// Timeline Management
export class TimelineManager {
  static async createEvent(eventData: {
    personaId: string
    title: string
    description?: string
    eventType: string
    eventDate: Date
    endDate?: Date
    researchDataId?: string
    interactionId?: string
    importance?: number
    category?: string
    tags?: string[]
    color?: string
    icon?: string
    createdBy: string
  }) {
    return await prisma.timelineEvent.create({
      data: {
        importance: 5,
        ...eventData,
        tags: eventData.tags || []
      }
    })
  }

  static async getPersonaTimeline(
    personaId: string, 
    options: {
      startDate?: Date
      endDate?: Date
      eventTypes?: string[]
      categories?: string[]
      limit?: number
    } = {}
  ) {
    const where: any = { personaId }
    
    if (options.startDate || options.endDate) {
      where.eventDate = {}
      if (options.startDate) where.eventDate.gte = options.startDate
      if (options.endDate) where.eventDate.lte = options.endDate
    }
    
    if (options.eventTypes?.length) {
      where.eventType = { in: options.eventTypes }
    }
    
    if (options.categories?.length) {
      where.category = { in: options.categories }
    }

    return await prisma.timelineEvent.findMany({
      where,
      include: {
        researchData: true,
        interaction: true
      },
      orderBy: { eventDate: 'desc' },
      take: options.limit || 100
    })
  }
}

// Export and Import functionality
export class PersonaExportManager {
  static async exportPersonaData(personaId: string, includeImages: boolean = true) {
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        versions: true,
        researchData: true,
        timelineEvents: {
          include: {
            researchData: true,
            interaction: true
          }
        },
        interactions: true,
        children: true // Include branched personas
      }
    })

    if (!persona) throw new Error('Persona not found')

    const exportData = {
      persona,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        includesImages: includeImages
      }
    }

    // If including images, add base64 encoded images
    if (includeImages && persona.profileImage) {
      // This would need to be implemented based on your file storage solution
      // exportData.images = await this.encodeImages(persona)
    }

    return exportData
  }

  static async importPersonaData(
    exportData: any, 
    userId: string, 
    options: { createAsTemplate?: boolean } = {}
  ) {
    const { persona: originalPersona, metadata } = exportData
    
    // Create new persona
    const newPersona = await prisma.persona.create({
      data: {
        name: `${originalPersona.name} (Imported)`,
        age: originalPersona.age,
        occupation: originalPersona.occupation,
        location: originalPersona.location,
        introduction: originalPersona.introduction,
        personalityTraits: originalPersona.personalityTraits,
        interests: originalPersona.interests,
        gadgets: originalPersona.gadgets,
        metadata: originalPersona.metadata,
        isTemplate: options.createAsTemplate || false,
        createdBy: userId
      }
    })

    // Import research data
    if (originalPersona.researchData?.length) {
      const researchDataToCreate = originalPersona.researchData.map((item: any) => ({
        ...item,
        id: undefined, // Let Prisma generate new ID
        personaId: newPersona.id,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      await prisma.researchData.createMany({
        data: researchDataToCreate
      })
    }

    // Create import timeline event
    await TimelineManager.createEvent({
      personaId: newPersona.id,
      title: 'Persona Imported',
      description: `Imported from external data (${metadata?.exportedAt})`,
      eventType: 'milestone',
      eventDate: new Date(),
      importance: 8,
      category: 'import',
      color: '#10B981',
      icon: 'download',
      createdBy: userId
    })

    return newPersona
  }
}

export { prisma }
