import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { grok } from '@/lib/grok'

interface SystemInfo {
  title: string
  description: string
  requirements: string
  constraints: string
  targetPlatform: string
  businessGoals: string
}

interface SwimLaneAction {
  id: string
  title: string
  description: string
  order: number
  estimatedTime?: string
}

interface SwimLane {
  id: string
  name: string
  personaIds: string[]  // Changed from personaId to personaIds array
  color: string
  description?: string
  actions: SwimLaneAction[]
}

interface Workflow {
  id: string
  name: string
  description: string
  swimLanes: SwimLane[]
  collaborationType: 'sequential' | 'parallel' | 'hybrid'
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For credentials provider, use the session user ID directly
    let userId = (session.user as any).id

    // For OAuth providers, find user by email
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      userId = user?.id
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { 
      workflow,
      systemInfo
    }: { 
      workflow: Workflow
      systemInfo: SystemInfo
    } = await request.json()

    if (!workflow || !workflow.swimLanes || workflow.swimLanes.length === 0) {
      return NextResponse.json({ error: 'No workflow or swim lanes provided' }, { status: 400 })
    }

    if (!systemInfo.title || !systemInfo.description) {
      return NextResponse.json({ error: 'System title and description are required' }, { status: 400 })
    }

    // Get unique persona IDs from swim lanes (flatten all personaIds arrays)
    const personaIds = [...new Set(workflow.swimLanes.flatMap(lane => lane.personaIds).filter(Boolean))]

    if (personaIds.length === 0) {
      return NextResponse.json({ error: 'No personas assigned to swim lanes' }, { status: 400 })
    }

    // Fetch the assigned personas with full data
    const personas = await prisma.persona.findMany({
      where: {
        id: { in: personaIds },
        createdBy: userId
      }
    })

    if (personas.length === 0) {
      return NextResponse.json({ error: 'No valid personas found' }, { status: 404 })
    }

    let implications: any[] = []
    let collaborativePainPoints: any[] = []

