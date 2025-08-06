import { prisma } from './prisma';
import { rabbitmqService, InterviewMessage } from './rabbitmq';
import { v4 as uuidv4 } from 'uuid';

export interface CreateInterviewBotData {
  name: string;
  description?: string;
  personality: {
    tone: 'professional' | 'casual' | 'empathetic' | 'analytical';
    adaptability: 'high' | 'medium' | 'low';
    probing_style: 'gentle' | 'direct' | 'exploratory';
    follow_up_frequency: 'high' | 'medium' | 'low';
  };
  interviewStyle: {
    question_depth: 'surface' | 'moderate' | 'deep';
    conversation_flow: 'structured' | 'adaptive' | 'free_form';
    time_management: 'strict' | 'flexible';
    clarification_threshold: number; // 0-1
  };
  researchQuestions: Array<{
    category: string;
    questions: string[];
    priority: 'high' | 'medium' | 'low';
    adaptive_conditions: string[];
  }>;
  adaptiveBehavior: {
    response_analysis: boolean;
    sentiment_adjustment: boolean;
    topic_pivoting: boolean;
    completion_optimization: boolean;
  };
}

export interface CreateInterviewSessionData {
  botId: string;
  personaId?: string;
  title: string;
  description?: string;
  researchFocus: string[];
  participantEmail?: string;
  participantName?: string;
  estimatedDuration?: number;
  maxParticipants?: number;
  expiresIn?: number; // Hours from now
}

class InterviewBotService {
  // Create a new interview bot
  async createBot(userId: string, data: CreateInterviewBotData) {
    try {
      const bot = await prisma.interviewBot.create({
        data: {
          name: data.name,
          description: data.description,
          personality: data.personality,
          interviewStyle: data.interviewStyle,
          researchQuestions: data.researchQuestions,
          adaptiveBehavior: data.adaptiveBehavior,
          createdBy: userId,
        },
      });

      return bot;
    } catch (error) {
      console.error('Error creating interview bot:', error);
      throw error;
    }
  }

