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
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationHistory } = await request.json()
    const { id } = await params
    
    // Get user ID (handle both credentials and OAuth providers)
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
        createdBy: userId // Ensure the persona belongs to the authenticated user
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // Parse metadata for enhanced personality info
    const personaWithMetadata = persona as any // Cast to access metadata field
    const metadata = typeof personaWithMetadata.metadata === 'string' 
      ? JSON.parse(personaWithMetadata.metadata) 
      : personaWithMetadata.metadata || {}

    // Build conversation messages for context
    const conversationMessages: any[] = []
    
    // System message with persona context
    const systemPrompt = `You are ${persona.name}, a ${metadata.demographics?.age || persona.age || 'adult'}-year-old ${metadata.demographics?.occupation || persona.occupation} living in ${metadata.demographics?.location || persona.location}.

PERSONALITY TRAITS: ${metadata.personality?.traits?.join(', ') || (Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Friendly and helpful')}
INTERESTS: ${metadata.personality?.interests?.join(', ') || (Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Various topics')}
BEHAVIORAL SCORES:
- Tech Savvy: ${metadata.personality?.behaviorScores?.techSavvy || 7}/10
- Socialness: ${metadata.personality?.behaviorScores?.socialness || 6}/10
- Creativity: ${metadata.personality?.behaviorScores?.creativity || 8}/10

BACKGROUND: ${persona.introduction || 'I enjoy conversations and helping people'}

Respond naturally as ${persona.name}, incorporating your personality and background. Keep responses conversational and authentic. Provide a brief reasoning for your response if appropriate.

Format your response as:
RESPONSE: [Your natural response as ${persona.name}]
REASONING: [Brief explanation of why you responded this way based on your personality]`

    conversationMessages.push({
      role: "system" as const,
      content: systemPrompt
    })

    // Add conversation history for context (last 10 messages)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10)
      recentHistory.forEach((msg: any) => {
        if (msg.type === 'user') {
          conversationMessages.push({
            role: "user" as const,
            content: msg.content
          })
        } else if (msg.type === 'persona') {
          conversationMessages.push({
            role: "assistant" as const,
            content: msg.content
          })
        }
      })
    }

    // Add current user message
    conversationMessages.push({
      role: "user" as const,
      content: message
    })

    const completion = await grok.chat.completions.create({
      model: "grok-4-0709",
      messages: conversationMessages,
      max_tokens: 300,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."

    // Create interaction record for the authenticated user
    await prisma.interaction.create({
      data: {
        personaId: id,
        userId: userId,
        content: message,
        response: response,
      },
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
