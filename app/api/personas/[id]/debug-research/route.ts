import { NextRequest, NextResponse } from 'next/server'
import { researchRAG } from '@/lib/research-rag'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Test search with a broad query to see what's in Pinecone
    const results = await researchRAG.searchResearchContent(id, 'research data test', 10)
    
    return NextResponse.json({
      personaId: id,
      searchResults: results,
      resultCount: results.length,
      message: results.length > 0 ? 'Data found in Pinecone' : 'No data found in Pinecone'
    })
  } catch (error) {
    console.error('Debug search error:', error)
    return NextResponse.json({ 
      error: 'Debug search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
