import OpenAI from 'openai'
import { pinecone, PINECONE_INDEX_NAME, initializePineconeIndex } from './pinecone'
import pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'

// Separate OpenAI client for embeddings (uses real OpenAI API)
if (!process.env.OPENAI_EMBEDDINGS_API_KEY) {
  throw new Error('OPENAI_EMBEDDINGS_API_KEY is required for RAG functionality')
}

const openaiEmbeddings = new OpenAI({
  apiKey: process.env.OPENAI_EMBEDDINGS_API_KEY,
  // Explicitly use OpenAI endpoint (not Grok)
  baseURL: 'https://api.openai.com/v1'
})

export interface DocumentChunk {
  id: string
  text: string
  metadata: {
    personaId: string
    fileName: string
    fileType: string
    chunkIndex: number
    source: 'upload' | 'manual'
  }
}

export class ResearchRAGService {
  private index: any

  async initialize() {
    this.index = await initializePineconeIndex()
  }

  // Extract text from different file types
  async extractTextFromFile(file: any): Promise<string> {
    try {
      const buffer = Buffer.from(file.content, 'base64')
      
      switch (file.type) {
        case 'application/pdf':
          const pdfData = await pdfParse(buffer)
          return pdfData.text
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          const docResult = await mammoth.extractRawText({ buffer })
          return docResult.value
          
        case 'text/plain':
          return buffer.toString('utf-8')
          
        case 'application/json':
          return JSON.stringify(JSON.parse(buffer.toString('utf-8')), null, 2)
          
        default:
          // Try to parse as text
          return buffer.toString('utf-8')
      }
    } catch (error) {
      console.error('Error extracting text from file:', error)
      return ''
    }
  }

