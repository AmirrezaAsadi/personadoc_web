import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { interviewBotService, CreateInterviewBotData } from '@/lib/interview-bot';
import { z } from 'zod';

const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  personality: z.object({
    tone: z.enum(['professional', 'casual', 'empathetic', 'analytical']),
    adaptability: z.enum(['high', 'medium', 'low']),
    probing_style: z.enum(['gentle', 'direct', 'exploratory']),
    follow_up_frequency: z.enum(['high', 'medium', 'low']),
  }),
  interviewStyle: z.object({
    question_depth: z.enum(['surface', 'moderate', 'deep']),
    conversation_flow: z.enum(['structured', 'adaptive', 'free_form']),
    time_management: z.enum(['strict', 'flexible']),
    clarification_threshold: z.number().min(0).max(1),
  }),
  researchQuestions: z.array(z.object({
    category: z.string(),
    questions: z.array(z.string()),
    priority: z.enum(['high', 'medium', 'low']),
    adaptive_conditions: z.array(z.string()),
  })),
  adaptiveBehavior: z.object({
    response_analysis: z.boolean(),
    sentiment_adjustment: z.boolean(),
    topic_pivoting: z.boolean(),
    completion_optimization: z.boolean(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bots = await interviewBotService.getUserBots((session.user as any).id);
    return NextResponse.json(bots);
  } catch (error) {
    console.error('Error fetching interview bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview bots' },
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
    const validatedData = createBotSchema.parse(body);

    const bot = await interviewBotService.createBot(
      (session.user as any).id,
      validatedData as CreateInterviewBotData
    );

    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating interview bot:', error);
    return NextResponse.json(
      { error: 'Failed to create interview bot' },
      { status: 500 }
    );
  }
}