    // Generate individual analysis for each persona in the workflow using Grok AI
    implications = await Promise.all(
      personas.map(async (persona) => {
        // Find swim lanes where this persona is assigned
        const assignedLanes = workflow.swimLanes.filter(lane => lane.personaIds.includes(persona.id))
        
        if (assignedLanes.length === 0) return null

        // Analyze this persona across all their assigned lanes
        const results = await Promise.all(
          assignedLanes.map(async (swimLane) => {
            const personaData = {
              name: persona.name,
              age: persona.age,
              occupation: persona.occupation,
              location: persona.location,
              introduction: persona.introduction,
              personalityTraits: persona.personalityTraits,
              interests: persona.interests,
              metadata: persona.metadata,
              swimLane: swimLane
            }

            const prompt = createWorkflowAnalysisPrompt(systemInfo, personaData, workflow)
            
            try {
              // Use Grok AI for real analysis (same AI service used in interview tab)
              const response = await grok.chat.completions.create({
                model: "grok-3",
                messages: [
                  {
                    role: "system" as const,
                    content: "You are a UX design expert specializing in multi-persona workflow analysis. Respond with a JSON object containing detailed design implications for the given persona in their workflow role."
                  },
                  {
                    role: "user" as const,
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 1500,
              })

              const aiResponse = response.choices[0]?.message?.content || ''
              
              // Try to parse AI response as JSON, fallback to mock if needed
              try {
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                  const aiImplication = JSON.parse(jsonMatch[0])
                  // Ensure required fields exist
                  return {
                    personaId: persona.id,
                    personaName: persona.name,
                    swimLaneId: swimLane.id,
                    swimLaneName: swimLane.name,
                    rationale: aiImplication.rationale || `AI analysis for ${persona.name} in ${swimLane.name}.`,
                    priority: aiImplication.priority || 'medium',
                    implications: {
                      userInterface: aiImplication.implications?.userInterface || [],
                      functionality: aiImplication.implications?.functionality || [],
                      accessibility: aiImplication.implications?.accessibility || [],
                      content: aiImplication.implications?.content || [],
                      technical: aiImplication.implications?.technical || [],
                      behavioral: aiImplication.implications?.behavioral || []
                    }
                  }
                } else {
                  throw new Error('No JSON found in AI response')
                }
              } catch (parseError) {
                console.error('Failed to parse AI workflow analysis:', parseError)
                console.log('AI Response:', aiResponse)
                // Fall back to mock if AI response can't be parsed
                return createMockWorkflowImplication(persona.id, persona.name, personaData, swimLane)
              }
            } catch (aiError) {
              console.error(`AI analysis failed for persona ${persona.name}:`, aiError)
              return createMockWorkflowImplication(persona.id, persona.name, personaData, swimLane)
            }
          })
        )

        return results.filter(Boolean)
      })
    )

    // Flatten results and filter out null values
    implications = implications.flat().filter(Boolean)

    // Generate collaborative analysis for swim lane interactions
    if (workflow.swimLanes.length > 1) {
      collaborativePainPoints = await Promise.all(
        workflow.swimLanes.map(async (lane) => {
          // Get all personas assigned to this lane
          const lanePersonas = personas.filter(p => lane.personaIds.includes(p.id))
          if (lanePersonas.length === 0) return null

          // Get other lanes that have personas assigned
          const otherLanes = workflow.swimLanes.filter(l => l.id !== lane.id && l.personaIds.length > 0)
          const otherPersonas = otherLanes.flatMap(l => 
            personas.filter(p => l.personaIds.includes(p.id))
          )

          if (otherPersonas.length === 0) {
            return null // Skip lanes with no interaction partners
          }

          // Create analysis for each persona in this lane
          const laneAnalyses = await Promise.all(
            lanePersonas.map(async (persona) => {
              const prompt = createSwimLaneAnalysisPrompt(
                systemInfo, 
                lane,
                persona,
                otherPersonas, 
                otherLanes,
                workflow
              )

              try {
                // Use Grok AI for collaborative analysis (same AI service used in interview tab)
                const response = await grok.chat.completions.create({
                  model: "grok-3",
                  messages: [
                    {
                      role: "system" as const,
                      content: "You are a UX design expert specializing in collaborative sequence analysis. Respond with a JSON object containing potential pain points and recommendations for multi-persona collaboration in swim lanes."
                    },
                    {
                      role: "user" as const,
                      content: prompt
                    }
                  ],
                  temperature: 0.7,
                  max_tokens: 1500,
                })

                const aiResponse = response.choices[0]?.message?.content || ''
                
                // Try to parse AI response as JSON, fallback to mock if needed
                try {
                  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
                  if (jsonMatch) {
                    const aiPainPoint = JSON.parse(jsonMatch[0])
                    // Ensure required fields exist
                    return {
                      workflowId: workflow.id,
                      laneId: lane.id,
                      laneName: lane.name,
                      primaryPersona: persona.name,
                      involvedPersonas: [persona.name, ...otherPersonas.map(p => p?.name || 'Unknown')].filter(Boolean),
                      severity: aiPainPoint.severity || 'medium',
                      painPoints: {
                        communication: aiPainPoint.painPoints?.communication || [],
                        coordination: aiPainPoint.painPoints?.coordination || [],
                        trust: aiPainPoint.painPoints?.trust || [],
                        efficiency: aiPainPoint.painPoints?.efficiency || [],
                        technical: aiPainPoint.painPoints?.technical || []
                      },
                      recommendations: aiPainPoint.recommendations || []
                    }
                  } else {
                    throw new Error('No JSON found in AI response')
                  }
                } catch (parseError) {
                  console.error('Failed to parse AI collaborative analysis:', parseError)
                  console.log('AI Response:', aiResponse)
                  // Fall back to mock if AI response can't be parsed
                  return createMockSwimLanePainPoint(lane, persona, otherPersonas, otherLanes, workflow)
                }
              } catch (aiError) {
                console.error(`Swim lane analysis failed:`, aiError)
                return createMockSwimLanePainPoint(lane, persona, otherPersonas, otherLanes, workflow)
              }
            })
          )

          return laneAnalyses.filter(Boolean)
        })
      )

      // Flatten and filter out null results
      collaborativePainPoints = collaborativePainPoints.flat().filter(point => point !== null)
    }

    return NextResponse.json({
      implications,
      collaborativePainPoints,
      systemInfo,
      workflow,
      personaCount: personas.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Multi-persona analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error during analysis' }, 
      { status: 500 }
    )
  }
}

// Analysis prompt for workflow-based analysis
function createWorkflowAnalysisPrompt(systemInfo: SystemInfo, personaData: any, workflow: Workflow): string {
  return `Analyze this persona's role in a workflow and provide design implications.

RESPOND WITH ONLY A JSON OBJECT in this exact format:
{
  "rationale": "Brief explanation of why these implications are important for this persona",
  "priority": "high|medium|low",
  "implications": {
    "userInterface": ["UI design implication 1", "UI design implication 2"],
    "functionality": ["Functionality need 1", "Functionality need 2"],
    "accessibility": ["Accessibility consideration 1", "Accessibility consideration 2"],
    "content": ["Content strategy 1", "Content strategy 2"],
    "technical": ["Technical requirement 1", "Technical requirement 2"],
    "behavioral": ["Behavioral consideration 1", "Behavioral consideration 2"]
  }
}

System Information:
- Title: ${systemInfo.title}
- Description: ${systemInfo.description}
- Platform: ${systemInfo.targetPlatform || 'Not specified'}
- Business Goals: ${systemInfo.businessGoals || 'Not specified'}

Workflow Context:
- Name: ${workflow.name}
- Description: ${workflow.description}
- Collaboration Type: ${workflow.collaborationType}
- Total Swim Lanes: ${workflow.swimLanes.length}
- Swim Lanes: ${workflow.swimLanes.map(l => l.name).join(', ')}

Persona Profile:
- Name: ${personaData.name}
- Age: ${personaData.age || 'Not specified'}
- Occupation: ${personaData.occupation || 'Not specified'}
- Location: ${personaData.location || 'Not specified'}
- Introduction: ${personaData.introduction || 'Not specified'}
- Personality Traits: ${JSON.stringify(personaData.personalityTraits) || 'Not specified'}
- Interests: ${JSON.stringify(personaData.interests) || 'Not specified'}

Persona's Workflow Role:
- Swim Lane: ${personaData.swimLane?.name || 'Unassigned'}
- Actions: ${personaData.swimLane?.actions?.map((a: any) => a.description).join(', ') || 'No actions defined'}

Consider how this persona's characteristics, role, and actions affect their needs in the workflow context.`
}

// Analysis prompt for swim lane action analysis
function createSwimLaneAnalysisPrompt(
  systemInfo: SystemInfo, 
  lane: SwimLane,
  persona: any,
  otherPersonas: any[],
  otherLanes: SwimLane[],
  workflow: Workflow
): string {
  return `Analyze collaboration challenges for this swim lane and its interactions with other personas.

RESPOND WITH ONLY A JSON OBJECT in this exact format:
{
  "severity": "critical|high|medium|low",
  "painPoints": {
    "communication": ["Communication issue 1", "Communication issue 2"],
    "coordination": ["Coordination challenge 1", "Coordination challenge 2"], 
    "trust": ["Trust-related issue 1", "Trust-related issue 2"],
    "efficiency": ["Efficiency concern 1", "Efficiency concern 2"],
    "technical": ["Technical challenge 1", "Technical challenge 2"]
  },
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

System Information:
- Title: ${systemInfo.title}
- Description: ${systemInfo.description}

Workflow Context:
- Name: ${workflow.name}
- Collaboration Type: ${workflow.collaborationType}

Current Lane Analysis:
- Lane: "${lane.name}"
- Actions: ${lane.actions?.map(action => action.description).join(', ') || 'No actions defined'}

Primary Persona:
- Name: ${persona.name}
- Occupation: ${persona.occupation || 'Not specified'}
- Background: ${persona.introduction || 'Not specified'}

Collaborating Personas:
${otherPersonas.map((p, index) => {
  const otherLane = otherLanes.find(l => l.personaIds.includes(p?.id || ''))
  return `${index + 1}. ${p?.name || 'Unknown'} (Lane: ${otherLane?.name || 'Unknown'})
     - Actions: ${otherLane?.actions?.map(a => a.description).join(', ') || 'No actions'}
     - Occupation: ${p?.occupation || 'Not specified'}`
}).join('\n\n')}

Analyze potential collaboration friction, communication gaps, coordination challenges, trust issues, efficiency bottlenecks, and technical barriers between these swim lanes.`
}

// Persona analysis prompt for swim lane actions
function createPersonaAnalysisPrompt(systemInfo: SystemInfo, persona: any, swimLane: SwimLane, workflow: Workflow): string {
  return `Analyze this persona's experience with the system in their swim lane role.

RESPOND WITH ONLY A JSON OBJECT in this exact format:
{
  "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "designImplications": ["Design implication 1", "Design implication 2", "Design implication 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}

System Information:
- Title: ${systemInfo.title}
- Description: ${systemInfo.description}
- Platform: ${systemInfo.targetPlatform || 'Not specified'}
- Business Goals: ${systemInfo.businessGoals || 'Not specified'}

Persona Profile:
- Name: ${persona.name}
- Age: ${persona.age || 'Not specified'}
- Occupation: ${persona.occupation || 'Not specified'}
- Location: ${persona.location || 'Not specified'}
- Introduction: ${persona.introduction || 'Not specified'}
- Personality Traits: ${JSON.stringify(persona.personalityTraits) || 'Not specified'}
- Interests: ${JSON.stringify(persona.interests) || 'Not specified'}

Swim Lane Role:
- Lane: ${swimLane.name}
- Actions: ${swimLane.actions?.map(action => action.description).join(', ') || 'No actions defined'}

Workflow Context:
- Name: ${workflow.name}
- Description: ${workflow.description}
- Collaboration Type: ${workflow.collaborationType}

Analyze how this persona's characteristics affect their experience in their swim lane role and identify specific design needs.`
}

function createMockPersonaAnalysis(persona: any, swimLane: SwimLane, workflow: Workflow) {
  const techProficiency = persona.metadata?.technology?.techProficiency || 5
  const age = persona.age || 30
  const occupation = persona.occupation || 'Professional'

  return {
    personaId: persona.id,
    personaName: persona.name,
    swimLaneId: swimLane.id,
    swimLaneName: swimLane.name,
    painPoints: [
      `May struggle with complex ${swimLane.name} workflows if tech proficiency is low`,
      `Potential confusion about lane-specific action sequences`,
      `Difficulty coordinating with other swim lanes during handoffs`
    ],
    designImplications: [
      `Design ${swimLane.name}-specific interface optimized for ${occupation} workflow`,
      `Implement clear visual indicators for action progress in swim lane`,
      `Provide contextual help for lane-specific tasks`
    ],
    opportunities: [
      `Streamline ${swimLane.name} actions for ${persona.name}'s efficiency`,
      `Create personalized shortcuts for frequent lane actions`,
      `Implement smart suggestions based on swim lane patterns`
    ],
    recommendations: [
      `Optimize ${swimLane.name} interface for ${age}-year-old ${occupation}`,
      `Provide clear lane boundaries and action dependencies`,
      `Implement progress tracking for swim lane completion`
    ]
  }
}

function createMockSwimLanePainPoint(lane: SwimLane, persona: any, otherPersonas: any[], otherLanes: SwimLane[], workflow: Workflow) {
  const personaNames = [persona.name, ...otherPersonas.map(p => p?.name || 'Unknown')].filter(Boolean)
  
  return {
    workflowId: workflow.id,
    laneId: lane.id,
    laneName: lane.name,
    involvedPersonas: personaNames,
    severity: (otherLanes.length > 2 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    painPoints: {
      communication: [
        `Different communication preferences between ${personaNames.slice(0, 2).join(' and ')}`,
        `Potential misalignment on action completion criteria`,
        `Risk of information gaps between swim lanes`
      ],
      coordination: [
        `Dependency management complexity with ${otherLanes.length + 1} swim lanes`,
        `Potential bottlenecks when ${lane.name} requires coordination with other lanes`,
        `Action sequencing challenges across lanes`
      ],
      trust: [
        `Varying levels of expertise may cause friction between lanes`,
        `Different working styles could impact collaboration quality`,
        `Accountability ambiguity in shared lane actions`
      ],
      efficiency: [
        `Potential delays due to cross-lane dependencies`,
        `Risk of duplicate actions without clear lane boundaries`,
        `Coordination overhead for complex swim lane interactions`
      ],
      technical: [
        `Integration challenges between lane-specific tools`,
        `Data synchronization issues across swim lanes`,
        `Version control conflicts in shared resources`
      ]
    },
    recommendations: [
      `Implement clear handoff protocols between ${lane.name} and other lanes`,
      `Create shared visibility dashboard for cross-lane dependencies`,
      `Establish communication standards for swim lane collaboration`,
      `Design automated coordination for routine lane interactions`
    ]
  }
}

function createMockWorkflowImplication(personaId: string, personaName: string, personaData: any, swimLane?: SwimLane) {
  const techProficiency = personaData.metadata?.technology?.techProficiency || 5
  const age = personaData.age || 30
  const occupation = personaData.occupation || 'Professional'

  return {
    personaId,
    personaName,
    rationale: `Based on ${personaName}'s characteristics (${age} years old, ${occupation}, tech proficiency: ${techProficiency}/10) and their role in ${swimLane?.name || 'swim lane'}, they have specific workflow needs.`,
    priority: (techProficiency < 4 ? 'high' : techProficiency > 7 ? 'medium' : 'medium') as 'high' | 'medium' | 'low',
    implications: {
      userInterface: [
        `Design ${swimLane?.name || 'role'}-specific interface with relevant workflow controls`,
        `Implement clear visual indicators for action progress`,
        `Provide contextual help for ${personaName}'s swim lane actions`
      ],
      functionality: [
        `Enable efficient handoffs between ${swimLane?.name || 'role'} and other swim lanes`,
        `Implement notification system for lane dependencies`,
        `Provide action-based automation for repetitive tasks`
      ],
      accessibility: [
        `Ensure swim lane interface works across ${personaName}'s preferred devices`,
        `Implement keyboard shortcuts for power users`,
        `Design responsive layout for mobile workflow access`
      ],
      content: [
        `Use terminology familiar to ${occupation} professionals`,
        `Provide clear instructions for each swim lane action`,
        `Include progress indicators and completion checklists`
      ],
      technical: [
        `Implement real-time collaboration features for swim lanes`,
        `Ensure reliable notification delivery`,
        `Provide offline mode for critical actions`
      ],
      behavioral: [
        `Design swim lane to match ${personaName}'s collaboration style`,
        `Implement progress tracking to maintain motivation`,
        `Provide clear accountability for lane actions`
      ]
    }
  }
}
