import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(personas)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const persona = await prisma.persona.create({
      data: {
        name: body.name,
        age: body.age,
        occupation: body.occupation,
        location: body.location,
        introduction: body.introduction,
        personalityTraits: body.personalityTraits || [],
        interests: body.interests || [],
        gadgets: body.gadgets || [],
        createdBy: 'user-1',
      },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
  }
}
