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
    const { requestType = 'general' } = await request.json()
    
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

    // Build the AI prompt for inclusivity suggestions
    const systemPrompt = `You are an expert in inclusive design and persona research. Your role is to analyze personas and suggest brief, impactful inclusivity enhancements that make personas more diverse and representative.

CURRENT PERSONA ANALYSIS:
Name: ${persona.name}
Age: ${persona.age || 'Not specified'}
Occupation: ${persona.occupation || 'Not specified'}
Location: ${persona.location || 'Not specified'}
Background: ${persona.introduction || 'Not specified'}
Personality Traits: ${Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Not specified'}
Interests: ${Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Not specified'}

EXISTING DEMOGRAPHICS:
${metadata.demographics ? JSON.stringify(metadata.demographics, null, 2) : 'Limited demographic information'}

CURRENT INCLUSIVITY ATTRIBUTES:
${Object.keys(inclusivityAttributes).length > 0 ? JSON.stringify(inclusivityAttributes, null, 2) : 'None applied yet'}

PREVIOUSLY APPLIED SUGGESTIONS:
${appliedSuggestions.length > 0 ? appliedSuggestions.map(s => `- ${s.label} (${s.icon_type})`).join('\n') : 'None applied yet'}

TASK: Generate 5 diverse, brief inclusivity suggestions. Each should be 2-3 words maximum that represent meaningful inclusive dimensions that would make this persona more representative of real-world diversity.

INTERESTING SUGGESTIONS TO CONSIDER:
- "Color blind" - visual accessibility needs
- "Non-binary" - gender identity diversity  
- "Bilingual speaker" - linguistic diversity
- "First generation" - education/immigration background
- "Chronic illness" - health accessibility
- "Remote caregiver" - family responsibility patterns
- "Deaf community" - communication differences
- "Night shift worker" - work schedule diversity
- "Religious minority" - faith/cultural diversity
- "Wheelchair user" - mobility accessibility
- "Low bandwidth" - technology constraints
- "Single parent" - family structure variety
- "Immigrant" - cultural adaptation
- "Neurodivergent" - cognitive diversity
- "Rural background" - geographic/cultural differences
- "Gen Z digital native" - generational tech patterns
- "Minimalist lifestyle" - consumption preferences
- "Public transit user" - transportation accessibility
- "Sign language user" - communication preferences
- "Plant-based diet" - lifestyle/ethical choices

For each suggestion, provide:
1. LABEL: 2-3 word inclusive dimension (brief and impactful)
2. ICON_TYPE: Choose from these categories for icon matching:
   - accessibility (for disabilities, assistive tech)
   - identity (for gender, sexuality, identity)
   - culture (for ethnicity, religion, immigration)
   - economic (for income, employment, class)
   - family (for family structure, relationships)
   - health (for chronic conditions, mental health)
   - education (for literacy, learning differences)
   - geographic (for rural/urban, regional differences)
3. DESCRIPTION: One concise sentence explaining how this would enhance persona inclusivity

Choose suggestions that:
- Are NOT already represented in the current persona or applied suggestions
- Add meaningful diversity across different dimensions
- Would impact how this person interacts with products/services
- Represent underrepresented communities
- Avoid duplicating existing inclusivity attributes

Respond with ONLY a JSON array of exactly 5 suggestions in this format:
[
  {
    "label": "Brief label",
    "icon_type": "category_name",
    "description": "One sentence explaining the inclusivity enhancement"
  }
]`

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: `Please analyze this persona and provide 5 brief inclusivity suggestions (2-3 words each) that would make it more representative. Focus on meaningful dimensions that aren't already represented.`
      }
    ]

    // Call AI to generate suggestions
    const response = await grok.chat.completions.create({
      model: "grok-3",// this is correct model
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiResponse = response.choices[0]?.message?.content || ''
    
    // Try to parse the JSON response
    let suggestions = []
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      } else {
        // Fallback if JSON parsing fails
        suggestions = [{
          label: "AI Response Error",
          icon_type: "accessibility",
          description: "Unable to parse AI suggestions. Please try again."
        }]
      }
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error)
      // Fallback suggestions if AI parsing fails
      suggestions = [
        {
          label: "Non-binary",
          icon_type: "identity",
          description: "Consider gender identity diversity beyond binary options"
        },
        {
          label: "Bilingual speaker",
          icon_type: "culture",
          description: "Explore multilingual communication patterns and cultural code-switching"
        },
        {
          label: "Chronic illness",
          icon_type: "health",
          description: "Consider invisible disabilities and energy management needs"
        },
        {
          label: "Remote caregiver",
          icon_type: "family",
          description: "Examine caring responsibilities and flexible work arrangements"
        },
        {
          label: "Low bandwidth",
          icon_type: "economic",
          description: "Account for technology constraints and data usage considerations"
        }
      ]
    }

    return NextResponse.json({ 
      success: true,
      suggestions: suggestions.slice(0, 5), // Ensure only 5 suggestions
      persona_name: persona.name
    })

  } catch (error) {
    console.error('Error generating inclusivity suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
