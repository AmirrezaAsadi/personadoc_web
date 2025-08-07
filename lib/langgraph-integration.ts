// TypeScript integration layer for LangGraph multi-agent system

export interface LangGraphMultiAgentRequest {
  session_id: string;
  user_query: string;
  persona_ids: string[];
}

export interface LangGraphMultiAgentResponse {
  session_id: string;
  synthesis: string;
  persona_responses: Record<string, any>;
  coordination_events: CoordinationEvent[];
  analysis: any;
}

export interface CoordinationEvent {
  timestamp: string;
  agent: string;
  action: string;
  details: any;
}

export class LangGraphIntegration {
  private pythonServiceUrl: string;
  private apiToken: string;

  constructor() {
    this.pythonServiceUrl = process.env.PYTHON_AGENT_SERVICE_URL || 'http://localhost:8000';
    this.apiToken = process.env.API_TOKEN || 'your-api-token';
  }

  /**
   * Run multi-agent analysis using LangGraph
   */
  async runMultiAgentAnalysis(
    sessionId: string,
    userQuery: string,
    personaIds: string[]
  ): Promise<LangGraphMultiAgentResponse> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/multi-agent/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_query: userQuery,
          persona_ids: personaIds,
        } as LangGraphMultiAgentRequest),
      });

      if (!response.ok) {
        throw new Error(`LangGraph service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to run LangGraph analysis:', error);
      throw new Error('Multi-agent analysis failed');
    }
  }

  /**
   * Get real-time coordination events for a session
   */
  async getSessionEvents(sessionId: string): Promise<CoordinationEvent[]> {
    try {
      const response = await fetch(
        `${this.pythonServiceUrl}/multi-agent/session/${sessionId}/events`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get session events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.coordination_events || [];
    } catch (error) {
      console.error('Failed to get session events:', error);
      return [];
    }
  }

  /**
   * Create WebSocket connection for real-time updates
   */
  createRealtimeConnection(sessionId: string): WebSocket {
    const wsUrl = this.pythonServiceUrl.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/multi-agent/session/${sessionId}/stream`);
  }

  /**
   * Health check for the Python service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const langGraphIntegration = new LangGraphIntegration();
