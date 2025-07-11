import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { grok } from '@/lib/grok'
import { researchRAG } from '@/lib/research-rag'

// Configure runtime and max duration
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for Vercel Pro

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 28000) // 28 second timeout
  
  try {
    console.log('=== CHAT API START ===')
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Session found:', session.user.email)

    const { message, conversationHistory } = await request.json()
    const { id } = await params
    
    console.log('📩 Message:', message)
    console.log('🆔 Persona ID:', id)
    
    // Get user ID (handle both credentials and OAuth providers)
    let userId = (session.user as any).id
    if (!userId && session.user.email) {
      console.log('🔍 Looking up user by email...')
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      console.log('❌ User ID not found')
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    console.log('✅ User ID:', userId)
    
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: userId // Ensure the persona belongs to the authenticated user
      },
    })

    if (!persona) {
      console.log('❌ Persona not found for user')
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    console.log('✅ Persona found:', persona.name)

    // Parse metadata for enhanced personality info
    const personaWithMetadata = persona as any // Cast to access metadata field
    let metadata: any = {}
    try {
      metadata = typeof personaWithMetadata.metadata === 'string' 
        ? JSON.parse(personaWithMetadata.metadata) 
        : personaWithMetadata.metadata || {}
      console.log('✅ Metadata parsed successfully')
    } catch (error) {
      console.log('⚠️ Failed to parse metadata:', error)
      metadata = {}
    }

    // Build conversation messages for context
    const conversationMessages: any[] = []
    
    // System message with persona context
    const baseSystemPrompt = `You are ${persona.name}, a ${metadata.demographics?.age || persona.age || 'adult'}-year-old ${metadata.demographics?.occupation || persona.occupation} living in ${metadata.demographics?.location || persona.location}.

PERSONALITY TRAITS: ${metadata.personality?.traits?.join(', ') || (Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Friendly and helpful')}
INTERESTS: ${metadata.personality?.interests?.join(', ') || (Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Various topics')}
BEHAVIORAL SCORES:
- Tech Savvy: ${metadata.personality?.behaviorScores?.techSavvy || 7}/10
- Socialness: ${metadata.personality?.behaviorScores?.socialness || 6}/10
- Creativity: ${metadata.personality?.behaviorScores?.creativity || 8}/10

BACKGROUND: ${persona.introduction || 'I enjoy conversations and helping people'}

Respond naturally as ${persona.name}, incorporating your personality and background. Keep responses conversational and authentic. Be concise but helpful.

Format your response as:
RESPONSE: [Your natural response as ${persona.name}]
REASONING: [Brief explanation of why you responded this way based on your personality]`

    conversationMessages.push({
      role: "system" as const,
      content: baseSystemPrompt
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

    // Search relevant research content using RAG with timeout
    let researchContext = ''
    try {
      console.log('Starting RAG search...')
      const ragPromise = researchRAG.searchResearchContent(id, message, 3)
      const timeoutPromise = new Promise<string[]>((_, reject) => 
        setTimeout(() => reject(new Error('RAG search timeout')), 15000)
      )
      
      const relevantContent = await Promise.race([ragPromise, timeoutPromise])
      if (relevantContent.length > 0) {
        researchContext = `\n\nRELEVANT RESEARCH CONTEXT:\n${relevantContent.join('\n\n')}`
        console.log('RAG search completed successfully')
      }
    } catch (error) {
      console.error('Error searching research content (continuing without RAG):', error)
      // Continue without RAG context rather than failing
    }

    // Add research context to the system message if found
    if (researchContext) {
      conversationMessages[0].content += researchContext
    }

    console.log('🤖 Calling Grok API...')
    let response: string
    
    try {
      // Create a timeout specifically for Grok API
      const grokPromise = grok.chat.completions.create({
        model: "grok-4-0709",
        messages: conversationMessages,
        max_tokens: 300, // Reduced for faster response
        temperature: 0.8,
      }, {
        signal: controller.signal
      })
      
      const grokTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Grok API timeout')), 20000) // 20 second timeout for Grok specifically
      )
      
      const completion = await Promise.race([grokPromise, grokTimeoutPromise]) as any

      response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."
      console.log('✅ Grok API response received')
    } catch (grokError) {
      console.error('❌ Grok API error:', grokError)
      
      // Provide a fallback response when Grok fails
      response = `RESPONSE: Hello! I'm ${persona.name}. I'm having some connectivity issues right now, but I'm here and would love to chat with you. Could you try asking me that again?

REASONING: As ${persona.name}, I want to stay positive and helpful even when experiencing technical difficulties, maintaining my personality while being honest about the issue.`
    }

    clearTimeout(timeoutId)

    // Create interaction record for the authenticated user (async, don't wait)
    prisma.interaction.create({
      data: {
        personaId: id,
        userId: userId,
        content: message,
        response: response,
      },
    }).catch(error => console.error('⚠️ Failed to save interaction:', error))

    console.log('=== CHAT API SUCCESS ===')
    return NextResponse.json({ response })
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('❌ Chat error:', error)
    
    // Return different error messages based on the error type
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      console.log('⏰ Request timed out')
      return NextResponse.json({ 
        error: 'The AI is taking longer than usual to respond. Please try again with a shorter message or switch to Simple mode.' 
      }, { status: 408 })
    }
    
    console.log('💥 General error occurred')
    return NextResponse.json({ 
      error: 'I apologize, but I encountered an error while processing your message. Please try again or switch to Simple mode.' 
    }, { status: 500 })
  }
}
