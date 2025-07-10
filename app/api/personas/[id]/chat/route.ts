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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()
    const { id } = await params
    
    const persona = await prisma.persona.findUnique({
      where: { 
        id,
        createdBy: session.user.id // Ensure the persona belongs to the authenticated user
      },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    const prompt = `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} from ${persona.location}.

Your personality: ${Array.isArray(persona.personalityTraits) ? persona.personalityTraits.join(', ') : 'Friendly and helpful'}
Your interests: ${Array.isArray(persona.interests) ? persona.interests.join(', ') : 'Various topics'}
Background: ${persona.introduction || 'I enjoy conversations and helping people'}

Respond as ${persona.name} would. Keep it conversational and under 150 words.

User: ${message}`

    const completion = await grok.chat.completions.create({
      model: "grok-4-0709",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."

    // Create interaction record for the authenticated user
    await prisma.interaction.create({
      data: {
        personaId: id,
        userId: session.user.id,
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
