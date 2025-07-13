import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface SystemInfo {
  title: string
  description: string
  requirements: string
  constraints: string
  targetPlatform: string
  businessGoals: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  order: number
  estimatedTime?: string
}

interface SwimLane {
  id: string
  name: string
  personaId: string
  color: string
  responsibilities: string[]
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
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

    // Get unique persona IDs from swim lanes
    const personaIds = [...new Set(workflow.swimLanes.map(lane => lane.personaId).filter(Boolean))]

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

    // Generate individual analysis for each persona in the workflow
    implications = await Promise.all(
      personas.map(async (persona) => {
        const swimLane = workflow.swimLanes.find(lane => lane.personaId === persona.id)
        
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
          // For now, return a mock response since we don't have OpenAI configured
          return createMockWorkflowImplication(persona.id, persona.name, personaData, swimLane)
        } catch (aiError) {
          console.error(`AI analysis failed for persona ${persona.name}:`, aiError)
          return createFallbackImplication(persona.id, persona.name)
        }
      })
    )

    // Generate collaborative analysis for workflow steps
    if (workflow.steps.length > 0 && workflow.swimLanes.length > 1) {
      collaborativePainPoints = await Promise.all(
        workflow.steps.map(async (step) => {
          // Find personas involved in this step
          const involvedLanes = workflow.swimLanes.filter(lane => lane.personaId)
          const involvedPersonas = involvedLanes.map(lane => 
            personas.find(p => p.id === lane.personaId)
          ).filter(Boolean)

          if (involvedPersonas.length < 2) {
            return null // Skip steps with less than 2 personas
          }

          const prompt = createWorkflowStepAnalysisPrompt(
            systemInfo, 
            step,
            involvedPersonas, 
            involvedLanes,
            workflow
          )

          try {
            // For now, return a mock response
            return createMockWorkflowPainPoint(step, involvedPersonas, involvedLanes, workflow)
          } catch (aiError) {
            console.error(`Workflow step analysis failed:`, aiError)
            return createFallbackWorkflowPainPoint(step, involvedPersonas)
          }
        })
      )

      // Filter out null results
      collaborativePainPoints = collaborativePainPoints.filter(point => point !== null)
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
  return `You are a UX design expert analyzing how a specific persona will interact with a system in the context of a workflow.

System Information:
- Title: ${systemInfo.title}
- Description: ${systemInfo.description}
- Platform: ${systemInfo.targetPlatform || 'Not specified'}
- Business Goals: ${systemInfo.businessGoals || 'Not specified'}

Workflow Context:
- Name: ${workflow.name}
- Description: ${workflow.description}
- Collaboration Type: ${workflow.collaborationType}
- Total Steps: ${workflow.steps.length}

Persona Details:
- Name: ${personaData.name}
- Age: ${personaData.age || 'Not specified'}
- Occupation: ${personaData.occupation || 'Not specified'}
- Location: ${personaData.location || 'Not specified'}
- Introduction: ${personaData.introduction || 'Not specified'}
- Personality Traits: ${JSON.stringify(personaData.personalityTraits) || 'Not specified'}
- Interests: ${JSON.stringify(personaData.interests) || 'Not specified'}

Persona's Role in Workflow:
- Swim Lane: ${personaData.swimLane?.name || 'Unassigned'}
- Responsibilities: ${personaData.swimLane?.responsibilities?.join(', ') || 'None specified'}

Please provide design implications specific to this persona's role in the workflow, considering their characteristics and responsibilities.`
}

// Analysis prompt for workflow step collaboration
function createWorkflowStepAnalysisPrompt(
  systemInfo: SystemInfo, 
  step: WorkflowStep,
  personas: any[], 
  swimLanes: SwimLane[],
  workflow: Workflow
): string {
  return `You are a UX design expert analyzing potential collaboration pain points in a specific workflow step.

System Information:
- Title: ${systemInfo.title}
- Description: ${systemInfo.description}

Workflow Step:
- Title: ${step.title}
- Description: ${step.description}
- Estimated Time: ${step.estimatedTime || 'Not specified'}

Involved Personas and Their Roles:
${personas.map((persona, index) => {
  const lane = swimLanes.find(l => l.personaId === persona.id)
  return `${index + 1}. ${persona.name} (${lane?.name || 'Unknown role'})
     - Responsibilities: ${lane?.responsibilities?.join(', ') || 'None specified'}
     - Occupation: ${persona.occupation || 'Not specified'}
     - Traits: ${JSON.stringify(persona.personalityTraits) || 'Not specified'}`
}).join('\n')}

Analyze potential collaboration challenges and provide recommendations for this specific workflow step.`
}

