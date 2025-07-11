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

    // Get persona data
    const persona = await prisma.persona.findFirst({
      where: { id: id },
    })

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 })
    }

    // AI-powered connection suggestions based on persona traits
    const suggestions = generateConnectionSuggestions(persona)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

function generateConnectionSuggestions(persona: any) {
  const suggestions = []
  
  // Generate suggestions based on occupation
  if (persona.occupation?.toLowerCase().includes('developer') || persona.occupation?.toLowerCase().includes('engineer')) {
    suggestions.push(
      { name: 'Tech Lead Sarah', type: 'professional', description: 'Senior developer at tech company', strength: 7, influence: 6 },
      { name: 'Startup Founder Mike', type: 'professional', description: 'Entrepreneur in tech space', strength: 5, influence: 8 },
      { name: 'Developer Community', type: 'online', description: 'Active in coding forums and meetups', strength: 6, influence: 5 }
    )
  }
  
  if (persona.occupation?.toLowerCase().includes('marketing')) {
    suggestions.push(
      { name: 'Marketing Director Lisa', type: 'professional', description: 'Experienced marketing professional', strength: 8, influence: 7 },
      { name: 'Creative Agency Team', type: 'professional', description: 'Collaborative creative partners', strength: 6, influence: 6 },
      { name: 'Industry Influencer', type: 'online', description: 'Marketing thought leader on social media', strength: 4, influence: 9 }
    )
  }

  // Generate suggestions based on personality traits
  const traits = persona.personalityTraits || []
  
  if (traits.includes('Social') || traits.includes('Outgoing')) {
    suggestions.push(
      { name: 'College Best Friend Alex', type: 'friend', description: 'Long-time friend who shares social interests', strength: 9, influence: 7 },
      { name: 'Social Club Members', type: 'community', description: 'Local social group or hobby club', strength: 7, influence: 5 }
    )
  }
  
  if (traits.includes('Creative') || traits.includes('Artistic')) {
    suggestions.push(
      { name: 'Art Class Instructor', type: 'friend', description: 'Creative mentor and friend', strength: 6, influence: 8 },
      { name: 'Creative Community', type: 'community', description: 'Local artists and makers group', strength: 7, influence: 6 }
    )
  }

  // Universal suggestions based on age and life stage
  suggestions.push(
    { name: 'Close Family Member', type: 'family', description: 'Parent, sibling, or spouse with strong influence', strength: 10, influence: 9 },
    { name: 'Childhood Friend', type: 'friend', description: 'Long-standing friendship from early years', strength: 8, influence: 6 },
    { name: 'Neighbor Community', type: 'community', description: 'Local neighborhood connections', strength: 5, influence: 4 }
  )

  // Location-based suggestions
  if (persona.location) {
    suggestions.push(
      { name: `${persona.location} Professional Network`, type: 'professional', description: `Professional connections in ${persona.location}`, strength: 6, influence: 6 },
      { name: `Local ${persona.location} Group`, type: 'community', description: `Community group in ${persona.location}`, strength: 5, influence: 4 }
    )
  }

  // Return top 6 most relevant suggestions
  return suggestions.slice(0, 6)
}