  // Split text into chunks for better retrieval
  chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks.filter(chunk => chunk.length > 50) // Filter out very short chunks
  }

  // Create embeddings for text chunks
  async createEmbeddings(chunks: DocumentChunk[]): Promise<any[]> {
    const texts = chunks.map(chunk => chunk.text)
    
    console.log(`🔄 Creating embeddings for ${texts.length} text chunks...`)
    console.log(`📝 Sample text (first 100 chars): "${texts[0]?.substring(0, 100)}..."`)
    
    try {
      const response = await openaiEmbeddings.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      })

      console.log(`✅ Successfully created ${response.data.length} embeddings`)

      return response.data.map((embedding: any, index: number) => ({
        id: chunks[index].id,
        values: embedding.embedding,
        metadata: {
          text: chunks[index].text,
          ...chunks[index].metadata
        }
      }))
    } catch (error) {
      console.error('❌ Error creating embeddings:', error)
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        hasApiKey: !!(process.env.OPENAI_EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY),
        apiKeyPrefix: (process.env.OPENAI_EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY)?.substring(0, 10) + '...',
        textCount: texts.length,
        totalChars: texts.join('').length
      })
      throw error
    }
  }

  // Process and store research documents for a persona
  async processPersonaResearch(personaId: string, researchData: any) {
    console.log(`🔍 Starting research processing for persona ${personaId}`)
    console.log('📊 Research data:', JSON.stringify(researchData, null, 2))
    console.log('🔑 API Keys status:', {
      hasOpenAIEmbeddings: !!process.env.OPENAI_EMBEDDINGS_API_KEY,
      hasOpenAIFallback: !!process.env.OPENAI_API_KEY,
      hasPineconeKey: !!process.env.PINECONE_API_KEY,
      pineconeKeyPrefix: process.env.PINECONE_API_KEY?.substring(0, 8) + '...'
    })
    
    if (!this.index) {
      console.log('🔄 Initializing Pinecone index...')
      await this.initialize()
    }

    const allChunks: DocumentChunk[] = []

    // Process uploaded files
    if (researchData.uploadedFiles?.length) {
      console.log(`Processing ${researchData.uploadedFiles.length} uploaded files`)
      for (const file of researchData.uploadedFiles) {
        try {
          console.log(`Processing file: ${file.name}`)
          const text = await this.extractTextFromFile(file)
          if (text.trim()) {
            const chunks = this.chunkText(text)
            console.log(`Extracted ${chunks.length} chunks from ${file.name}`)
            chunks.forEach((chunkText, index) => {
              allChunks.push({
                id: `${personaId}-${file.name}-${index}`,
                text: chunkText,
                metadata: {
                  personaId,
                  fileName: file.name,
                  fileType: file.type,
                  chunkIndex: index,
                  source: 'upload'
                }
              })
            })
          } else {
            console.log(`No text extracted from ${file.name}`)
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
        }
      }
    }

    // Process manual knowledge
    if (researchData.manualKnowledge?.trim()) {
      console.log('Processing manual knowledge...')
      const chunks = this.chunkText(researchData.manualKnowledge)
      console.log(`Created ${chunks.length} chunks from manual knowledge`)
      chunks.forEach((chunkText, index) => {
        allChunks.push({
          id: `${personaId}-manual-${index}`,
          text: chunkText,
          metadata: {
            personaId,
            fileName: 'Manual Research Notes',
            fileType: 'text/plain',
            chunkIndex: index,
            source: 'manual'
          }
        })
      })
    }

    console.log(`Total chunks to process: ${allChunks.length}`)

    // Create embeddings and store in Pinecone
    if (allChunks.length > 0) {
      try {
        console.log('Creating embeddings...')
        const embeddings = await this.createEmbeddings(allChunks)
        console.log(`Created ${embeddings.length} embeddings`)
        
        // Store in batches of 100
        for (let i = 0; i < embeddings.length; i += 100) {
          const batch = embeddings.slice(i, i + 100)
          console.log(`Storing batch ${Math.floor(i/100) + 1} with ${batch.length} embeddings`)
          const result = await this.index.upsert(batch)
          console.log('Upsert result:', result)
        }

        console.log(`Successfully processed ${allChunks.length} chunks for persona ${personaId}`)
      } catch (error) {
        console.error('Error during embedding/storage process:', error)
        throw error
      }
    } else {
      console.log('No chunks to process - no research data provided')
    }

    return allChunks.length
  }

  // Search relevant research content for a query
  async searchResearchContent(personaId: string, query: string, topK: number = 5): Promise<string[]> {
    if (!this.index) await this.initialize()

    try {
      console.log(`[${new Date().toISOString()}] Searching for persona ${personaId} with query: "${query}"`)
      
      // Create embedding for the query with timeout
      console.log(`[${new Date().toISOString()}] Creating query embedding...`)
      const queryEmbedding = await Promise.race([
        openaiEmbeddings.embeddings.create({
          model: 'text-embedding-ada-002',
          input: query
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Embedding creation timeout')), 10000)
        )
      ]) as any

      console.log(`[${new Date().toISOString()}] Query embedding created successfully`)

      // Search Pinecone with timeout
      console.log(`[${new Date().toISOString()}] Querying Pinecone index...`)
      const searchResults = await Promise.race([
        this.index.query({
          vector: queryEmbedding.data[0].embedding,
          filter: { personaId },
          topK,
          includeMetadata: true
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Pinecone search timeout')), 8000)
        )
      ]) as any

      console.log(`[${new Date().toISOString()}] Found ${searchResults.matches?.length || 0} matches`)

      // Extract relevant text chunks
      const relevantTexts = searchResults.matches
        ?.filter((match: any) => match.score > 0.7) // Filter by relevance threshold
        .map((match: any) => match.metadata.text) || []
      
      console.log(`[${new Date().toISOString()}] Returning ${relevantTexts.length} relevant texts`)
      return relevantTexts
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error searching research content:`, error)
      return []
    }
  }

  // Delete research data for a persona
  async deletePersonaResearch(personaId: string) {
    if (!this.index) await this.initialize()

    try {
      await this.index.deleteMany({ personaId })
      console.log(`Deleted research data for persona ${personaId}`)
    } catch (error) {
      console.error('Error deleting persona research:', error)
    }
  }
}

export const researchRAG = new ResearchRAGService()
