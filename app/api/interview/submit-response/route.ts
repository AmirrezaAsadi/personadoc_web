import { NextRequest, NextResponse } from 'next/server';
import { interviewBotService } from '@/lib/interview-bot';
import { z } from 'zod';

const submitResponseSchema = z.object({
  participantSessionId: z.string().min(1, 'Participant session ID is required'),
  questionIndex: z.number().min(0),
  response: z.string().min(1, 'Response is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = submitResponseSchema.parse(body);

    const result = await interviewBotService.submitResponse(
      validatedData.participantSessionId,
      validatedData.questionIndex,
      validatedData.response
    );

    // If there's a next question, fetch it
    let nextQuestion = null;
    if (result.nextQuestionIndex !== undefined) {
      // Get session to fetch next question
      const participantSession = await interviewBotService.getSessionByToken(''); // We need to modify this
      // For now, we'll return the result without the next question
    }

    return NextResponse.json({
      ...result,
      nextQuestion,
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit response' },
      { status: 400 }
    );
  }
}
