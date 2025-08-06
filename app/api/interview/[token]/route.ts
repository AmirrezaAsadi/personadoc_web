import { NextRequest, NextResponse } from 'next/server';
import { interviewBotService } from '@/lib/interview-bot';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const session = await interviewBotService.getSessionByToken(token);
    
    if (!session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
    }

    if (session.status === 'EXPIRED' || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Interview session has expired' }, { status: 410 });
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Interview session is already completed' }, { status: 410 });
    }

    if (session.currentParticipants >= session.maxParticipants) {
      return NextResponse.json({ error: 'Interview session is full' }, { status: 403 });
    }

    // Return session info without sensitive data
    return NextResponse.json({
      id: session.id,
      title: session.title,
      description: session.description,
      estimatedDuration: session.estimatedDuration,
      status: session.status,
      bot: {
        name: session.bot.name,
        description: session.bot.description,
      },
      currentParticipants: session.currentParticipants,
      maxParticipants: session.maxParticipants,
    });
  } catch (error) {
    console.error('Error fetching interview session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview session' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { participantData } = body;

    const participantSession = await interviewBotService.joinSession(
      token,
      participantData
    );

    // Get the first question
    const session = await interviewBotService.getSessionByToken(token);
    const questions = session?.questions as any[] || [];
    const firstQuestion = questions[0];

    return NextResponse.json({
      participantSessionId: participantSession.id,
      currentQuestion: firstQuestion,
      totalQuestions: questions.length,
      progress: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Error joining interview session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join interview session' },
      { status: 400 }
    );
  }
}
