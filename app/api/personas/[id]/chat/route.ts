import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { grok } from '@/lib/grok'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { message } = await request.json()
    const { id } = await params
    
    const persona = await prisma.persona.findUnique({
      where: { id },
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
      model: "grok-beta",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    })

    const response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that."

    // Ensure a default user exists
    const defaultUser = await prisma.user.upsert({
      where: { email: 'default@personadoc.com' },
      update: {},
      create: {
        email: 'default@personadoc.com',
        name: 'Default User',
      },
    })

    await prisma.interaction.create({
      data: {
        personaId: id,
        userId: defaultUser.id,
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