function createMockWorkflowImplication(personaId: string, personaName: string, personaData: any, swimLane?: SwimLane) {
  const techProficiency = personaData.metadata?.technology?.techProficiency || 5
  const age = personaData.age || 30
  const occupation = personaData.occupation || 'Professional'

  return {
    personaId,
    personaName,
    rationale: `Based on ${personaName}'s characteristics (${age} years old, ${occupation}, tech proficiency: ${techProficiency}/10) and their role as ${swimLane?.name || 'team member'}, they have specific workflow-related needs.`,
    priority: (techProficiency < 4 ? 'high' : techProficiency > 7 ? 'medium' : 'medium') as 'high' | 'medium' | 'low',
    implications: {
      userInterface: [
        `Design ${swimLane?.name || 'role'}-specific dashboard with relevant workflow controls`,
        `Implement clear visual indicators for workflow step progress`,
        `Provide contextual help for ${personaName}'s responsibilities: ${swimLane?.responsibilities?.join(', ') || 'general tasks'}`
      ],
      functionality: [
        `Enable efficient handoffs between ${swimLane?.name || 'role'} and other team members`,
        `Implement notification system for workflow dependencies`,
        `Provide role-based automation for repetitive tasks`
      ],
      accessibility: [
        `Ensure workflow interface works across ${personaName}'s preferred devices`,
        `Implement keyboard shortcuts for power users`,
        `Design responsive layout for mobile workflow access`
      ],
      content: [
        `Use terminology familiar to ${occupation} professionals`,
        `Provide clear instructions for each workflow step`,
        `Include progress indicators and completion checklists`
      ],
      technical: [
        `Implement real-time collaboration features`,
        `Ensure reliable notification delivery`,
        `Provide offline mode for critical workflow steps`
      ],
      behavioral: [
        `Design workflow to match ${personaName}'s collaboration style`,
        `Implement progress tracking to maintain motivation`,
        `Provide clear accountability and ownership indicators`
      ]
    }
  }
}

function createMockWorkflowPainPoint(step: WorkflowStep, personas: any[], swimLanes: SwimLane[], workflow: Workflow) {
  const personaNames = personas.map(p => p.name)
  
  return {
    workflowId: workflow.id,
    stepId: step.id,
    stepTitle: step.title,
    involvedPersonas: personaNames,
    severity: (swimLanes.length > 3 ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
    painPoints: {
      communication: [
        `Different communication preferences between ${personaNames.slice(0, 2).join(' and ')}`,
        `Potential misalignment on step completion criteria`,
        `Risk of information silos between swim lanes`
      ],
      coordination: [
        `Dependency management complexity with ${swimLanes.length} swim lanes`,
        `Potential bottlenecks when ${step.title} requires all lanes to coordinate`,
        `Timeline synchronization challenges`
      ],
      trust: [
        `Varying levels of technical expertise may cause friction`,
        `Different working styles could impact collaboration quality`,
        `Accountability ambiguity in shared responsibilities`
      ],
      efficiency: [
        `Potential delays due to cross-lane dependencies`,
        `Risk of duplicate work without clear lane boundaries`,
        `Meeting overhead for complex coordination`
      ],
      technical: [
        `System access differences between roles`,
        `Integration complexity for tools used by different lanes`,
        `Version control and change management challenges`
      ]
    },
    recommendations: [
      `Implement clear swim lane ownership indicators`,
      `Design automated handoff mechanisms between lanes`,
      `Create shared progress dashboards for transparency`,
      `Establish clear escalation paths for blockers`,
      `Implement role-based notification preferences`,
      `Design collaborative decision-making workflows`
    ]
  }
}

function createFallbackWorkflowPainPoint(step: WorkflowStep, personas: any[]) {
  return {
    workflowId: 'unknown',
    stepId: step.id,
    stepTitle: step.title,
    involvedPersonas: personas.map(p => p.name),
    severity: 'medium' as const,
    painPoints: {
      communication: ['Standard communication challenges in collaborative workflows'],
      coordination: ['Typical coordination complexities in multi-persona steps'],
      trust: ['General trust-building needs in team collaboration'],
      efficiency: ['Common efficiency concerns in workflow execution'],
      technical: ['Standard technical integration challenges']
    },
    recommendations: [
      'Implement clear communication protocols',
      'Design transparent progress tracking',
      'Establish clear role definitions',
      'Create efficient handoff processes'
    ]
  }
}

function createFallbackImplication(personaId: string, personaName: string) {
  return {
    personaId,
    personaName,
    rationale: `Analysis temporarily unavailable for ${personaName}. This is a fallback response.`,
    priority: 'medium' as const,
    implications: {
      userInterface: ['Analysis will be available when AI service is restored'],
      functionality: ['Analysis will be available when AI service is restored'],
      accessibility: ['Analysis will be available when AI service is restored'],
      content: ['Analysis will be available when AI service is restored'],
      technical: ['Analysis will be available when AI service is restored'],
      behavioral: ['Analysis will be available when AI service is restored']
    }
  }
}
