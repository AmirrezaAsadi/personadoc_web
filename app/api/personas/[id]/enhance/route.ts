import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { grok } from '@/lib/grok'

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
    
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Parse metadata and inclusivity data for enhanced context
    let metadata: any = {}
    let inclusivityAttributes: any = {}
    let appliedSuggestions: any[] = []
    
    try {
      metadata = typeof (persona as any).metadata === 'string' 
        ? JSON.parse((persona as any).metadata) 
        : (persona as any).metadata || {}
    } catch (error) {
      metadata = {}
    }

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

    // Build the AI prompt for persona enhancement
    const systemPrompt = `You are an expert persona researcher specializing in inclusive design. Your task is to enhance an existing persona by applying a specific inclusivity suggestion and filling in relevant details.

CURRENT PERSONA:
Name: ${persona.name}
Age: ${persona.age || 'Not specified'}
Occupation: ${persona.occupation || 'Not specified'}
Location: ${persona.location || 'Not specified'}
Introduction: ${persona.introduction || 'Not specified'}
Personality Traits: ${Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Not specified'}
Interests: ${Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Not specified'}

EXISTING INCLUSIVITY ATTRIBUTES:
${Object.keys(inclusivityAttributes).length > 0 ? JSON.stringify(inclusivityAttributes, null, 2) : 'None applied yet'}

PREVIOUSLY APPLIED SUGGESTIONS:
${appliedSuggestions.length > 0 ? appliedSuggestions.map(s => `- ${s.label} (${s.icon_type})`).join('\n') : 'None applied yet'}

INCLUSIVITY SUGGESTION TO APPLY:
Label: ${suggestion.label}
Category: ${suggestion.icon_type}
Description: ${suggestion.description}

TASK: Enhance this persona by incorporating the inclusivity suggestion. Provide realistic, specific details that make the persona more inclusive and representative. Keep the core identity intact while adding depth and authenticity.

Generate enhanced persona data in this exact JSON format:
{
  "name": "string (keep existing name)",
  "age": number or null,
  "occupation": "string or null", 
  "location": "string or null",
  "introduction": "string (enhanced 2-3 sentence background incorporating the suggestion)",
  "personalityTraits": ["array", "of", "strings"],
  "interests": ["array", "of", "strings"],
  "inclusivityAttributes": {
    "category": ["applied_suggestion_label"]
  },
  "versionNotes": "string (explanation of what was enhanced based on the suggestion)"
}

Guidelines:
- Keep the original name unchanged
- Enhance the introduction to naturally incorporate the inclusivity aspect
- Add or modify personality traits that reflect the inclusive dimension
- Include interests that align with the enhanced background
- Make changes feel natural and authentic, not forced
- Ensure all details are consistent and realistic
- Focus on how this inclusivity aspect would realistically manifest in their daily life and interactions

Example: If the suggestion is about economic diversity, consider how it affects their technology choices, spending habits, priorities, stress levels, and life goals.`

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: `Please enhance this persona by applying the inclusivity suggestion: "${suggestion.label}". Generate realistic, specific details that incorporate this aspect naturally while keeping the core identity intact. Description: ${suggestion.description}`
      }
    ]

    // Call AI to generate enhanced persona
    const response = await grok.chat.completions.create({
      model: "grok-3",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1200,
    })

    const aiResponse = response.choices[0]?.message?.content || ''
    
    // Try to parse the JSON response
    let enhancedPersona = null
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        enhancedPersona = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (error) {
      console.error('Failed to parse AI persona enhancement:', error)
      console.log('AI Response:', aiResponse)
      
      // Fallback: create minimal enhancement
      enhancedPersona = {
        name: persona.name,
        age: persona.age,
        occupation: persona.occupation,
        location: persona.location,
        introduction: persona.introduction + ` This persona has been enhanced to consider ${suggestion.label} aspects.`,
        personalityTraits: Array.isArray(persona.personalityTraits) ? persona.personalityTraits : [],
        interests: Array.isArray(persona.interests) ? persona.interests : [],
        inclusivityAttributes: {
          ...inclusivityAttributes,
          [suggestion.icon_type]: [...(inclusivityAttributes[suggestion.icon_type] || []), suggestion.label]
        },
        versionNotes: `Applied ${suggestion.icon_type} inclusivity suggestion: ${suggestion.label}`
      }
    }

    // Validate and enhance the persona data
    if (!enhancedPersona.name) enhancedPersona.name = persona.name
    if (!enhancedPersona.versionNotes) {
      enhancedPersona.versionNotes = `Enhanced with ${suggestion.icon_type} inclusivity: ${suggestion.label}`
    }

    // Ensure inclusivity attributes are properly structured
    if (!enhancedPersona.inclusivityAttributes) {
      enhancedPersona.inclusivityAttributes = {
        ...inclusivityAttributes,
        [suggestion.icon_type]: [...(inclusivityAttributes[suggestion.icon_type] || []), suggestion.label]
      }
    }

    // Update applied suggestions tracking
    const newAppliedSuggestion = {
      label: suggestion.label,
      icon_type: suggestion.icon_type,
      description: suggestion.description,
      appliedAt: new Date().toISOString(),
      version: persona.currentVersion || '1.0'
    }

    const updatedAppliedSuggestions = [...appliedSuggestions, newAppliedSuggestion]

    return NextResponse.json({ 
      success: true,
      enhancedPersona,
      appliedSuggestions: updatedAppliedSuggestions,
      originalSuggestion: suggestion,
      message: `Persona enhanced with ${suggestion.icon_type} inclusivity: ${suggestion.label}`
    })

  } catch (error) {
    console.error('Error enhancing persona:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
