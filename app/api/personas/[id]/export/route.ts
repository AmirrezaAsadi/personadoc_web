import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PersonaDocFormat } from '@/lib/personadoc-format'

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
    const format = url.searchParams.get('format') || 'json'
    const includeImages = url.searchParams.get('includeImages') === 'true'
    const includeInteractions = url.searchParams.get('includeInteractions') === 'true'

    // Get complete persona data
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      include: {
        interactions: includeInteractions,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const metadata = persona.metadata as any || {}

    // Prepare export data
    const exportData = {
      persona: {
        id: persona.id,
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        location: persona.location,
        introduction: persona.introduction,
        personalityTraits: persona.personalityTraits,
        interests: persona.interests,
        gadgets: persona.gadgets,
        metadata: persona.metadata,
        createdAt: persona.createdAt,
        createdBy: persona.createdBy,
        creator: persona.creator
      },
      versions: metadata.versions || [],
      research: metadata.uploadedResearch || [],
      timelineEvents: metadata.timelineEvents || [],
      interactions: includeInteractions ? persona.interactions : [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        format,
        includeImages,
        includeInteractions,
        version: '1.0'
      }
    }

    if (format === 'json') {
      return NextResponse.json(exportData)
    }

    if (format === 'personaDoc') {
      // Create PersonaDoc format
      const personaDocBuffer = await PersonaDocFormat.createPersonaDoc(personaId, {
        includeInteractions,
        includeFiles: true,
        includeImages
      })
      
      return new NextResponse(personaDocBuffer, {
        headers: {
          'Content-Type': PersonaDocFormat.getMimeType(),
          'Content-Disposition': `attachment; filename="${persona.name}${PersonaDocFormat.getFileExtension()}"`
        }
      })
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvContent = convertToCSV(exportData)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${persona.name}-export.csv"`
        }
      })
    }

    if (format === 'markdown') {
      // Convert to Markdown format
      const markdownContent = convertToMarkdown(exportData)
      
      return new NextResponse(markdownContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${persona.name}-export.md"`
        }
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export persona data' },
      { status: 500 }
    )
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any): string {
  const { persona, research, timelineEvents, interactions } = data
  
  let csv = 'Type,Field,Value\n'
  
  // Basic persona info
  csv += `Basic,Name,"${persona.name}"\n`
  csv += `Basic,Age,${persona.age || ''}\n`
  csv += `Basic,Occupation,"${persona.occupation || ''}"\n`
  csv += `Basic,Location,"${persona.location || ''}"\n`
  csv += `Basic,Introduction,"${(persona.introduction || '').replace(/"/g, '""')}"\n`
  
  // Research data
  research.forEach((item: any, index: number) => {
    csv += `Research ${index + 1},Title,"${item.title}"\n`
    csv += `Research ${index + 1},Category,"${item.category}"\n`
    csv += `Research ${index + 1},Date,"${item.relevantDate}"\n`
    csv += `Research ${index + 1},Content,"${(item.content || '').replace(/"/g, '""')}"\n`
  })
  
  // Timeline events
  timelineEvents.forEach((event: any, index: number) => {
    csv += `Timeline ${index + 1},Title,"${event.title}"\n`
    csv += `Timeline ${index + 1},Type,"${event.eventType}"\n`
    csv += `Timeline ${index + 1},Date,"${event.eventDate}"\n`
    csv += `Timeline ${index + 1},Description,"${(event.description || '').replace(/"/g, '""')}"\n`
  })
  
  return csv
}

// Helper function to convert data to Markdown
function convertToMarkdown(data: any): string {
  const { persona, research, timelineEvents, interactions, versions } = data
  
  let md = `# ${persona.name}\n\n`
  
  // Basic information
  md += '## Basic Information\n\n'
  md += `- **Age:** ${persona.age || 'Unknown'}\n`
  md += `- **Occupation:** ${persona.occupation || 'Unknown'}\n`
  md += `- **Location:** ${persona.location || 'Unknown'}\n`
  md += `- **Created:** ${new Date(persona.createdAt).toLocaleDateString()}\n\n`
  
  if (persona.introduction) {
    md += '## Introduction\n\n'
    md += `${persona.introduction}\n\n`
  }
  
  // Personality traits
  if (persona.personalityTraits) {
    md += '## Personality Traits\n\n'
    const traits = typeof persona.personalityTraits === 'string' 
      ? JSON.parse(persona.personalityTraits) 
      : persona.personalityTraits
    
    if (Array.isArray(traits)) {
      traits.forEach(trait => md += `- ${trait}\n`)
    } else if (typeof traits === 'object') {
      Object.entries(traits).forEach(([key, value]) => {
        md += `- **${key}:** ${value}\n`
      })
    }
    md += '\n'
  }
  
  // Interests
  if (persona.interests) {
    md += '## Interests\n\n'
    const interests = typeof persona.interests === 'string' 
      ? JSON.parse(persona.interests) 
      : persona.interests
    
    if (Array.isArray(interests)) {
      interests.forEach(interest => md += `- ${interest}\n`)
    } else if (typeof interests === 'object') {
      Object.entries(interests).forEach(([key, value]) => {
        md += `- **${key}:** ${value}\n`
      })
    }
    md += '\n'
  }
  
  // Versions
  if (versions.length > 0) {
    md += '## Version History\n\n'
    versions.forEach((version: any) => {
      md += `### Version ${version.version}\n`
      md += `- **Name:** ${version.name}\n`
      md += `- **Created:** ${new Date(version.createdAt).toLocaleDateString()}\n`
      md += `- **Status:** ${version.isActive ? 'Active' : 'Inactive'}\n`
      if (version.notes) md += `- **Notes:** ${version.notes}\n`
      md += '\n'
    })
  }
  
  // Research data
  if (research.length > 0) {
    md += '## Research Data\n\n'
    research.forEach((item: any, index: number) => {
      md += `### ${item.title}\n`
      md += `- **Category:** ${item.category}\n`
      md += `- **Date:** ${new Date(item.relevantDate).toLocaleDateString()}\n`
      if (item.source) md += `- **Source:** ${item.source}\n`
      if (item.tags && item.tags.length > 0) {
        md += `- **Tags:** ${item.tags.join(', ')}\n`
      }
      md += `\n${item.content}\n\n---\n\n`
    })
  }
  
  // Timeline
  if (timelineEvents.length > 0) {
    md += '## Timeline\n\n'
    timelineEvents
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      .forEach((event: any) => {
        md += `### ${new Date(event.eventDate).toLocaleDateString()} - ${event.title}\n`
        md += `**Type:** ${event.eventType} | **Category:** ${event.category || 'General'}\n\n`
        if (event.description) md += `${event.description}\n\n`
      })
  }
  
  // Interactions
  if (interactions.length > 0) {
    md += '## Interactions\n\n'
    interactions.forEach((interaction: any, index: number) => {
      md += `### Interaction ${index + 1}\n`
      md += `**Date:** ${new Date(interaction.createdAt).toLocaleDateString()}\n\n`
      md += `**Input:** ${interaction.content}\n\n`
      md += `**Response:** ${interaction.response}\n\n---\n\n`
    })
  }
  
  return md
}
