import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging Pinecone connection...')
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY not found')
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    })

    // List all indexes
    console.log('📋 Listing all Pinecone indexes...')
    const indexes = await pinecone.listIndexes()
    console.log('🏷️ Available indexes:', indexes.indexes?.map(i => i.name))

    // Check if our index exists
    const indexName = 'personadoc-research'
    const targetIndex = indexes.indexes?.find(i => i.name === indexName)
    
    if (!targetIndex) {
      return NextResponse.json({
        error: 'Index not found',
        indexName,
        availableIndexes: indexes.indexes?.map(i => i.name) || [],
        suggestion: 'Index might need to be created',
        apiKeyPrefix: process.env.PINECONE_API_KEY.substring(0, 10) + '...'
      })
    }

    // Get index stats
    const index = pinecone.index(indexName)
    const stats = await index.describeIndexStats()
    console.log('📊 Index statistics:', stats)

    // Try to query for any vectors
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0.1), // Dummy vector
      topK: 10,
      includeMetadata: true
    })

    return NextResponse.json({
      success: true,
      indexName,
      indexExists: true,
      stats,
      totalVectors: stats.totalRecordCount || 0,
      sampleVectors: queryResponse.matches?.length || 0,
      vectors: queryResponse.matches?.map(m => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata
      })) || [],
      apiKeyStatus: 'Connected'
    })

  } catch (error) {
    console.error('❌ Pinecone debug failed:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
