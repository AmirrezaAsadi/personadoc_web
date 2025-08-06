import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { interviewBotService, CreateInterviewSessionData } from '@/lib/interview-bot';
import { z } from 'zod';

const createSessionSchema = z.object({
  botId: z.string().min(1, 'Bot ID is required'),
  personaId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  researchFocus: z.array(z.string()),
  participantEmail: z.string().email().optional(),
  participantName: z.string().optional(),
  estimatedDuration: z.number().optional(),
  maxParticipants: z.number().min(1).optional(),
  expiresIn: z.number().min(1).max(168).optional(), // Max 1 week
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await interviewBotService.getUserSessions((session.user as any).id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const interviewSession = await interviewBotService.createSession(
      (session.user as any).id,
      validatedData as CreateInterviewSessionData
    );

    return NextResponse.json(interviewSession, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating interview session:', error);
    return NextResponse.json(
      { error: 'Failed to create interview session' },
      { status: 500 }
    );
  }
}