  // Get user's interview bots
  async getUserBots(userId: string) {
    try {
      return await prisma.interviewBot.findMany({
        where: {
          createdBy: userId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              interviewSessions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching user bots:', error);
      throw error;
    }
  }

  // Create interview session
  async createSession(userId: string, data: CreateInterviewSessionData) {
    try {
      const sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (data.expiresIn || 24));

      // Generate initial questions based on bot configuration
      const bot = await prisma.interviewBot.findUnique({
        where: { id: data.botId },
      });

      if (!bot) {
        throw new Error('Interview bot not found');
      }

      const initialQuestions = this.generateInitialQuestions(
        bot.researchQuestions as any,
        data.researchFocus
      );

      const session = await prisma.interviewSession.create({
        data: {
          botId: data.botId,
          personaId: data.personaId,
          sessionToken,
          title: data.title,
          description: data.description,
          researchFocus: data.researchFocus,
          participantEmail: data.participantEmail,
          participantName: data.participantName,
          questions: initialQuestions,
          responses: {},
          estimatedDuration: data.estimatedDuration,
          maxParticipants: data.maxParticipants || 1,
          expiresAt,
          createdBy: userId,
        },
        include: {
          bot: true,
          persona: true,
        },
      });

      // Publish session creation message
      await rabbitmqService.publishMessage(
        'interview_events',
        'interview.start',
        {
          sessionId: session.id,
          botId: session.botId,
          type: 'start',
          payload: {
            sessionToken: session.sessionToken,
            title: session.title,
            estimatedDuration: session.estimatedDuration,
          },
          timestamp: Date.now(),
        } as InterviewMessage
      );

      return session;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }

  // Get interview session by token
  async getSessionByToken(token: string) {
    try {
      return await prisma.interviewSession.findUnique({
        where: { sessionToken: token },
        include: {
          bot: true,
          persona: true,
          participantSessions: {
            where: { status: 'ACTIVE' },
          },
        },
      });
    } catch (error) {
      console.error('Error fetching session by token:', error);
      throw error;
    }
  }

  // Join interview session
  async joinSession(sessionToken: string, participantData?: { userId?: string; anonymousId?: string }) {
    try {
      const session = await this.getSessionByToken(sessionToken);
      
      if (!session) {
        throw new Error('Interview session not found');
      }

      if (session.status !== 'PENDING' && session.status !== 'ACTIVE') {
        throw new Error('Interview session is not available');
      }

      if (session.expiresAt < new Date()) {
        throw new Error('Interview session has expired');
      }

      if (session.currentParticipants >= session.maxParticipants) {
        throw new Error('Interview session is full');
      }

      // Create participant session
      const participantSession = await prisma.participantSession.create({
        data: {
          sessionId: session.id,
          participantId: participantData?.userId,
          anonymousId: participantData?.anonymousId || uuidv4(),
          responses: {},
        },
      });

      // Update session status and participant count
      await prisma.interviewSession.update({
        where: { id: session.id },
        data: {
          status: 'ACTIVE',
          currentParticipants: {
            increment: 1,
          },
        },
      });

      return participantSession;
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  }

  // Submit response to interview question
  async submitResponse(
    participantSessionId: string,
    questionIndex: number,
    response: string
  ) {
    try {
      const participantSession = await prisma.participantSession.findUnique({
        where: { id: participantSessionId },
        include: {
          session: {
            include: { bot: true },
          },
        },
      });

      if (!participantSession) {
        throw new Error('Participant session not found');
      }

      // Update responses
      const responses = participantSession.responses as any || {};
      responses[questionIndex] = {
        response,
        timestamp: new Date().toISOString(),
      };

      const progress = (questionIndex + 1) / (participantSession.session.questions as any[]).length;

      await prisma.participantSession.update({
        where: { id: participantSessionId },
        data: {
          responses,
          currentQuestionIndex: questionIndex + 1,
          progress,
          lastActiveAt: new Date(),
        },
      });

      // Publish response message for processing
      await rabbitmqService.publishMessage(
        'interview_events',
        'interview.response',
        {
          sessionId: participantSession.sessionId,
          botId: participantSession.session.botId,
          participantId: participantSession.participantId,
          type: 'response',
          payload: {
            questionIndex,
            response,
            progress,
          },
          timestamp: Date.now(),
        } as InterviewMessage
      );

      // Check if interview is complete
      if (progress >= 1.0) {
        await this.completeParticipantSession(participantSessionId);
      }

      return { success: true, progress, nextQuestionIndex: questionIndex + 1 };
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  }

  // Complete participant session
  private async completeParticipantSession(participantSessionId: string) {
    try {
      const participantSession = await prisma.participantSession.update({
        where: { id: participantSessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          session: true,
        },
      });

      // Publish completion message
      await rabbitmqService.publishMessage(
        'interview_events',
        'interview.complete',
        {
          sessionId: participantSession.sessionId,
          botId: participantSession.session.botId,
          participantId: participantSession.participantId,
          type: 'complete',
          payload: {
            responses: participantSession.responses,
            duration: participantSession.completedAt
              ? new Date(participantSession.completedAt).getTime() - new Date(participantSession.startedAt).getTime()
              : 0,
          },
          timestamp: Date.now(),
        } as InterviewMessage
      );

      // Check if all participants completed
      const activeSessions = await prisma.participantSession.count({
        where: {
          sessionId: participantSession.sessionId,
          status: 'ACTIVE',
        },
      });

      if (activeSessions === 0) {
        await prisma.interviewSession.update({
          where: { id: participantSession.sessionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }

      return participantSession;
    } catch (error) {
      console.error('Error completing participant session:', error);
      throw error;
    }
  }

  // Generate initial questions based on bot configuration and research focus
  private generateInitialQuestions(
    researchQuestions: any[],
    researchFocus: string[]
  ): any[] {
    const questions: any[] = [];
    
    // Filter questions by research focus
    const relevantQuestions = researchQuestions.filter(category =>
      researchFocus.some(focus => 
        category.category.toLowerCase().includes(focus.toLowerCase()) ||
        category.questions.some((q: string) => 
          q.toLowerCase().includes(focus.toLowerCase())
        )
      )
    );

    // Add high priority questions first
    relevantQuestions
      .filter(category => category.priority === 'high')
      .forEach(category => {
        category.questions.forEach((question: string) => {
          questions.push({
            id: uuidv4(),
            category: category.category,
            question,
            priority: category.priority,
            required: true,
          });
        });
      });

    // Add medium priority questions
    relevantQuestions
      .filter(category => category.priority === 'medium')
      .forEach(category => {
        category.questions.slice(0, 2).forEach((question: string) => {
          questions.push({
            id: uuidv4(),
            category: category.category,
            question,
            priority: category.priority,
            required: false,
          });
        });
      });

    return questions;
  }

  // Get user's interview sessions
  async getUserSessions(userId: string) {
    try {
      return await prisma.interviewSession.findMany({
        where: {
          createdBy: userId,
        },
        include: {
          bot: true,
          persona: true,
          _count: {
            select: {
              participantSessions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }
}

export const interviewBotService = new InterviewBotService();
