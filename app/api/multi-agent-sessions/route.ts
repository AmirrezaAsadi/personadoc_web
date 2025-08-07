import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { multiAgentSystem } from '@/lib/multi-agent-personas';
import { langGraphIntegration } from '@/lib/langgraph-integration';
import { z } from 'zod';

// Validation schemas
const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  personaIds: z.array(z.string()).min(2).max(10),
  topic: z.string().min(1).max(200).optional(),
  workflow: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    swimLanes: z.array(z.object({
      id: z.string(),
      name: z.string(),
      personaId: z.string(),
      color: z.string(),
      description: z.string().optional(),
      actions: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        order: z.number(),
        estimatedTime: z.string().optional()
      }))
    })),
    collaborationType: z.enum(['sequential', 'parallel', 'hybrid'])
  }).optional(),
  systemInfo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    requirements: z.string().optional(),
    constraints: z.string().optional(),
    targetPlatform: z.string().optional(),
    businessGoals: z.string().optional()
  }).optional()
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = createSessionSchema.parse(body);

    // Create multi-agent session
    const agentSession = await multiAgentSystem.createMultiAgentSession(
      validated.name,
      validated.description || '',
      validated.personaIds,
      validated.workflow,
      validated.systemInfo,
      validated.topic
    );

    return NextResponse.json({
      success: true,
      session: {
        id: agentSession.id,
        name: agentSession.name,
        description: agentSession.description,
        status: agentSession.status,
        agentCount: agentSession.agents.length,
        startedAt: agentSession.startedAt,
        systemAgent: {
          id: agentSession.systemAgent.id,
          name: agentSession.systemAgent.name,
          type: agentSession.systemAgent.type,
          status: agentSession.systemAgent.status
        },
        agents: agentSession.agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          messageCount: agent.messageCount,
          pendingSystemResponse: agent.pendingSystemResponse
        })),
        coordinationEvents: agentSession.coordinationLog.length,
        systemEvents: agentSession.systemEvents.length
      }
    });
  } catch (error) {
    console.error('Failed to create multi-agent session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await multiAgentSystem.getAllSessions();
    
    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        agentCount: s.agents.length,
        messageCount: s.messages.length,
        systemEvents: s.systemEvents?.length || 0,
        coordinationEvents: s.coordinationLog?.length || 0,
        startedAt: s.startedAt,
        systemAgent: {
          name: s.systemAgent?.name || 'System',
          status: s.systemAgent?.status || 'active'
        },
        agents: s.agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          messageCount: agent.messageCount,
          lastActivity: agent.lastActivity,
          pendingSystemResponse: agent.pendingSystemResponse
        }))
      }))
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
