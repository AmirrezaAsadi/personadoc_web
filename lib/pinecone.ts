import { Pinecone } from '@pinecone-database/pinecone'

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is required')
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
})

export const PINECONE_INDEX_NAME = 'personadoc-research'
export const EMBEDDING_DIMENSION = 1536 // OpenAI text-embedding-ada-002 dimension

// Initialize index if it doesn't exist
export async function initializePineconeIndex() {
  try {
    const existingIndexes = await pinecone.listIndexes()
    const indexExists = existingIndexes.indexes?.some(
      index => index.name === PINECONE_INDEX_NAME
    )

    if (!indexExists) {
      console.log('Creating Pinecone index...')
      await pinecone.createIndex({
        name: PINECONE_INDEX_NAME,
        dimension: EMBEDDING_DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      })
      console.log('Pinecone index created successfully')
    }

    return pinecone.index(PINECONE_INDEX_NAME)
  } catch (error) {
    console.error('Error initializing Pinecone:', error)
    throw error
  }
}
