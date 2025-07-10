import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { scenario, persona } = body

    // Get full persona data
    const fullPersona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!fullPersona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Generate journey narrative
    const prompt = createJourneyPrompt(fullPersona, scenario)

    // Call AI service (using existing chat endpoint for now)
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/personas/${id}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    })

    const data = await response.json()
    
    // Parse the journey steps from the response
    const journeySteps = parseJourneyResponse(data.response || '')

    return NextResponse.json({ journeySteps })
  } catch (error) {
    console.error('Error generating narrative:', error)
    return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 })
  }
}

function createJourneyPrompt(persona: any, scenario: any) {
  const behaviorScores = persona.metadata?.personality || {}
  
  return `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} with these characteristics:

PERSONALITY: ${persona.personalityTraits?.join(', ') || 'Not specified'}
INTERESTS: ${persona.interests?.join(', ') || 'Not specified'}
BEHAVIORAL TRAITS:
- Tech Savvy: ${behaviorScores.techSavvy || 5}/10
- Socialness: ${behaviorScores.socialness || 5}/10
- Creativity: ${behaviorScores.creativity || 5}/10
- Organization: ${behaviorScores.organization || 5}/10
- Risk Taking: ${behaviorScores.riskTaking || 5}/10
- Adaptability: ${behaviorScores.adaptability || 5}/10

BACKGROUND: ${persona.introduction}

SCENARIO: You are experiencing this journey:
- WHERE: ${scenario.where}
- HOW: ${scenario.how}
- WITH WHO: ${scenario.withWho}
- WHEN: ${scenario.when}
- WHY: ${scenario.why}

Create a detailed journey map with 4-6 steps showing how you would experience this scenario. For each step, include:
1. What happens
2. Your emotional state (use emojis: 😊 happy, 😐 neutral, 😟 concerned, 😤 frustrated, 😡 angry, 🤔 confused, 😍 delighted)
3. Key decision points
4. Your internal thoughts

Format your response as:
STEP 1: [Title]
DESCRIPTION: [What happens in this step]
EMOTION: [Emoji representing your emotional state]
DECISIONS: [Key decisions you face, separated by |]
THOUGHTS: [Your internal thoughts and reasoning]

STEP 2: [Title]
DESCRIPTION: [What happens in this step]
EMOTION: [Emoji representing your emotional state]
DECISIONS: [Key decisions you face, separated by |]
THOUGHTS: [Your internal thoughts and reasoning]

Continue for all steps...`
}

function parseJourneyResponse(response: string) {
  const steps: any[] = []
  const stepMatches = response.match(/STEP \d+:[\s\S]*?(?=STEP \d+:|$)/g) || []
  
  stepMatches.forEach((stepText, index) => {
    const titleMatch = stepText.match(/STEP \d+: (.+)/)
    const descriptionMatch = stepText.match(/DESCRIPTION: ([\s\S]*?)(?=EMOTION:|$)/)
    const emotionMatch = stepText.match(/EMOTION: (.)/)
    const decisionsMatch = stepText.match(/DECISIONS: ([\s\S]*?)(?=THOUGHTS:|$)/)
    const thoughtsMatch = stepText.match(/THOUGHTS: ([\s\S]*?)$/)

    if (titleMatch) {
      steps.push({
        id: `step-${index + 1}`,
        title: titleMatch[1].trim(),
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        emotion: emotionMatch ? emotionMatch[1] : '😐',
        decisionPoints: decisionsMatch ? decisionsMatch[1].split('|').map((d: string) => d.trim()).filter(Boolean) : [],
        personaThoughts: thoughtsMatch ? thoughtsMatch[1].trim() : ''
      })
    }
  })

  // If parsing fails, create a default structure
  if (steps.length === 0) {
    return [
      {
        id: 'step-1',
        title: 'Journey Generated',
        description: 'The AI has generated a response, but it may not be in the expected format.',
        emotion: '🤔',
        decisionPoints: ['Review the generated content'],
        personaThoughts: response.substring(0, 200) + '...'
      }
    ]
  }

  return steps
}
