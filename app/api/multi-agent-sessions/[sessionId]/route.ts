import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { multiAgentSystem } from '@/lib/multi-agent-personas';
import { z } from 'zod';

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  agentId: z.string().optional() // If provided, message from specific agent
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const agentSession = await multiAgentSystem.getSession(resolvedParams.sessionId);
    if (!agentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      session: {
        id: agentSession.id,
        name: agentSession.name,
        description: agentSession.description,
        status: agentSession.status,
        startedAt: agentSession.startedAt,
        agents: agentSession.agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          messageCount: agent.messageCount,
          lastActivity: agent.lastActivity
        })),
        messages: agentSession.messages.map(msg => ({
          fromAgentId: msg.fromAgentId,
          toAgentId: msg.toAgentId,
          content: msg.content,
          timestamp: msg.timestamp,
          type: msg.type
        }))
      }
    });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = sendMessageSchema.parse(body);
    const resolvedParams = await params;

    // Send message to the multi-agent session
    const result = await multiAgentSystem.sendMessage(
      resolvedParams.sessionId,
      validated.message,
      validated.agentId
    );

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      agentResponses: result.responses
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    await multiAgentSystem.endSession(resolvedParams.sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to end session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
