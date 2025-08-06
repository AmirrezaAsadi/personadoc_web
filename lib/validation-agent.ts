import { prisma } from './prisma';
import { rabbitmqService, ValidationMessage } from './rabbitmq';

export interface CreateValidationAgentData {
  name: string;
  description?: string;
  agentType: 'QUALITY' | 'COMPLETENESS' | 'CONSISTENCY' | 'BIAS_DETECTION' | 'RELEVANCE';
  rules: {
    criteria: any[];
    weights: Record<string, number>;
    scoring_method: 'weighted_average' | 'minimum_threshold' | 'composite';
  };
  thresholds: {
    pass_threshold: number;
    warning_threshold: number;
    critical_threshold: number;
  };
}

class ValidationAgentService {
  // Create validation agent
  async createAgent(userId: string, data: CreateValidationAgentData) {
    try {
      const agent = await prisma.validationAgent.create({
        data: {
          name: data.name,
          description: data.description,
          agentType: data.agentType,
          rules: data.rules,
          thresholds: data.thresholds,
          createdBy: userId,
        },
      });

      return agent;
    } catch (error) {
      console.error('Error creating validation agent:', error);
      throw error;
    }
  }

  // Get user's validation agents
  async getUserAgents(userId: string) {
    try {
      return await prisma.validationAgent.findMany({
        where: {
          createdBy: userId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              validationResults: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching user agents:', error);
      throw error;
    }
  }

  // Validate interview session
  async validateSession(sessionId: string, agentId: string) {
    try {
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          participantSessions: {
            where: { status: 'COMPLETED' },
          },
        },
      });

      const agent = await prisma.validationAgent.findUnique({
        where: { id: agentId },
      });

      if (!session || !agent) {
        throw new Error('Session or agent not found');
      }

      let validationResult;

      switch (agent.agentType) {
        case 'QUALITY':
          validationResult = await this.validateQuality(session, agent);
          break;
        case 'COMPLETENESS':
          validationResult = await this.validateCompleteness(session, agent);
          break;
        case 'CONSISTENCY':
          validationResult = await this.validateConsistency(session, agent);
          break;
        case 'BIAS_DETECTION':
          validationResult = await this.validateBias(session, agent);
          break;
        case 'RELEVANCE':
          validationResult = await this.validateRelevance(session, agent);
          break;
        default:
          throw new Error('Unknown validation type');
      }

      // Store validation result
      const result = await prisma.validationResult.create({
        data: {
          sessionId,
          agentId,
          score: validationResult.score,
          issues: validationResult.issues,
          recommendations: validationResult.recommendations,
          status: validationResult.status,
        },
      });

      // Publish validation message
      await rabbitmqService.publishMessage(
        'validation_events',
        `validation.${agent.agentType.toLowerCase()}`,
        {
          sessionId,
          agentId,
          type: agent.agentType.toLowerCase(),
          data: validationResult,
          timestamp: Date.now(),
        } as ValidationMessage
      );

      return result;
    } catch (error) {
      console.error('Error validating session:', error);
      throw error;
    }
  }

  // Quality validation
  private async validateQuality(session: any, agent: any) {
    const responses = this.extractAllResponses(session.participantSessions);
    const rules = agent.rules as any;
    const thresholds = agent.thresholds as any;

    let score = 0;
    const issues: any[] = [];
    const recommendations: any[] = [];

    // Check response length and detail
    const avgResponseLength = responses.reduce((sum: number, r: string) => sum + r.length, 0) / responses.length;
    if (avgResponseLength < rules.criteria.min_response_length || 50) {
      score -= 0.2;
      issues.push({
        type: 'short_responses',
        severity: 'medium',
        description: 'Responses are too brief for meaningful analysis',
      });
      recommendations.push({
        action: 'encourage_detailed_responses',
        description: 'Add follow-up questions to elicit more detailed responses',
      });
    }

    // Check for coherence and relevance
    const coherenceScore = this.calculateCoherenceScore(responses);
    score += coherenceScore * 0.4;

    // Check for completeness
    const completionRate = session.participantSessions.length > 0 
      ? session.participantSessions[0].progress || 0 
      : 0;
    score += completionRate * 0.4;

    if (completionRate < 0.8) {
      issues.push({
        type: 'incomplete_interview',
        severity: 'high',
        description: 'Interview was not completed',
      });
    }

    // Determine status based on score and thresholds
    let status: 'PASSED' | 'WARNING' | 'FAILED';
    if (score >= thresholds.pass_threshold) {
      status = 'PASSED';
    } else if (score >= thresholds.warning_threshold) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    return { score: Math.max(0, Math.min(1, score)), issues, recommendations, status };
  }

