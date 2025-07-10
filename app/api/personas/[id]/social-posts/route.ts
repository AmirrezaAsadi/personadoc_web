import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Declare variables in outer scope so they're available in catch block
  let product = 'a product'
  let platform = 'social media'
  let goals = 'engagement'
  let tone = 'friendly'
  let targetAudience = 'general audience'
  let persona: any = null
  let interests: string[] = []
  let personalityTraits: string[] = []

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const requestData = await request.json()
    
    // Override default values with request data
    product = requestData.product || product
    platform = requestData.platform || platform
    goals = requestData.goals || goals
    tone = requestData.tone || tone
    targetAudience = requestData.targetAudience || targetAudience

    // Get the persona with metadata
    persona = await prisma.persona.findUnique({
      where: { id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Parse metadata to get persona details
    const personaWithMetadata = persona as any
    const metadata = typeof personaWithMetadata.metadata === 'string' 
      ? JSON.parse(personaWithMetadata.metadata) 
      : personaWithMetadata.metadata || {}

    // Safe parsing of JSON fields - assign to outer scope variables
    personalityTraits = Array.isArray(persona.personalityTraits) 
      ? persona.personalityTraits as string[]
      : persona.personalityTraits 
        ? (Array.isArray((persona.personalityTraits as unknown)) ? (persona.personalityTraits as unknown as string[]) : [])
        : []
    
    interests = Array.isArray(persona.interests) 
      ? persona.interests as string[]
      : persona.interests 
        ? (Array.isArray((persona.interests as unknown)) ? (persona.interests as unknown as string[]) : [])
        : []

    // Create enhanced prompt for social posts
    const prompt = `You are ${persona.name}, a ${metadata.demographics?.age || persona.age || 'adult'}-year-old ${metadata.demographics?.occupation || persona.occupation} living in ${metadata.demographics?.location || persona.location}.

PERSONALITY TRAITS: ${metadata.personality?.traits?.join(', ') || personalityTraits.join(', ') || 'creative, authentic'}
INTERESTS: ${metadata.personality?.interests?.join(', ') || interests.join(', ') || 'technology, lifestyle'}

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

    // Call Grok API with the correct model name
    const response = await fetch(process.env.OPENAI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-0709', // Using the correct model name
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
      const errorText = await response.text()
      console.error('Grok API Error Response:', errorText)
      throw new Error(`Grok API error: ${response.status} - ${errorText}`)
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
    
    // Fallback response if API fails - all variables are now in scope
    const fallbackPosts = {
      posts: [
        {
          content: `Just discovered ${product}! As ${persona?.name || 'someone'}, I'm really excited about how this aligns with my interests in ${interests.slice(0, 2).join(' and ') || 'various topics'}. ${platform === 'instagram' ? '✨ #discover #excited' : platform === 'linkedin' ? 'Sharing my thoughts on this innovation.' : 'What do you think? 🤔'} ${platform === 'twitter' ? '#innovation' : ''}`,
          reasoning: `This post reflects ${persona?.name || 'the persona'}'s personality and interests while maintaining an authentic voice for ${platform}.`,
          engagement_prediction: "medium",
          platform_optimization: `Tailored for ${platform} with appropriate tone and hashtags`
        },
        {
          content: `Real talk: ${product} just changed my perspective. ${platform === 'linkedin' ? 'Here\'s what I learned and how it might impact others in my field.' : platform === 'instagram' ? 'Swipe to see my honest review! 📱' : 'Anyone else tried this?'} ${platform === 'instagram' ? '#honest #review #gamechanging' : platform === 'linkedin' ? '#innovation #growth' : '#thoughts'}`,
          reasoning: `Opens with casual language that builds connection, which fits ${persona?.name || 'the persona'}'s communication style.`,
          engagement_prediction: "high",
          platform_optimization: `Uses ${platform}-specific format and engagement techniques`
        },
        {
          content: `${platform === 'linkedin' ? 'After testing' : 'Tried'} ${product} and I have to say - this is exactly what I've been looking for! ${platform === 'linkedin' ? 'The impact on productivity has been remarkable.' : platform === 'instagram' ? 'Love how it fits into my daily routine! 💯' : 'Highly recommend checking it out'} ${platform === 'instagram' ? '#productivity #dailyroutine #recommended' : platform === 'linkedin' ? '#productivity #efficiency' : '#recommend'}`,
          reasoning: `Emphasizes personal experience and benefits, which resonates with ${persona?.name || 'the persona'}'s value-driven approach.`,
          engagement_prediction: "medium",
          platform_optimization: `Balances personal experience with ${platform} best practices`
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: fallbackPosts,
      persona: {
        name: persona?.name || 'Unknown',
        platform,
        goals,
        tone
      },
      fallback: true,
      error: 'API temporarily unavailable, using fallback content'
    })
  }
}
