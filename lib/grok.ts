import OpenAI from 'openai'

export const grok = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})