  // Completeness validation
  private async validateCompleteness(session: any, agent: any) {
    const thresholds = agent.thresholds as any;
    const questions = session.questions as any[] || [];
    const responses = this.extractAllResponses(session.participantSessions);

    let score = 0;
    const issues: any[] = [];
    const recommendations: any[] = [];

    // Calculate response rate
    const responseRate = responses.length / questions.length;
    score += responseRate * 0.6;

    // Check for unanswered required questions
    const requiredQuestions = questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter((_, index) => 
      responses[index] && responses[index].trim().length > 0
    );
    
    const requiredCompletionRate = answeredRequired.length / requiredQuestions.length;
    score += requiredCompletionRate * 0.4;

    if (requiredCompletionRate < 1.0) {
      issues.push({
        type: 'missing_required_responses',
        severity: 'high',
        description: `${requiredQuestions.length - answeredRequired.length} required questions unanswered`,
      });
      recommendations.push({
        action: 'follow_up_required',
        description: 'Send follow-up interview for missing required information',
      });
    }

    let status: 'PASSED' | 'WARNING' | 'FAILED';
    if (score >= thresholds.pass_threshold) {
      status = 'PASSED';
    } else if (score >= thresholds.warning_threshold) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    return { score: Math.max(0, Math.min(1, score)), issues, recommendations, status };
  }

  // Consistency validation
  private async validateConsistency(session: any, agent: any) {
    const responses = this.extractAllResponses(session.participantSessions);
    const thresholds = agent.thresholds as any;

    let score = 0.8; // Start with good score
    const issues: any[] = [];
    const recommendations: any[] = [];

    // Check for contradictory statements
    const contradictions = this.detectContradictions(responses);
    if (contradictions.length > 0) {
      score -= contradictions.length * 0.1;
      contradictions.forEach(contradiction => {
        issues.push({
          type: 'contradiction',
          severity: 'medium',
          description: `Contradictory responses found: ${contradiction.description}`,
          responses: contradiction.responses,
        });
      });
      recommendations.push({
        action: 'clarify_contradictions',
        description: 'Follow up on contradictory responses for clarification',
      });
    }

    // Check for temporal consistency
    const temporalIssues = this.checkTemporalConsistency(responses);
    if (temporalIssues.length > 0) {
      score -= temporalIssues.length * 0.05;
      issues.push(...temporalIssues);
    }

    let status: 'PASSED' | 'WARNING' | 'FAILED';
    if (score >= thresholds.pass_threshold) {
      status = 'PASSED';
    } else if (score >= thresholds.warning_threshold) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    return { score: Math.max(0, Math.min(1, score)), issues, recommendations, status };
  }

  // Bias detection validation
  private async validateBias(session: any, agent: any) {
    const responses = this.extractAllResponses(session.participantSessions);
    const thresholds = agent.thresholds as any;

    let score = 1.0; // Start perfect, reduce for detected bias
    const issues: any[] = [];
    const recommendations: any[] = [];

    // Check for leading question bias
    const leadingQuestionBias = this.detectLeadingQuestionBias(session.questions);
    if (leadingQuestionBias.length > 0) {
      score -= leadingQuestionBias.length * 0.1;
      issues.push(...leadingQuestionBias);
    }

    // Check for response bias patterns
    const responseBias = this.detectResponseBias(responses);
    if (responseBias.length > 0) {
      score -= responseBias.length * 0.05;
      issues.push(...responseBias);
    }

    // Check for demographic bias
    const demographicBias = this.detectDemographicBias(responses);
    if (demographicBias.length > 0) {
      score -= demographicBias.length * 0.1;
      issues.push(...demographicBias);
      recommendations.push({
        action: 'diversify_questions',
        description: 'Include questions that capture diverse perspectives',
      });
    }

    let status: 'PASSED' | 'WARNING' | 'FAILED';
    if (score >= thresholds.pass_threshold) {
      status = 'PASSED';
    } else if (score >= thresholds.warning_threshold) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    return { score: Math.max(0, Math.min(1, score)), issues, recommendations, status };
  }

  // Relevance validation
  private async validateRelevance(session: any, agent: any) {
    const responses = this.extractAllResponses(session.participantSessions);
    const researchFocus = session.researchFocus as string[] || [];
    const thresholds = agent.thresholds as any;

    let score = 0;
    const issues: any[] = [];
    const recommendations: any[] = [];

    // Calculate relevance to research focus
    const relevanceScore = this.calculateRelevanceScore(responses, researchFocus);
    score += relevanceScore * 0.8;

    // Check for off-topic responses
    const offTopicResponses = this.detectOffTopicResponses(responses, researchFocus);
    if (offTopicResponses.length > 0) {
      score -= offTopicResponses.length * 0.05;
      issues.push({
        type: 'off_topic_responses',
        severity: 'low',
        description: `${offTopicResponses.length} responses appear off-topic`,
      });
    }

    // Check for sufficient depth
    const depthScore = this.calculateDepthScore(responses);
    score += depthScore * 0.2;

    if (depthScore < 0.5) {
      recommendations.push({
        action: 'increase_depth',
        description: 'Add follow-up questions to gather more in-depth information',
      });
    }

    let status: 'PASSED' | 'WARNING' | 'FAILED';
    if (score >= thresholds.pass_threshold) {
      status = 'PASSED';
    } else if (score >= thresholds.warning_threshold) {
      status = 'WARNING';
    } else {
      status = 'FAILED';
    }

    return { score: Math.max(0, Math.min(1, score)), issues, recommendations, status };
  }

