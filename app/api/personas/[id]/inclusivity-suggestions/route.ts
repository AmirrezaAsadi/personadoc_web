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

    // Build the AI prompt for enhanced granular inclusivity suggestions
    const systemPrompt = `You are an expert in inclusive design, persona research, and accessibility. Your role is to analyze personas and suggest specific, granular inclusivity enhancements that make personas more diverse and representative.

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

TASK: Generate 5 specific, granular inclusivity suggestions that go beyond surface-level demographics. Focus on behavioral patterns, contextual factors, and detailed accessibility considerations.

GRANULAR INCLUSIVITY DIMENSIONS TO CONSIDER:

ACCESSIBILITY & ABILITY:
- "Uses screen reader daily" - specific assistive technology dependency
- "Chronic fatigue affects scheduling" - energy management patterns
- "Limited fine motor control" - specific physical interaction needs
- "Noise sensitivity in crowds" - sensory processing specifics
- "Memory aids for appointments" - cognitive support strategies
- "Voice control preference" - alternative input methods
- "High contrast display needs" - visual accessibility requirements

SOCIOECONOMIC CONTEXT:
- "Shares phone with family" - device access limitations
- "Public WiFi dependent" - connectivity constraints
- "Biweekly grocery budgeting" - financial planning patterns
- "Second-hand clothing shopper" - economic shopping behaviors
- "No car maintenance budget" - transportation reliability issues
- "Prepaid phone plan limits" - communication constraints
- "Energy bill conscious habits" - resource conservation behaviors

CULTURAL & LINGUISTIC:
- "Code-switches between languages" - multilingual communication patterns
- "Observes Sabbath restrictions" - religious practice implications
- "Extended family decisions" - collective decision-making culture
- "Halal dietary requirements" - specific food restrictions
- "Cash-preferred transactions" - cultural payment preferences
- "Elder consultation tradition" - family hierarchy respect
- "Lunar calendar observer" - alternative time systems

FAMILY & CAREGIVING:
- "School pickup scheduling constraint" - parental time limitations
- "Elder care responsibilities" - multi-generational support duties
- "Special needs sibling support" - family caregiving patterns
- "Single income household stress" - financial pressure dynamics
- "Shift work childcare gaps" - non-traditional schedule challenges
- "Pet medication reminders" - animal care responsibilities
- "Foster parent flexibility needs" - temporary family changes

WORK & LIFESTYLE:
- "Night shift circadian challenges" - sleep schedule disruptions
- "Gig economy income uncertainty" - financial instability patterns
- "Remote work isolation effects" - social connection needs
- "Standing desk necessity" - workplace accommodation requirements
- "Commute time stress factors" - transportation pressure impacts
- "Uniform cleaning expenses" - job-related costs
- "Weekend work social isolation" - non-standard schedule effects

TECHNOLOGY & DIGITAL:
- "Limited data plan behavior" - usage restriction adaptations
- "Older device compatibility" - legacy technology constraints
- "Privacy-focused preferences" - data protection concerns
- "Offline-first app needs" - connectivity independence requirements
- "Voice message preference" - alternative communication methods
- "Dark mode necessity" - visual comfort requirements
- "Notification fatigue management" - attention protection strategies

GEOGRAPHIC & ENVIRONMENTAL:
- "Seasonal depression patterns" - weather-related mental health
- "Rural internet unreliability" - infrastructure limitation impacts
- "Public transport timing dependency" - mobility schedule constraints
- "Air quality health monitoring" - environmental health awareness
- "Limited local service access" - geographic resource scarcity
- "Natural disaster preparedness" - regional risk awareness
- "Urban noise coping strategies" - environmental adaptation needs

For each suggestion, provide:
1. LABEL: Specific, detailed dimension (4-6 words describing exact situation)
2. ICON_TYPE: Choose most relevant category:
   - accessibility (disabilities, assistive tech, sensory needs)
   - identity (gender, sexuality, cultural identity)
   - culture (ethnicity, religion, traditions, language)
   - economic (income, employment, financial constraints)
   - family (caregiving, relationships, household dynamics)
   - health (chronic conditions, mental health, medical needs)
   - education (learning differences, literacy, knowledge gaps)
   - geographic (location impacts, environmental factors)
3. DESCRIPTION: Two detailed sentences explaining the specific behavioral impacts and design considerations

Choose suggestions that:
- Are highly specific and actionable (not general categories)
- Include concrete behavioral patterns and constraints
- Would significantly impact product/service design decisions
- Represent real-world diversity in detailed ways
- Focus on contextual factors and daily life realities
- Avoid stereotyping while addressing authentic experiences
- Are NOT already represented in current persona attributes

Respond with ONLY a JSON array of exactly 5 suggestions in this format:
[
  {
    "label": "Specific detailed situation",
    "icon_type": "category_name", 
    "description": "First sentence explains the specific pattern. Second sentence details design implications."
  }
]`
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: `Please analyze this persona and provide 5 specific, granular inclusivity suggestions that represent detailed behavioral patterns, contextual constraints, and accessibility considerations. Focus on actionable specifics rather than broad categories.`
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
      // Fallback suggestions if AI parsing fails - granular examples
      suggestions = [
        {
          label: "Uses voice control daily",
          icon_type: "accessibility",
          description: "Relies on voice commands due to limited fine motor control. Interface design must prioritize voice navigation and minimize precise touch interactions."
        },
        {
          label: "Shares phone with family",
          icon_type: "economic",
          description: "Device access is limited to specific hours when other family members don't need it. Apps must support quick login/logout and offline functionality."
        },
        {
          label: "Observes Sabbath digital restrictions",
          icon_type: "culture",
          description: "Cannot use digital devices from Friday evening to Saturday evening weekly. Systems need delayed response handling and non-urgent communication options."
        },
        {
          label: "Night shift circadian challenges",
          icon_type: "health",
          description: "Works midnight to 8am shifts causing sleep schedule disruption. Interfaces should minimize bright lights and support alternative active hours."
        },
        {
          label: "Public transit timing dependency",
          icon_type: "geographic",
          description: "Daily schedule is constrained by fixed bus routes with limited frequency. Time-sensitive features must account for transportation delays and gaps."
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
