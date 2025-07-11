import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { grok } from '@/lib/grok'

// Simple chat endpoint without RAG for faster responses
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

    // Parse metadata
    const personaWithMetadata = persona as any
    const metadata = typeof personaWithMetadata.metadata === 'string' 
      ? JSON.parse(personaWithMetadata.metadata) 
      : personaWithMetadata.metadata || {}

    // Build conversation messages
    const conversationMessages: any[] = []
    
    // Simple system prompt without RAG
    const systemPrompt = `You are ${persona.name}, a ${metadata.demographics?.age || persona.age || 'adult'}-year-old ${metadata.demographics?.occupation || persona.occupation} living in ${metadata.demographics?.location || persona.location}.

PERSONALITY: ${Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Friendly and helpful'}
INTERESTS: ${Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Various topics'}
BACKGROUND: ${persona.introduction || 'I enjoy conversations and helping people'}

Respond naturally as ${persona.name}. Keep responses conversational, authentic, and concise.

Format your response as:
RESPONSE: [Your natural response as ${persona.name}]
REASONING: [Brief explanation of why you responded this way]`

    conversationMessages.push({
      role: "system" as const,
      content: systemPrompt
    })

    // Add recent conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-5) // Limit to 5 recent messages
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

    console.log('Calling Grok API (simple mode)...')
    const completion = await grok.chat.completions.create({
      model: "grok-4-0709",
      messages: conversationMessages,
      max_tokens: 250,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."
    console.log('Grok API response received (simple mode)')

    // Save interaction (don't wait)
    prisma.interaction.create({
      data: {
        personaId: id,
        userId: userId,
        content: message,
        response: response,
      },
    }).catch(error => console.error('Failed to save interaction:', error))

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Simple chat error:', error)
    return NextResponse.json({ 
      error: 'I apologize, but I encountered an error. Please try again.' 
    }, { status: 500 })
  }
}
