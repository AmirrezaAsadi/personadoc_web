import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userQuery, personaIds, sessionId } = await request.json();

    if (!userQuery || !personaIds || !Array.isArray(personaIds)) {
      return NextResponse.json(
        { error: 'Missing userQuery or personaIds' },
        { status: 400 }
      );
    }

    // Check if Python Google ADK service is available
    const pythonServiceUrl = (process.env.PYTHON_AGENT_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
    
    try {
      const healthResponse = await fetch(`${pythonServiceUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!healthResponse.ok) {
        console.error(`Health check failed with status: ${healthResponse.status}`);
        throw new Error('Google ADK service unavailable');
      }
      
      const healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
      
    } catch (error) {
      console.error('Health check error:', error);
      return NextResponse.json(
        { 
          error: 'Google ADK multi-agent service is unavailable. Please ensure Python service is running.',
          details: 'Start the service with: cd python-agents && python main.py',
          debug: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `google_adk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ 
        sessions: [],
        message: 'Google ADK sessions available'
      });
    }

    return NextResponse.json({
      sessionId,
      status: 'available',
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
