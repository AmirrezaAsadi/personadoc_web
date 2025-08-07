import { NextRequest, NextResponse } from 'next/server';

// This route redirects to Google ADK since we're using Google ADK instead of LangGraph
export async function POST(request: NextRequest) {
  try {
    const { userQuery, personaIds, sessionId } = await request.json();

    if (!userQuery || !personaIds || !Array.isArray(personaIds)) {
      return NextResponse.json(
        { error: 'Missing userQuery or personaIds' },
        { status: 400 }
      );
    }

    // Redirect to Google ADK endpoint since we're using Google ADK instead of LangGraph
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
      
    const googleADKResponse = await fetch(`${baseUrl}/api/multi-agent-sessions/google-adk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userQuery,
        personaIds,
        sessionId: sessionId || `google_adk_${Date.now()}`
      })
    });

    if (!googleADKResponse.ok) {
      throw new Error(`Google ADK service responded with ${googleADKResponse.status}`);
    }

    const result = await googleADKResponse.json();
    
    return NextResponse.json({
      ...result,
      message: 'Request processed via Google ADK (redirected from LangGraph endpoint)',
      framework: 'google-adk-with-grok3'
    });

  } catch (error) {
    console.error('LangGraph route (redirected to Google ADK) failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process multi-agent request',
        details: 'Using Google ADK coordination with Grok-3 intelligence',
        suggestion: 'Ensure Google ADK service is available'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Redirect to Google ADK endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const url = sessionId 
      ? `${baseUrl}/api/multi-agent-sessions/google-adk?sessionId=${sessionId}`
      : `${baseUrl}/api/multi-agent-sessions/google-adk`;
      
    const googleADKResponse = await fetch(url);
    
    if (!googleADKResponse.ok) {
      throw new Error(`Google ADK service responded with ${googleADKResponse.status}`);
    }
    
    const result = await googleADKResponse.json();
    
    return NextResponse.json({
      ...result,
      note: 'Data served via Google ADK (LangGraph endpoint redirected)',
      framework: 'google-adk-with-grok3'
    });

  } catch (error) {
    console.error('Failed to get sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sessions',
        details: 'Using Google ADK coordination system'
      },
      { status: 500 }
    );
  }
}
