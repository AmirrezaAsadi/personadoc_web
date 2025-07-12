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

    // Parse metadata for enhanced context
    let metadata: any = {}
    try {
      metadata = typeof (persona as any).metadata === 'string' 
        ? JSON.parse((persona as any).metadata) 
        : (persona as any).metadata || {}
    } catch (error) {
      metadata = {}
    }

    // Build the AI prompt for inclusivity suggestions
    const systemPrompt = `You are an expert in inclusive design and persona research. Your role is to analyze personas and suggest improvements that make them more inclusive and representative of diverse user experiences.

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

TASK: Generate 3 specific, actionable inclusivity suggestions that would help make this persona more representative and inclusive. Focus on aspects that are missing or could be enhanced.

Consider these dimensions:
- Economic diversity (income levels, employment situations, financial circumstances)
- Accessibility needs (physical, cognitive, sensory differences)
- Cultural backgrounds (ethnicity, immigration status, language preferences)
- Gender identity and expression (beyond binary assumptions)
- Digital literacy levels (varying tech comfort and access)
- Family structures (non-traditional arrangements, caregiving responsibilities)
- Geographic contexts (rural vs urban, regional differences)
- Life circumstances (chronic conditions, temporary situations, major life events)

For each suggestion, provide:
1. CATEGORY: The inclusivity dimension being addressed
2. SUGGESTION: A specific, research-backed suggestion 
3. IMPACT: How this would improve the persona's usefulness
4. RESEARCH_PROMPT: A question to guide further research

Respond with a JSON array of exactly 3 suggestions in this format:
[
  {
    "category": "string",
    "suggestion": "string", 
    "impact": "string",
    "research_prompt": "string"
  }
]

Focus on genuine gaps in representation that would meaningfully improve product design decisions.`

    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: `Please analyze this persona and provide 3 specific inclusivity suggestions that would make it more representative and useful for inclusive design.`
      }
    ]

    // Call AI to generate suggestions
    const response = await grok.chat.completions.create({
      model: "grok-beta",
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
          category: "AI Response Error",
          suggestion: "Unable to parse AI suggestions. Please try again.",
          impact: "N/A",
          research_prompt: "Review AI response format"
        }]
      }
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error)
      // Fallback suggestions if AI parsing fails
      suggestions = [
        {
          category: "Economic Diversity",
          suggestion: "Consider different income levels and how they might affect technology access and usage patterns.",
          impact: "Better understanding of affordability constraints and value-driven decisions",
          research_prompt: "How might budget constraints influence this persona's technology choices and usage patterns?"
        },
        {
          category: "Accessibility",
          suggestion: "Explore potential accessibility needs that might influence interaction preferences.",
          impact: "Ensures design considers various ability levels and assistive technologies",
          research_prompt: "What accessibility considerations might affect how this persona interacts with technology?"
        },
        {
          category: "Cultural Context",
          suggestion: "Examine cultural background and how it shapes communication styles and preferences.",
          impact: "Creates more culturally aware and inclusive design decisions",
          research_prompt: "How might cultural background influence this persona's expectations and communication preferences?"
        }
      ]
    }

    return NextResponse.json({ 
      success: true,
      suggestions: suggestions.slice(0, 3), // Ensure only 3 suggestions
      persona_name: persona.name
    })

  } catch (error) {
    console.error('Error generating inclusivity suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
