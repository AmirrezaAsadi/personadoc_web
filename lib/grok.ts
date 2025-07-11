import OpenAI from 'openai'

export const grok = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is actually the X.AI/Grok API key
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.x.ai/v1',
  timeout: 25000, // 25 second timeout
})
