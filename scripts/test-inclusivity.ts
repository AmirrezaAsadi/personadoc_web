// Test script to verify inclusivity suggestions functionality
import { prisma } from '../lib/prisma'

async function testInclusivityFeature() {
  console.log('🧪 Testing Inclusivity Features...')

  try {
    // Find first persona to test with
    const testPersona = await prisma.persona.findFirst({
      include: {
        creator: true
      }
    })

    if (!testPersona) {
      console.log('❌ No personas found to test with')
      return
    }

    console.log(`✅ Found test persona: ${testPersona.name}`)
    console.log(`📊 Current inclusivity attributes:`, testPersona.inclusivityAttributes)
    console.log(`📝 Applied suggestions:`, testPersona.appliedSuggestions)

    // Test updating persona with inclusivity data
    const sampleInclusivityData = {
      accessibility: ['Color blind', 'Hearing impaired'],
      identity: ['Non-binary'],
      culture: ['Bilingual speaker'],
      economic: ['Low income']
    }

    const sampleAppliedSuggestion = {
      label: 'Test Suggestion',
      icon_type: 'accessibility',
      description: 'Test inclusivity suggestion',
      appliedAt: new Date().toISOString(),
      version: '1.0'
    }

    await prisma.persona.update({
      where: { id: testPersona.id },
      data: {
        inclusivityAttributes: sampleInclusivityData,
        appliedSuggestions: [sampleAppliedSuggestion]
      }
    })

    console.log('✅ Successfully updated persona with inclusivity data')

    // Verify the update
    const updatedPersona = await prisma.persona.findUnique({
      where: { id: testPersona.id }
    })

    console.log(`✅ Verified inclusivity attributes:`, updatedPersona?.inclusivityAttributes)
    console.log(`✅ Verified applied suggestions:`, updatedPersona?.appliedSuggestions)

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testInclusivityFeature()
