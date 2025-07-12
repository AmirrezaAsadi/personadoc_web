import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { grok } from '@/lib/grok'
import { pinecone } from '@/lib/pinecone'

// Function to anonymize personal information
function anonymizeText(text: string): string {
  // Replace common personal identifiers
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]') // Full names
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // Phone numbers
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Emails
    .replace(/\b\d{1,5}\s\w+\s(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi, '[ADDRESS]') // Addresses
    .replace(/\b(SSN|Social Security)[\s:]*\d{3}-?\d{2}-?\d{4}\b/gi, '[SSN]') // SSN
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD_NUMBER]') // Credit cards
}

// Generate anonymous name based on characteristics
function generateAnonymousName(traits: string[], gender?: string): string {
  const maleNames = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery']
  const femaleNames = ['Jamie', 'Quinn', 'Harper', 'Sage', 'River', 'Phoenix', 'Emery', 'Dakota']
  const neutralNames = ['Ash', 'Blake', 'Devon', 'Finley', 'Gray', 'Hayden', 'Indigo', 'Jules']
  
  let namePool = neutralNames
  if (gender?.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) {
    namePool = maleNames
  } else if (gender?.toLowerCase().includes('female')) {
    namePool = femaleNames
  }
  
  const baseName = namePool[Math.floor(Math.random() * namePool.length)]
  
  // Add trait-based suffix for uniqueness
  const traitSuffixes = ['Persona', 'Profile', 'Character', 'Individual', 'User']
  const suffix = traitSuffixes[Math.floor(Math.random() * traitSuffixes.length)]
  
  return `${baseName} ${suffix}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcripts } = await request.json()
    
    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      return NextResponse.json({ error: 'No transcripts provided' }, { status: 400 })
    }

    if (transcripts.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 transcripts allowed' }, { status: 400 })
    }

    // Anonymize all transcript content
    const anonymizedTranscripts = transcripts.map(t => ({
      name: t.name,
      content: anonymizeText(t.content)
    }))

    // Combine all transcript content
    const combinedContent = anonymizedTranscripts
      .map(t => `--- ${t.name} ---\n${t.content}`)
      .join('\n\n')

    // AI prompt for persona inference
    const systemPrompt = `You are an expert persona researcher and psychologist. Analyze the provided transcript(s) and create a detailed persona profile based on speech patterns, personality traits, interests, and behavioral indicators.

IMPORTANT PRIVACY GUIDELINES:
- All personal information has been anonymized with placeholders like [NAME], [EMAIL], [PHONE], etc.
- Generate a completely fictional name that doesn't match any real person
- Use general locations (e.g., "Midwest US", "Urban area", "Small town") instead of specific cities
- Create realistic but anonymous demographic information

ANALYSIS FOCUS AREAS:
1. Communication style and personality traits
2. Professional background and expertise level
3. Interests, hobbies, and values
4. Educational background indicators
5. Life stage and demographic characteristics
6. Technology comfort level
7. Social interaction patterns

Generate a comprehensive persona in this exact JSON format:
{
  "name": "string (anonymous fictional name)",
  "age": "number (estimated age range)",
  "gender": "string (inferred if possible, otherwise leave empty)",
  "location": "string (general region/area type)",
  "occupation": "string (professional field/role)",
  "incomeLevel": "string (Low/Middle/High based on indicators)",
  "education": "string (estimated education level)",
  "backgroundStory": "string (2-3 sentences about their background and current situation)",
  "personalityTraits": ["array", "of", "key", "personality", "traits"],
  "interests": ["array", "of", "hobbies", "and", "interests"],
  "values": "string (core values and principles)",
  "motivations": "string (what drives them, goals, aspirations)",
  "communicationStyle": "string (how they communicate and interact)",
  "techComfort": "number (1-10 scale of technology comfort)",
  "confidenceLevel": "number (1-10 scale based on speech patterns)"
}

TRANSCRIPT DATA:
${combinedContent}

Important: Ensure all personal identifiers remain anonymized and the persona is realistic but fictional.`

    // Call AI to analyze transcripts
    const response = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please analyze these transcripts and create a comprehensive anonymous persona profile.' }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const aiContent = response.choices[0]?.message?.content || ''
    
    // Extract JSON from response
    let personaData
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        personaData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      
      // Fallback persona creation
      personaData = {
        name: generateAnonymousName(['Unknown'], 'neutral'),
        age: 30,
        gender: '',
        location: 'Unknown Location',
        occupation: 'Professional',
        incomeLevel: 'Middle',
        education: 'College Graduate',
        backgroundStory: 'A professional individual with diverse interests and perspectives, created from transcript analysis.',
        personalityTraits: ['Articulate', 'Thoughtful', 'Professional'],
        interests: ['Communication', 'Learning', 'Problem Solving'],
        values: 'Authenticity and growth',
        motivations: 'Personal and professional development',
        communicationStyle: 'Clear and structured',
        techComfort: 7,
        confidenceLevel: 7
      }
    }

    // Ensure name is appropriately anonymous
    if (!personaData.name || personaData.name.includes('[NAME]')) {
      personaData.name = generateAnonymousName(personaData.personalityTraits || [], personaData.gender)
    }

    // Store transcripts in vector database for RAG
    try {
      if (pinecone) {
        const vectorData = {
          id: `transcript-${Date.now()}`,
          values: await generateEmbedding(combinedContent.substring(0, 8000)), // Truncate if too long
          metadata: {
            type: 'transcript',
            personaName: personaData.name,
            userId: (session.user as any).id || session.user.email,
            transcriptCount: transcripts.length,
            createdAt: new Date().toISOString()
          }
        }

        // Note: You'll need to implement the actual Pinecone upsert here
        console.log('Vector data prepared for Pinecone:', vectorData.metadata)
      }
    } catch (error) {
      console.error('Error storing in vector database:', error)
      // Don't fail the whole process if vector storage fails
    }

    return NextResponse.json({
      success: true,
      persona: personaData,
      transcriptCount: transcripts.length,
      anonymizedContent: anonymizedTranscripts.map(t => ({ name: t.name, length: t.content.length }))
    })

  } catch (error) {
    console.error('Error analyzing transcripts:', error)
    return NextResponse.json({ 
      error: 'Failed to analyze transcripts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to generate embeddings (simplified version)
async function generateEmbedding(text: string): Promise<number[]> {
  // This is a placeholder - you'd typically use OpenAI embeddings or similar
  // For now, return a dummy embedding
  return Array.from({ length: 1536 }, () => Math.random() - 0.5)
}
