import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const diagnostics = {
      environment: process.env.NODE_ENV,
      hasOpenAIEmbeddings: !!process.env.OPENAI_EMBEDDINGS_API_KEY,
      hasOpenAIFallback: !!process.env.OPENAI_API_KEY,
      hasPineconeKey: !!process.env.PINECONE_API_KEY,
      openAIEmbeddingsKeyLength: process.env.OPENAI_EMBEDDINGS_API_KEY?.length || 0,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      pineconeKeyLength: process.env.PINECONE_API_KEY?.length || 0,
      pineconeKeyPrefix: process.env.PINECONE_API_KEY?.substring(0, 8) || 'N/A',
      openAIKeyPrefix: (process.env.OPENAI_EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY)?.substring(0, 8) || 'N/A'
    }

    // Test OpenAI connection
    let openAITest = 'Not tested'
    try {
      const OpenAI = require('openai')
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY,
      })
      
      // Simple test - just check if we can create the client
      if (openai) {
        openAITest = 'Client created successfully'
      }
    } catch (error) {
      openAITest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    // Test Pinecone connection
    let pineconeTest = 'Not tested'
    try {
      const { Pinecone } = require('@pinecone-database/pinecone')
      
      if (process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY !== 'your_pinecone_api_key_here') {
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        })
        pineconeTest = 'Client created successfully'
      } else {
        pineconeTest = 'API key not configured'
      }
    } catch (error) {
      pineconeTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json({
      status: 'RAG Diagnostics',
      diagnostics,
      openAITest,
      pineconeTest,
      recommendations: [
        !process.env.OPENAI_EMBEDDINGS_API_KEY && !process.env.OPENAI_API_KEY ? 
          'Set OPENAI_EMBEDDINGS_API_KEY or OPENAI_API_KEY in your environment' : null,
        !process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === 'your_pinecone_api_key_here' ? 
          'Set PINECONE_API_KEY in your environment' : null,
        'Ensure API keys are from the correct providers (OpenAI for embeddings, Pinecone for vector storage)'
      ].filter(Boolean)
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to run diagnostics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
