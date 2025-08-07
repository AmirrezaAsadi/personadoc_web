import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userQuery, personaIds, sessionId } = await request.json();

    if (!userQuery || !personaIds || !Array.isArray(personaIds)) {
      return NextResponse.json(
        { error: 'Missing userQuery or personaIds' },
        { status: 400 }
      );
    }

    // Check if Python Google ADK service is available
    const pythonServiceUrl = process.env.PYTHON_AGENT_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const healthResponse = await fetch(`${pythonServiceUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error('Google ADK service unavailable');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Google ADK multi-agent service is unavailable. Please ensure Python service is running.',
          details: 'Start the service with: cd python-agents && python main.py'
        },
        { status: 503 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `google_adk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session record in database
    const dbSession = await prisma.multiAgentSession.create({
      data: {
        id: finalSessionId,
        userId: session.user.id,
        name: `Google ADK Analysis - ${new Date().toLocaleString()}`,
        description: `Multi-agent analysis using Google ADK coordination with Grok-3: ${userQuery.substring(0, 100)}...`,
        personaIds,
        userQuery,
        status: 'running',
        results: {},
        systemEvents: [],
        workflow: {
          id: 'google_adk_workflow',
          name: 'Google ADK Multi-Agent Coordination',
          description: 'Professional agent coordination using Google ADK with Grok-3 intelligence',
          swimLanes: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      // Call Google ADK service
      console.log(`Starting Google ADK analysis for session ${finalSessionId}`);
      
      const adkResponse = await fetch(`${pythonServiceUrl}/google-adk/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN || 'internal-service'}`,
        },
        body: JSON.stringify({
          session_id: finalSessionId,
          user_query: userQuery,
          persona_ids: personaIds,
        }),
      });

      if (!adkResponse.ok) {
        const errorData = await adkResponse.text();
        throw new Error(`Google ADK service error: ${adkResponse.status} - ${errorData}`);
      }

      const analysis = await adkResponse.json();
      console.log(`Google ADK analysis completed for session ${finalSessionId}`);

      // Update session with results
      await prisma.multiAgentSession.update({
        where: { id: finalSessionId },
        data: {
          status: 'completed',
          results: {
            synthesis: analysis.synthesis,
            persona_responses: analysis.persona_responses,
            analysis: analysis.analysis,
            framework: 'google-adk-with-grok3',
            coordination_system: 'google-adk',
            ai_model: 'grok-3'
          },
          systemEvents: analysis.coordination_events,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        sessionId: finalSessionId,
        synthesis: analysis.synthesis,
        personaResponses: analysis.persona_responses,
        coordinationEvents: analysis.coordination_events,
        analysis: analysis.analysis,
        status: 'completed',
        framework: 'google-adk-with-grok3',
        message: 'Analysis completed using Google ADK coordination with Grok-3 intelligence'
      });

    } catch (analysisError) {
      console.error('Google ADK analysis failed:', analysisError);
      
      // Update session status to failed
      await prisma.multiAgentSession.update({
        where: { id: finalSessionId },
        data: {
          status: 'failed',
          results: { 
            error: 'Google ADK analysis failed',
            framework: 'google-adk-with-grok3'
          },
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        { 
          error: 'Google ADK multi-agent analysis failed',
          sessionId: finalSessionId,
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error',
          suggestion: 'Check if Python Google ADK service is running on port 8000'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Google ADK session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create Google ADK session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      // Return all Google ADK sessions for this user
      const sessions = await prisma.multiAgentSession.findMany({
        where: { 
          userId: session.user.id,
          results: {
            path: ['framework'],
            equals: 'google-adk-with-grok3'
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({ sessions });
    }

    // Return specific session
    const dbSession = await prisma.multiAgentSession.findUnique({
      where: { 
        id: sessionId,
        userId: session.user.id
      },
    });

    if (!dbSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...dbSession,
      isGoogleADK: true,
      coordinationSystem: 'google-adk',
      aiModel: 'grok-3'
    });

  } catch (error) {
    console.error('Failed to get Google ADK sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get Google ADK sessions' },
      { status: 500 }
    );
  }
}
