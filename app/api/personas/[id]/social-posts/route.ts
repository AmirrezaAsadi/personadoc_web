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
    const { productDescription, platforms, campaignGoal, targetAudience, toneOfVoice } = body

    // Get persona data
    const persona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Generate posts for each platform
    const posts = await Promise.all(platforms.map(async (platform: string) => {
      const prompt = createSocialPostPrompt(persona, productDescription, platform, {
        campaignGoal,
        targetAudience,
        toneOfVoice
      })

      // Call AI service (using existing chat endpoint for now)
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/personas/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      })

      const data = await response.json()
      
      // Parse the response to extract content and reasoning
      const responseText = data.response || ''
      const [contentPart, reasoningPart] = responseText.split('REASONING:')
      const content = contentPart.replace('POST:', '').trim()
      const reasoning = reasoningPart?.trim() || 'Generated based on persona traits and preferences'

      // Extract hashtags if present
      const hashtagMatches = content.match(/#\w+/g) || []
      const hashtags = hashtagMatches.map((tag: string) => tag.substring(1))

      return {
        id: `${platform}-${Date.now()}`,
        platform,
        content,
        reasoning,
        hashtags
      }
    }))

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error generating social posts:', error)
    return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 })
  }
}

function createSocialPostPrompt(persona: any, productDescription: string, platform: string, context: any) {
  const behaviorScores = persona.metadata?.personality || {}
  
  const platformGuidelines = {
    instagram: "Visual-focused, use emojis, 1-2 sentences, include relevant hashtags",
    linkedin: "Professional tone, longer format, focus on business value and insights",
    twitter: "Concise (under 280 chars), engaging, can use threads for longer thoughts",
    facebook: "Conversational, can be longer, focus on community and discussion"
  }

  return `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} with the following traits:

PERSONALITY: ${persona.personalityTraits?.join(', ') || 'Not specified'}
INTERESTS: ${persona.interests?.join(', ') || 'Not specified'}
BEHAVIORAL TRAITS:
- Tech Savvy: ${behaviorScores.techSavvy || 5}/10
- Socialness: ${behaviorScores.socialness || 5}/10
- Creativity: ${behaviorScores.creativity || 5}/10

BACKGROUND: ${persona.introduction}

Create a ${platform} post about: ${productDescription}

CONTEXT:
- Campaign Goal: ${context.campaignGoal || 'General awareness'}
- Target Audience: ${context.targetAudience || 'General audience'}
- Tone of Voice: ${context.toneOfVoice || 'Natural'}

PLATFORM GUIDELINES: ${platformGuidelines[platform as keyof typeof platformGuidelines]}

Write as ${persona.name} would naturally post on ${platform}, incorporating your personality and communication style. Be authentic and engaging.

Format your response as:
POST: [Your social media post content]
REASONING: [Brief explanation of why you wrote it this way based on your personality and the platform]`
}
