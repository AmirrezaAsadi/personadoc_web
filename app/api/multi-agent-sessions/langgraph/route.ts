import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { langGraphIntegration } from '@/lib/langgraph-integration';
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

    // Check if Python LangGraph service is available
    const isHealthy = await langGraphIntegration.healthCheck();
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'LangGraph multi-agent service is unavailable. Please check Python service.' },
        { status: 503 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `langgraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session record in database
    const dbSession = await prisma.multiAgentSession.create({
      data: {
        id: finalSessionId,
        userId: session.user.id,
        name: `LangGraph Analysis - ${new Date().toLocaleString()}`,
        description: `Multi-agent analysis using LangGraph: ${userQuery.substring(0, 100)}...`,
        personaIds,
        userQuery,
        status: 'running',
        results: {},
        systemEvents: [],
        workflow: {
          id: 'langgraph_workflow',
          name: 'LangGraph Multi-Agent Workflow',
          description: 'Professional multi-agent analysis using LangGraph framework',
          swimLanes: []
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    try {
      // Run LangGraph multi-agent analysis
      console.log(`Starting LangGraph analysis for session ${finalSessionId}`);
      
      const analysis = await langGraphIntegration.runMultiAgentAnalysis(
        finalSessionId,
        userQuery,
        personaIds
      );

      console.log(`LangGraph analysis completed for session ${finalSessionId}`);

      // Update session with results
      await prisma.multiAgentSession.update({
        where: { id: finalSessionId },
        data: {
          status: 'completed',
          results: {
            synthesis: analysis.synthesis,
            persona_responses: analysis.persona_responses,
            analysis: analysis.analysis,
            framework: 'langgraph'
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
        framework: 'langgraph',
        message: 'Analysis completed using LangGraph multi-agent system'
      });

    } catch (analysisError) {
      console.error('LangGraph analysis failed:', analysisError);
      
      // Update session status to failed
      await prisma.multiAgentSession.update({
        where: { id: finalSessionId },
        data: {
          status: 'failed',
          results: { 
            error: 'LangGraph analysis failed',
            framework: 'langgraph'
          },
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        { 
          error: 'LangGraph multi-agent analysis failed',
          sessionId: finalSessionId,
          details: analysisError instanceof Error ? analysisError.message : 'Unknown error',
          suggestion: 'Check if Python LangGraph service is running on port 8000'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('LangGraph session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create LangGraph session' },
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
      // Return all LangGraph sessions for this user
      const sessions = await prisma.multiAgentSession.findMany({
        where: { 
          userId: session.user.id,
          results: {
            path: ['framework'],
            equals: 'langgraph'
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

    // Get real-time coordination events from LangGraph service
    const coordinationEvents = await langGraphIntegration.getSessionEvents(sessionId);

    return NextResponse.json({
      ...dbSession,
      coordinationEvents,
      isLangGraph: true
    });

  } catch (error) {
    console.error('Failed to get LangGraph sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get LangGraph sessions' },
      { status: 500 }
    );
  }
}
