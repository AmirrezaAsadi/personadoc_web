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

    // Generate journey narrative using OpenAI
    const journeySteps = await generateJourneyWithOpenAI(fullPersona, scenario)

    return NextResponse.json({ journeySteps })
  } catch (error) {
    console.error('Error generating narrative:', error)
    return NextResponse.json({ error: 'Failed to generate narrative' }, { status: 500 })
  }
}

async function generateJourneyWithOpenAI(persona: any, scenario: any) {
  try {
    const prompt = createEnhancedJourneyPrompt(persona, scenario)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert UX researcher creating detailed customer journey maps. Generate structured, realistic journey steps with clear emotions and decision points.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    // Try to parse the structured response
    let journeySteps = parseJourneyResponse(aiResponse)
    
    // If parsing fails, generate fallback steps
    if (journeySteps.length === 0) {
      journeySteps = generateFallbackJourney(persona, scenario)
    }

    return journeySteps
  } catch (error) {
    console.error('OpenAI error:', error)
    // Return fallback journey on error
    return generateFallbackJourney(persona, scenario)
  }
}

function createEnhancedJourneyPrompt(persona: any, scenario: any) {
  const behaviorScores = persona.metadata?.personality || {}
  
  return `Create a detailed customer journey map for ${persona.name} in this scenario:

PERSONA DETAILS:
- Name: ${persona.name}
- Age: ${persona.age}
- Occupation: ${persona.occupation}
- Background: ${persona.introduction}
- Personality: ${persona.personalityTraits?.join(', ') || 'Not specified'}
- Interests: ${persona.interests?.join(', ') || 'Not specified'}

BEHAVIORAL SCORES:
- Tech Savvy: ${behaviorScores.techSavvy || 5}/10
- Social: ${behaviorScores.socialness || 5}/10
- Creative: ${behaviorScores.creativity || 5}/10
- Organized: ${behaviorScores.organization || 5}/10
- Risk Taking: ${behaviorScores.riskTaking || 5}/10
- Adaptable: ${behaviorScores.adaptability || 5}/10

SCENARIO:
- Context: ${scenario.where}
- Method: ${scenario.how}
- Companions: ${scenario.withWho}
- Timing: ${scenario.when}
- Goal: ${scenario.why}

Generate a journey map with 4-6 realistic steps that show how ${persona.name} would experience this scenario. Consider their personality traits and behavioral scores.

For each step, provide:
1. A clear step title
2. What specifically happens
3. An appropriate emotion emoji (😊😐😟😤😡🤔😍)
4. Key decision points they face
5. Their internal thoughts

Format each step exactly like this:

STEP 1: [Clear step title]
DESCRIPTION: [Detailed description of what happens]
EMOTION: [Single emoji]
DECISIONS: [Decision 1|Decision 2|Decision 3]
THOUGHTS: [Their internal monologue and reasoning]

STEP 2: [Clear step title]
DESCRIPTION: [Detailed description of what happens]
EMOTION: [Single emoji]
DECISIONS: [Decision 1|Decision 2|Decision 3]
THOUGHTS: [Their internal monologue and reasoning]

Continue for all steps. Make sure each step flows logically to the next and reflects ${persona.name}'s unique perspective.`
}

function generateFallbackJourney(persona: any, scenario: any) {
  const steps = [
    {
      id: 'step-1',
      title: `${persona.name} Starts the Journey`,
      description: `${persona.name} begins their experience with ${scenario.why} at ${scenario.where}. They ${scenario.how} ${scenario.withWho !== 'Alone' ? `with ${scenario.withWho}` : 'by themselves'}.`,
      emotion: '🤔',
      decisionPoints: [
        'Choose the best approach',
        'Consider available options',
        'Plan the next steps'
      ],
      personaThoughts: `I need to ${scenario.why}. Let me think about the best way to approach this given my current situation.`
    },
    {
      id: 'step-2',
      title: 'Initial Exploration',
      description: `${persona.name} explores the available options and starts to understand what's involved in achieving their goal.`,
      emotion: '😐',
      decisionPoints: [
        'Evaluate different choices',
        'Compare options',
        'Seek more information'
      ],
      personaThoughts: 'There are several ways I could do this. I need to weigh the pros and cons carefully.'
    },
    {
      id: 'step-3',
      title: 'Decision Making',
      description: `Based on their personality and preferences, ${persona.name} makes key decisions about how to proceed.`,
      emotion: '😊',
      decisionPoints: [
        'Choose the preferred method',
        'Commit to a course of action',
        'Prepare for implementation'
      ],
      personaThoughts: 'This feels like the right choice for me. It aligns with my values and capabilities.'
    },
    {
      id: 'step-4',
      title: 'Taking Action',
      description: `${persona.name} implements their chosen approach, drawing on their experience and skills.`,
      emotion: '😊',
      decisionPoints: [
        'Execute the plan',
        'Monitor progress',
        'Adjust if needed'
      ],
      personaThoughts: 'I\'m making good progress. This approach is working well for my situation.'
    },
    {
      id: 'step-5',
      title: 'Completion and Reflection',
      description: `${persona.name} completes their journey and reflects on the experience, considering what they learned.`,
      emotion: '😍',
      decisionPoints: [
        'Evaluate the outcome',
        'Document lessons learned',
        'Plan for future similar situations'
      ],
      personaThoughts: 'That went well! I\'m satisfied with how I handled this and what I accomplished.'
    }
  ]

  return steps
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
