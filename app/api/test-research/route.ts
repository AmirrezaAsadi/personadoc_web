import { NextRequest, NextResponse } from 'next/server'
import { researchRAG } from '@/lib/research-rag'

export async function POST(request: NextRequest) {
  try {
    const { personaId, testData } = await request.json()
    
    if (!personaId) {
      return NextResponse.json({ error: 'personaId required' }, { status: 400 })
    }

    console.log('🧪 Testing research processing for persona:', personaId)
    
    // Test research data
    const researchData = testData || {
      manualKnowledge: "This persona loves outdoor activities and hiking. They prefer sustainable products and care deeply about environmental issues. They are tech-savvy but prefer simple, intuitive interfaces.",
      uploadedFiles: []
    }

    console.log('📋 Test research data:', researchData)
    
    // Process the research
    const result = await researchRAG.processPersonaResearch(personaId, researchData)
    
    return NextResponse.json({
      success: true,
      message: 'Research data processed successfully',
      personaId,
      chunksProcessed: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Research processing test failed:', error)
    return NextResponse.json({
      error: 'Research processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    }, { status: 500 })
  }
}
