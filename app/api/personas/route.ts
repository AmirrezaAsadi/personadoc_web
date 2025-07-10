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
    console.error('Database error:', error)
    // Return empty array instead of error object to prevent frontend crash
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Ensure a default user exists
    const defaultUser = await prisma.user.upsert({
      where: { email: 'default@personadoc.com' },
      update: {},
      create: {
        email: 'default@personadoc.com',
        name: 'Default User',
      },
    })
    
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
        createdBy: defaultUser.id,
      },
    })

    return NextResponse.json(persona, { status: 201 })
  } catch (error) {
    console.error('Error creating persona:', error)
    return NextResponse.json({ 
      error: 'Failed to create persona', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
