import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { product, platform, goals, tone, targetAudience } = await request.json()

    // Get the persona with metadata
    const persona = await prisma.persona.findUnique({
      where: { id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Parse metadata to get persona details
    const personaWithMetadata = persona as any // Cast to avoid TypeScript issues
    const metadata = typeof personaWithMetadata.metadata === 'string' 
      ? JSON.parse(personaWithMetadata.metadata) 
      : personaWithMetadata.metadata || {}

    // Safe parsing of JSON fields
    const personalityTraits = Array.isArray(persona.personalityTraits) 
      ? persona.personalityTraits as string[]
      : persona.personalityTraits 
        ? (Array.isArray((persona.personalityTraits as unknown)) ? (persona.personalityTraits as unknown as string[]) : [])
        : []
    
    const interests = Array.isArray(persona.interests) 
      ? persona.interests as string[]
      : persona.interests 
        ? (Array.isArray((persona.interests as unknown)) ? (persona.interests as unknown as string[]) : [])
        : []

    // Create enhanced prompt for social posts
    const prompt = `You are ${persona.name}, a ${metadata.demographics?.age || persona.age || 'adult'}-year-old ${metadata.demographics?.occupation || persona.occupation} living in ${metadata.demographics?.location || persona.location}.

PERSONALITY TRAITS: ${metadata.personality?.traits?.join(', ') || personalityTraits.join(', ') || 'creative, authentic'}
INTERESTS: ${metadata.personality?.interests?.join(', ') || interests.join(', ') || 'technology, lifestyle'}
BEHAVIORAL SCORES:
- Tech Savvy: ${metadata.personality?.behaviorScores?.techSavvy || 7}/10
- Socialness: ${metadata.personality?.behaviorScores?.socialness || 6}/10
- Creativity: ${metadata.personality?.behaviorScores?.creativity || 8}/10

COMMUNICATION STYLE: ${metadata.technology?.communicationPreferences?.join(', ') || 'authentic, engaging'}

Task: Create a ${platform} post about "${product}" from your perspective as ${persona.name}.

Campaign Goals: ${goals}
Target Audience: ${targetAudience}
Tone: ${tone}

Requirements:
1. Write in first person as ${persona.name}
2. Reflect your personality traits and interests
3. Use language and style appropriate for ${platform}
4. Include relevant hashtags for ${platform}
5. Make it authentic to your character

Generate 3 different post variations, each with a brief explanation of why this approach fits your personality.

Format your response as JSON:
{
  "posts": [
    {
      "content": "post content with hashtags",
      "reasoning": "why this post fits the persona",
      "engagement_prediction": "high/medium/low",
      "platform_optimization": "platform-specific notes"
    }
  ]
}`

    // Call Grok API
    const response = await fetch(process.env.OPENAI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert helping personas create authentic posts. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`)
    }

    const data = await response.json()
    let socialPosts

    try {
      // Try to parse JSON response
      const content = data.choices[0]?.message?.content
      socialPosts = JSON.parse(content)
    } catch (parseError) {
      // Fallback if not proper JSON
      const content = data.choices[0]?.message?.content
      socialPosts = {
        posts: [{
          content: content,
          reasoning: "Generated from persona perspective",
          engagement_prediction: "medium",
          platform_optimization: `Optimized for ${platform}`
        }]
      }
    }

    return NextResponse.json({
      success: true,
      data: socialPosts,
      persona: {
        name: persona.name,
        platform,
        goals,
        tone
      }
    })

  } catch (error) {
    console.error('Social posts generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate social posts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
