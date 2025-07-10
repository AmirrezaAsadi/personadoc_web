import OpenAI from 'openai'
import { pinecone, PINECONE_INDEX_NAME, initializePineconeIndex } from './pinecone'
import pdfParse from 'pdf-parse'
import * as mammoth from 'mammoth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      })

      return response.data.map((embedding, index) => ({
        id: chunks[index].id,
        values: embedding.embedding,
        metadata: {
          text: chunks[index].text,
          ...chunks[index].metadata
        }
      }))
    } catch (error) {
      console.error('Error creating embeddings:', error)
      throw error
    }
  }

  // Process and store research documents for a persona
  async processPersonaResearch(personaId: string, researchData: any) {
    if (!this.index) await this.initialize()

    const allChunks: DocumentChunk[] = []

    // Process uploaded files
    if (researchData.uploadedFiles?.length) {
      for (const file of researchData.uploadedFiles) {
        try {
          const text = await this.extractTextFromFile(file)
          if (text.trim()) {
            const chunks = this.chunkText(text)
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
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
        }
      }
    }

    // Process manual knowledge
    if (researchData.manualKnowledge?.trim()) {
      const chunks = this.chunkText(researchData.manualKnowledge)
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

    // Create embeddings and store in Pinecone
    if (allChunks.length > 0) {
      const embeddings = await this.createEmbeddings(allChunks)
      
      // Store in batches of 100
      for (let i = 0; i < embeddings.length; i += 100) {
        const batch = embeddings.slice(i, i + 100)
        await this.index.upsert(batch)
      }

      console.log(`Processed ${allChunks.length} chunks for persona ${personaId}`)
    }

    return allChunks.length
  }

  // Search relevant research content for a query
  async searchResearchContent(personaId: string, query: string, topK: number = 5): Promise<string[]> {
    if (!this.index) await this.initialize()

    try {
      // Create embedding for the query
      const queryEmbedding = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query
      })

      // Search Pinecone
      const searchResults = await this.index.query({
        vector: queryEmbedding.data[0].embedding,
        filter: { personaId },
        topK,
        includeMetadata: true
      })

      // Extract relevant text chunks
      return searchResults.matches
        .filter((match: any) => match.score > 0.7) // Filter by relevance threshold
        .map((match: any) => match.metadata.text)
    } catch (error) {
      console.error('Error searching research content:', error)
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