  // Helper methods
  private extractAllResponses(participantSessions: any[]): string[] {
    const allResponses: string[] = [];
    participantSessions.forEach(session => {
      const responses = session.responses as any || {};
      Object.values(responses).forEach((response: any) => {
        if (response.response) {
          allResponses.push(response.response);
        }
      });
    });
    return allResponses;
  }

  private calculateCoherenceScore(responses: string[]): number {
    // Simple coherence calculation based on response length variation
    if (responses.length === 0) return 0;
    
    const lengths = responses.map(r => r.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Lower variance indicates more consistent response quality
    return Math.max(0, 1 - (variance / (avgLength * avgLength)));
  }

  private detectContradictions(responses: string[]): any[] {
    // Simplified contradiction detection
    const contradictions: any[] = [];
    
    // Look for obvious contradictory keywords
    const contradictoryPairs = [
      ['love', 'hate'],
      ['always', 'never'],
      ['frequently', 'rarely'],
      ['important', 'unimportant'],
    ];

    contradictoryPairs.forEach(pair => {
      const hasFirst = responses.some(r => r.toLowerCase().includes(pair[0]));
      const hasSecond = responses.some(r => r.toLowerCase().includes(pair[1]));
      
      if (hasFirst && hasSecond) {
        contradictions.push({
          description: `Contains both "${pair[0]}" and "${pair[1]}"`,
          responses: responses.filter(r => 
            r.toLowerCase().includes(pair[0]) || r.toLowerCase().includes(pair[1])
          ),
        });
      }
    });

    return contradictions;
  }

  private checkTemporalConsistency(responses: string[]): any[] {
    // Simplified temporal consistency check
    return []; // Would implement timeline analysis in production
  }

  private detectLeadingQuestionBias(questions: any[]): any[] {
    const bias: any[] = [];
    const leadingWords = ['should', 'must', 'obviously', 'clearly', 'don\'t you think'];
    
    questions.forEach((q, index) => {
      if (leadingWords.some(word => q.question?.toLowerCase().includes(word))) {
        bias.push({
          type: 'leading_question',
          severity: 'medium',
          description: `Question ${index + 1} appears to be leading`,
          question: q.question,
        });
      }
    });

    return bias;
  }

  private detectResponseBias(responses: string[]): any[] {
    const bias: any[] = [];
    
    // Check for extremely positive or negative bias
    const positiveWords = ['excellent', 'amazing', 'perfect', 'love'];
    const negativeWords = ['terrible', 'awful', 'hate', 'worst'];
    
    const positiveCount = responses.filter(r => 
      positiveWords.some(word => r.toLowerCase().includes(word))
    ).length;
    
    const negativeCount = responses.filter(r => 
      negativeWords.some(word => r.toLowerCase().includes(word))
    ).length;

    if (positiveCount > responses.length * 0.8) {
      bias.push({
        type: 'extreme_positive_bias',
        severity: 'medium',
        description: 'Responses show extreme positive bias',
      });
    }

    if (negativeCount > responses.length * 0.8) {
      bias.push({
        type: 'extreme_negative_bias',
        severity: 'medium',
        description: 'Responses show extreme negative bias',
      });
    }

    return bias;
  }

  private detectDemographicBias(responses: string[]): any[] {
    // Simplified demographic bias detection
    return []; // Would implement sophisticated bias detection in production
  }

  private calculateRelevanceScore(responses: string[], researchFocus: string[]): number {
    if (researchFocus.length === 0) return 1.0;
    
    let relevantResponses = 0;
    responses.forEach(response => {
      const isRelevant = researchFocus.some(focus => 
        response.toLowerCase().includes(focus.toLowerCase())
      );
      if (isRelevant) relevantResponses++;
    });

    return responses.length > 0 ? relevantResponses / responses.length : 0;
  }

  private detectOffTopicResponses(responses: string[], researchFocus: string[]): string[] {
    if (researchFocus.length === 0) return [];
    
    return responses.filter(response => {
      return !researchFocus.some(focus => 
        response.toLowerCase().includes(focus.toLowerCase())
      );
    });
  }

  private calculateDepthScore(responses: string[]): number {
    if (responses.length === 0) return 0;
    
    const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
    const hasDetailWords = responses.filter(r => 
      ['because', 'specifically', 'example', 'detail', 'particularly'].some(word => 
        r.toLowerCase().includes(word)
      )
    ).length;

    const lengthScore = Math.min(1, avgLength / 200); // Normalize to 200 chars
    const detailScore = hasDetailWords / responses.length;

    return (lengthScore + detailScore) / 2;
  }

  // Get validation results for session
  async getSessionValidationResults(sessionId: string) {
    try {
      return await prisma.validationResult.findMany({
        where: { sessionId },
        include: {
          agent: true,
        },
        orderBy: {
          processedAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching validation results:', error);
      throw error;
    }
  }
}

export const validationAgentService = new ValidationAgentService();
