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

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const pythonServiceUrl = (process.env.PYTHON_AGENT_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');
          
          // Generate session ID if not provided
          const finalSessionId = sessionId || `google_adk_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Call the streaming Google ADK endpoint
          const response = await fetch(`${pythonServiceUrl}/google-adk/analyze-stream`, {
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

          if (!response.ok) {
            throw new Error(`Google ADK streaming service error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          // Stream the data
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              
              // Forward the chunk to the client
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          } finally {
            reader.releaseLock();
          }

          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          
          // Send error as SSE event
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown streaming error',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(errorEvent));
          controller.close();
        }
      }
    });

    // Return the stream as Server-Sent Events
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Google ADK streaming session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create Google ADK streaming session' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
