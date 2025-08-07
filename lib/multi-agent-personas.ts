import { rabbitmqService } from './rabbitmq';
import { prisma } from './prisma';
import { grok } from './grok';

// Use Grok-3 for AI completions

export interface WorkflowAction {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedTime?: string;
}

export interface WorkflowLane {
  id: string;
  name: string;
  personaId: string;
  color: string;
  description?: string;
  actions: WorkflowAction[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  swimLanes: WorkflowLane[];
  collaborationType: 'sequential' | 'parallel' | 'hybrid';
}

export interface PersonaAgent {
  id: string;
  personaId: string;
  name: string;
  personality: any;
  demographics: any;
  status: 'idle' | 'thinking' | 'responding' | 'listening' | 'acting' | 'waiting_for_system';
  lastActivity: Date;
  messageCount: number;
  currentAction?: WorkflowAction;
  workflowLane?: WorkflowLane;
  pendingSystemResponse?: boolean;
  lastSystemInteraction?: Date;
}

export interface SystemAgent {
  id: string;
  name: string;
  type: 'coordinator' | 'feedback_provider' | 'event_generator';
  status: 'active' | 'monitoring' | 'responding';
  capabilities: string[];
  responsePatterns: {
    success: string[];
    error: string[];
    guidance: string[];
    confirmation: string[];
  };
}

export interface AgentMessage {
  sessionId: string;
  fromAgentId: string;
  toAgentId?: string; // Optional for broadcast messages
  type: 'direct' | 'broadcast' | 'coordination' | 'analysis' | 'workflow_action' | 'system_feedback';
  content: string;
  timestamp: number;
  metadata?: any;
  workflowAction?: WorkflowAction;
}

export interface SystemEvent {
  id: string;
  sessionId: string;
  type: 'system_response' | 'error' | 'notification' | 'state_change' | 'validation';
  content: string;
  timestamp: number;
  triggeredBy?: string;
  affectedAgents: string[];
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
}

export interface CoordinationEvent {
  id: string;
  sessionId: string;
  type: 'agent_interaction' | 'system_intervention' | 'workflow_coordination' | 'conflict_resolution';
  description: string;
  participants: string[];
  outcome: string;
  timestamp: number;
  metadata?: any;
}

export interface MultiAgentSession {
  id: string;
  name: string;
  description: string;
  workflow?: Workflow;
  systemInfo?: any;
  agents: PersonaAgent[];
  systemAgent: SystemAgent;
  status: 'initializing' | 'active' | 'completed' | 'error';
  startedAt: Date;
  messages: AgentMessage[];
  systemEvents: SystemEvent[];
  analysisResults?: any;
  currentStep?: number;
  coordinationLog: CoordinationEvent[];
}

class MultiAgentPersonaSystem {
  private sessions: Map<string, MultiAgentSession> = new Map();
  private agents: Map<string, PersonaAgent> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize RabbitMQ
      await rabbitmqService.connect();
      
      // Set up message consumers
      await this.setupMessageConsumers();
      
      this.isInitialized = true;
      console.log('✅ Multi-Agent Persona System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Multi-Agent System:', error);
      // Continue without RabbitMQ - use in-memory mode
      this.isInitialized = true;
    }
  }

  private async setupMessageConsumers(): Promise<void> {
    // Listen for agent messages
    await rabbitmqService.consumeMessages('agent.message', async (message: AgentMessage) => {
      await this.handleAgentMessage(message);
    });

    // Listen for agent coordination
    await rabbitmqService.consumeMessages('agent.coordination', async (message: any) => {
      await this.handleCoordinationMessage(message);
    });
  }

  async createMultiAgentSession(
    name: string,
    description: string,
    personaIds: string[],
    workflow?: Workflow,
    systemInfo?: any,
    topic?: string
  ): Promise<MultiAgentSession> {
    await this.initialize();

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fetch personas from database
    const personas = await prisma.persona.findMany({
      where: {
        id: { in: personaIds }
      },
      select: {
        id: true,
        name: true,
        age: true,
        occupation: true,
        location: true,
        personalityTraits: true,
        interests: true,
        introduction: true
      }
    });

    // Create agent instances with workflow context
    const agents: PersonaAgent[] = personas.map(persona => {
      const workflowLane = workflow?.swimLanes.find(lane => lane.personaId === persona.id);
      return {
        id: `agent_${persona.id}_${Date.now()}`,
        personaId: persona.id,
        name: persona.name,
        personality: persona.personalityTraits,
        demographics: {
          age: persona.age,
          occupation: persona.occupation,
          location: persona.location,
          introduction: persona.introduction
        },
        status: 'idle',
        lastActivity: new Date(),
        messageCount: 0,
        workflowLane,
        currentAction: workflowLane?.actions[0] // Start with first action
      };
    });

    // Create system agent
    const systemAgent: SystemAgent = {
      id: `system_${sessionId}`,
      name: 'System Coordinator',
      type: 'coordinator',
      status: 'active',
      capabilities: ['event_simulation', 'feedback_generation', 'coordination', 'validation'],
      responsePatterns: {
        success: ['Action completed successfully', 'System updated', 'Changes saved'],
        error: ['Operation failed', 'System error occurred', 'Please try again'],
        guidance: ['Try this approach', 'Consider this option', 'Here\'s a suggestion'],
        confirmation: ['Please confirm', 'Are you sure?', 'Verify this action']
      }
    };

    // Create session
    const session: MultiAgentSession = {
      id: sessionId,
      name,
      description,
      workflow,
      systemInfo,
      agents,
      systemAgent,
      status: 'initializing',
      startedAt: new Date(),
      messages: [],
      systemEvents: [],
      analysisResults: null,
      currentStep: 0,
      coordinationLog: []
    };

    this.sessions.set(sessionId, session);
    
    // Register agents
    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    // Start the workflow execution or conversation
    if (workflow) {
      await this.initiateWorkflowExecution(session);
    } else if (topic) {
      await this.initiateAgentConversation(session, topic);
    }

    return session;
  }

  private async initiateWorkflowExecution(session: MultiAgentSession): Promise<void> {
    if (!session.workflow) return;
    
    session.status = 'active';
    
    // Send workflow initialization message
    const initMessage: AgentMessage = {
      sessionId: session.id,
      fromAgentId: 'system',
      type: 'workflow_action',
      content: `Starting workflow execution: "${session.workflow.name}". Each agent will perform their assigned actions based on their persona characteristics.`,
      timestamp: Date.now(),
      metadata: { 
        workflowName: session.workflow.name,
        totalAgents: session.agents.length,
        systemInfo: session.systemInfo
      }
    };

    session.messages.push(initMessage);

    // Publish workflow start message
    await rabbitmqService.publishMessage(
      'agent_coordination',
      '',
      initMessage
    );

    // Start each agent with their first workflow action
    for (const agent of session.agents) {
      if (agent.workflowLane && agent.currentAction) {
        await this.executeWorkflowAction(agent, session);
      }
    }
  }

  private async executeWorkflowAction(agent: PersonaAgent, session: MultiAgentSession): Promise<void> {
    if (!agent.currentAction || !agent.workflowLane) return;

    agent.status = 'acting';
    agent.lastActivity = new Date();
    agent.pendingSystemResponse = true; // Mark as waiting for potential system response

    try {
      // Create persona-specific workflow action prompt
      const systemPrompt = this.createWorkflowActionPrompt(agent, session);
      
      // Generate response using AI based on the workflow action
      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Execute this workflow action: "${agent.currentAction.title}" - ${agent.currentAction.description}`
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      const actionResponse = response.choices[0]?.message?.content || "I'm working on this action...";

      // Create workflow action message
      const actionMessage: AgentMessage = {
        sessionId: session.id,
        fromAgentId: agent.id,
        type: 'workflow_action',
        content: actionResponse,
        timestamp: Date.now(),
        workflowAction: agent.currentAction,
        metadata: { 
          agentName: agent.name,
          actionTitle: agent.currentAction.title,
          laneId: agent.workflowLane.id,
          step: session.currentStep
        }
      };

      agent.messageCount++;
      session.messages.push(actionMessage);

      // Publish to RabbitMQ
      await rabbitmqService.publishMessage(
        'persona_agents',
        `workflow.action.${agent.id}`,
        actionMessage
      );

      // Move to next action or complete
      await this.advanceAgentToNextAction(agent, session);

    } catch (error) {
      console.error(`Error executing workflow action for agent ${agent.id}:`, error);
      agent.status = 'idle';
    }
  }

  private createWorkflowActionPrompt(agent: PersonaAgent, session: MultiAgentSession): string {
    const systemInfo = session.systemInfo || {};
    
    return `You are ${agent.name}, a persona with these characteristics:
- Age: ${agent.demographics.age}
- Occupation: ${agent.demographics.occupation}
- Location: ${agent.demographics.location}
- Personality: ${agent.personality}
- Introduction: ${agent.demographics.introduction}

You are participating in a workflow for the system: "${systemInfo.title || 'Unknown System'}"
System Description: ${systemInfo.description || 'No description provided'}
System Requirements: ${systemInfo.requirements || 'No requirements specified'}
Target Platform: ${systemInfo.targetPlatform || 'Not specified'}
Business Goals: ${systemInfo.businessGoals || 'No goals specified'}

Your role in this workflow: ${agent.workflowLane?.name || 'Participant'}
Lane description: ${agent.workflowLane?.description || 'No description'}

When performing workflow actions:
1. Stay in character as ${agent.name}
2. Consider your persona's limitations, preferences, and behavior patterns
3. Express realistic concerns, frustrations, or satisfaction based on your characteristics
4. Mention specific UI/UX needs that would help you complete this action
5. Be authentic to your persona's context and constraints

Respond as if you're actually trying to use the system and performing this action. Include:
- What you're trying to do
- Any difficulties you encounter (based on your persona)
- What would make this easier for someone like you
- Your emotional state during this action`;
  }

  private async advanceAgentToNextAction(agent: PersonaAgent, session: MultiAgentSession): Promise<void> {
    if (!agent.workflowLane || !agent.currentAction) return;

    const currentIndex = agent.workflowLane.actions.findIndex(a => a.id === agent.currentAction!.id);
    const nextAction = agent.workflowLane.actions[currentIndex + 1];

    if (nextAction) {
      // Move to next action
      agent.currentAction = nextAction;
      agent.status = 'idle';
      
      // Wait a moment then execute next action
      setTimeout(() => {
        this.executeWorkflowAction(agent, session);
      }, 2000);
    } else {
      // Agent completed all actions
      agent.status = 'idle';
      agent.currentAction = undefined;
      
      // Check if all agents completed their workflows
      const allCompleted = session.agents.every(a => !a.currentAction);
      if (allCompleted) {
        await this.completeWorkflowExecution(session);
      }
    }
  }

  private async completeWorkflowExecution(session: MultiAgentSession): Promise<void> {
    session.status = 'completed';
    
    // Generate workflow analysis
    session.analysisResults = await this.generateWorkflowAnalysis(session);
    
    // Send completion message
    const completionMessage: AgentMessage = {
      sessionId: session.id,
      fromAgentId: 'system',
      type: 'analysis',
      content: 'Workflow execution completed. Generating design implications based on agent interactions...',
      timestamp: Date.now(),
      metadata: { 
        completed: true,
        totalMessages: session.messages.length,
        analysisGenerated: true
      }
    };

    session.messages.push(completionMessage);
  }

  private async generateWorkflowAnalysis(session: MultiAgentSession): Promise<any> {
    try {
      const workflowMessages = session.messages.filter(m => m.type === 'workflow_action');
      
      const analysisPrompt = `Analyze this workflow execution with ${session.agents.length} different personas:

System Information:
- Title: ${session.systemInfo?.title || 'Unknown System'}
- Description: ${session.systemInfo?.description || 'No description'}
- Requirements: ${session.systemInfo?.requirements || 'No requirements'}
- Target Platform: ${session.systemInfo?.targetPlatform || 'Not specified'}
- Business Goals: ${session.systemInfo?.businessGoals || 'No goals'}

Workflow: ${session.workflow?.name}
Type: ${session.workflow?.collaborationType}

Agent Actions and Responses:
${workflowMessages.map(m => `
Agent: ${m.metadata?.agentName}
Action: ${m.metadata?.actionTitle}
Response: ${m.content}
`).join('\n')}

Generate comprehensive design implications including:

1. **User Interface Requirements** (specific UI elements, layouts, controls needed)
2. **Functionality Needs** (features, capabilities, integrations required)
3. **Accessibility Considerations** (accommodations for different personas)
4. **Content Strategy** (messaging, help text, guidance needed)
5. **Technical Requirements** (performance, compatibility, infrastructure)
6. **Behavioral Insights** (user patterns, preferences, pain points revealed)
7. **Collaboration Pain Points** (where personas struggle to work together)
8. **Priority Recommendations** (what to build first, critical vs nice-to-have)

Provide specific, actionable insights based on the actual workflow execution.`;

      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: analysisPrompt }],
        max_tokens: 2000,
        temperature: 0.3
      });

      return {
        summary: response.choices[0]?.message?.content,
        workflowName: session.workflow?.name,
        agentCount: session.agents.length,
        messageCount: workflowMessages.length,
        executionTime: Date.now() - session.startedAt.getTime(),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating workflow analysis:', error);
      return {
        summary: 'Analysis generation failed',
        workflowName: session.workflow?.name,
        agentCount: session.agents.length,
        messageCount: session.messages.length,
        executionTime: Date.now() - session.startedAt.getTime(),
        generatedAt: new Date()
      };
    }
  }

  private async initiateAgentConversation(session: MultiAgentSession, topic: string): Promise<void> {
    session.status = 'active';
    
    // Send initialization message to all agents
    const initMessage = {
      sessionId: session.id,
      fromAgentId: 'system',
      type: 'coordination' as const,
      content: `Welcome to multi-agent discussion: "${topic}". Please introduce yourself and share your perspective.`,
      timestamp: Date.now(),
      metadata: { topic, totalAgents: session.agents.length }
    };

    // Publish coordination message
    await rabbitmqService.publishMessage(
      'agent_coordination',
      '',
      initMessage
    );

    // Start each agent thinking
    for (const agent of session.agents) {
      await this.triggerAgentResponse(agent, initMessage, session);
    }
  }

  private async triggerAgentResponse(
    agent: PersonaAgent,
    promptMessage: AgentMessage,
    session: MultiAgentSession
  ): Promise<void> {
    agent.status = 'thinking';
    agent.lastActivity = new Date();

    try {
      // Create persona-specific prompt
      const systemPrompt = this.createPersonaPrompt(agent, session, promptMessage);
      
      // Generate response using AI
      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptMessage.content }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      const agentResponse = response.choices[0]?.message?.content || "I'm thinking about this...";

      // Create agent message
      const agentMessage: AgentMessage = {
        sessionId: session.id,
        fromAgentId: agent.id,
        type: 'broadcast',
        content: agentResponse,
        timestamp: Date.now(),
        metadata: { agentName: agent.name, messageNumber: agent.messageCount + 1 }
      };

      agent.messageCount++;
      agent.status = 'responding';

      // Add to session messages
      session.messages.push(agentMessage);

      // Publish to RabbitMQ
      await rabbitmqService.publishMessage(
        'persona_agents',
        `agent.message.${agent.id}`,
        agentMessage
      );

      // Trigger responses from other agents after a delay
      setTimeout(() => {
        this.triggerOtherAgentResponses(session, agentMessage);
      }, 2000 + Math.random() * 3000); // 2-5 second delay

    } catch (error) {
      console.error(`Error generating response for agent ${agent.id}:`, error);
      agent.status = 'idle';
    }
  }

  private createPersonaPrompt(agent: PersonaAgent, session: MultiAgentSession, message: AgentMessage): string {
    const demographics = agent.demographics || {};
    const personality = agent.personality || {};
    
    return `You are ${agent.name}, participating in a group discussion with ${session.agents.length - 1} other people.

Your Background:
- Age: ${demographics.age || 'Adult'}
- Occupation: ${demographics.occupation || 'Professional'}
- Location: ${demographics.location || 'Urban area'}

Your Personality:
- Key traits: ${JSON.stringify(personality).slice(0, 200)}
- Communication style: Authentic, thoughtful, and true to your character

Instructions:
1. Respond as ${agent.name} would, based on your background and personality
2. Keep responses conversational and under 2-3 sentences
3. Reference other participants' ideas when relevant
4. Show your unique perspective based on your background
5. Be engaging but authentic to your character

Previous messages in conversation:
${session.messages.slice(-3).map(m => `${m.metadata?.agentName || 'Someone'}: ${m.content}`).join('\n')}

Respond naturally as ${agent.name}:`;
  }

  private async triggerOtherAgentResponses(session: MultiAgentSession, triggerMessage: AgentMessage): Promise<void> {
    // Select 1-2 random agents to respond (not the sender)
    const otherAgents = session.agents.filter(a => 
      a.id !== triggerMessage.fromAgentId && 
      a.status === 'idle' &&
      Math.random() > 0.4 // 60% chance to respond
    );

    const respondingAgents = otherAgents.slice(0, Math.max(1, Math.floor(Math.random() * 3)));

    for (const agent of respondingAgents) {
      await this.triggerAgentResponse(agent, triggerMessage, session);
    }
  }

  private async handleAgentMessage(message: AgentMessage): Promise<void> {
    const session = this.sessions.get(message.sessionId);
    if (!session) return;

    // Update agent status
    const agent = this.agents.get(message.fromAgentId);
    if (agent) {
      agent.status = 'listening';
      agent.lastActivity = new Date();
    }

    console.log(`📨 Agent message in session ${message.sessionId}:`, {
      from: message.metadata?.agentName,
      content: message.content.slice(0, 100) + '...'
    });

    // System agent analyzes and potentially responds
    await this.systemAgentAnalyzeAndRespond(session, message);
  }

  private async systemAgentAnalyzeAndRespond(session: MultiAgentSession, agentMessage: AgentMessage): Promise<void> {
    const agent = this.agents.get(agentMessage.fromAgentId);
    if (!agent || agentMessage.fromAgentId === 'system') return;

    // Determine if system should respond based on content analysis
    const shouldRespond = await this.shouldSystemRespond(agentMessage, session);
    
    if (shouldRespond) {
      await this.generateSystemResponse(session, agentMessage, agent);
    }

    // Log coordination event
    const coordinationEvent: CoordinationEvent = {
      id: `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      type: 'agent_interaction',
      description: `${agent.name} performed action: ${agentMessage.workflowAction?.title || 'interaction'}`,
      participants: [agent.id, session.systemAgent.id],
      outcome: shouldRespond ? 'System provided feedback' : 'System monitoring',
      timestamp: Date.now(),
      metadata: { agentAction: agentMessage.workflowAction, systemResponse: shouldRespond }
    };

    session.coordinationLog.push(coordinationEvent);
  }

  private async shouldSystemRespond(message: AgentMessage, session: MultiAgentSession): Promise<boolean> {
    // System responds to workflow actions, questions, or errors
    const triggers = [
      'help', 'error', 'problem', 'stuck', 'confused', 'how to', 'can\'t', 'unable',
      'submit', 'save', 'confirm', 'delete', 'create', 'update'
    ];

    const content = message.content.toLowerCase();
    const hasKeyword = triggers.some(trigger => content.includes(trigger));
    const isWorkflowAction = message.type === 'workflow_action';
    const randomResponse = Math.random() < 0.3; // 30% random system interaction

    return hasKeyword || isWorkflowAction || randomResponse;
  }

  private async generateSystemResponse(session: MultiAgentSession, agentMessage: AgentMessage, agent: PersonaAgent): Promise<void> {
    try {
      // Create system response prompt
      const systemPrompt = this.createSystemResponsePrompt(session, agentMessage, agent);
      
      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Agent ${agent.name} just: ${agentMessage.content}`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const systemResponse = response.choices[0]?.message?.content || "System processing...";

      // Create system message
      const systemMessage: AgentMessage = {
        sessionId: session.id,
        fromAgentId: 'system',
        toAgentId: agent.id,
        type: 'system_feedback',
        content: systemResponse,
        timestamp: Date.now(),
        metadata: { 
          respondingTo: agentMessage.fromAgentId,
          agentName: agent.name,
          responseType: this.determineResponseType(agentMessage.content)
        }
      };

      session.messages.push(systemMessage);

      // Create system event
      const systemEvent: SystemEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: session.id,
        type: 'system_response',
        content: systemResponse,
        timestamp: Date.now(),
        triggeredBy: agent.id,
        affectedAgents: [agent.id],
        severity: 'info',
        metadata: { originalAction: agentMessage.workflowAction }
      };

      session.systemEvents.push(systemEvent);

      // Publish to RabbitMQ
      await rabbitmqService.publishMessage(
        'persona_agents',
        `system.response.${agent.id}`,
        systemMessage
      );

      // Update agent status
      agent.pendingSystemResponse = false;
      agent.lastSystemInteraction = new Date();

    } catch (error) {
      console.error('Error generating system response:', error);
    }
  }

  private createSystemResponsePrompt(session: MultiAgentSession, agentMessage: AgentMessage, agent: PersonaAgent): string {
    const systemInfo = session.systemInfo || {};
    
    return `You are an intelligent system responding to user ${agent.name} in a ${systemInfo.title || 'software system'}.

System Context:
- System: ${systemInfo.title || 'Software Application'}
- Description: ${systemInfo.description || 'Interactive system'}
- Platform: ${systemInfo.targetPlatform || 'Web application'}

User Context:
- User: ${agent.name} (${agent.demographics.occupation}, ${agent.demographics.age} years old)
- User's action: ${agentMessage.workflowAction?.title || 'System interaction'}
- User's personality: ${JSON.stringify(agent.personality).slice(0, 100)}

System Response Guidelines:
1. Respond as the system interface would (confirmation messages, error alerts, guidance)
2. Be realistic about system behavior (loading states, validation messages, success confirmations)
3. Consider the user's technical level and provide appropriate feedback
4. Include realistic system responses like "Processing...", "Saved successfully", "Error: Please check..."
5. Simulate realistic system events (notifications, state changes, confirmations)

Respond as the system would to this user's action:`;
  }

  private determineResponseType(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('error') || lower.includes('problem')) return 'error_handling';
    if (lower.includes('save') || lower.includes('submit')) return 'confirmation';
    if (lower.includes('help') || lower.includes('how')) return 'guidance';
    return 'feedback';
  }

  private async handleCoordinationMessage(message: any): Promise<void> {
    console.log('🤝 Coordination message:', message);
    
    const session = this.sessions.get(message.sessionId);
    if (!session) return;

    // System coordinates between agents based on workflow
    await this.systemCoordination(session, message);
  }

  private async systemCoordination(session: MultiAgentSession, message: any): Promise<void> {
    if (!session.workflow) return;

    // Check for workflow dependencies and coordination needs
    const activeAgents = session.agents.filter(a => a.status === 'acting' || a.currentAction);
    
    // Simulate system coordination events
    if (activeAgents.length > 1) {
      const coordinationEvent: CoordinationEvent = {
        id: `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: session.id,
        type: 'workflow_coordination',
        description: `System coordinating ${activeAgents.length} simultaneous actions`,
        participants: activeAgents.map(a => a.id),
        outcome: 'Coordination protocols activated',
        timestamp: Date.now(),
        metadata: { 
          concurrentActions: activeAgents.map(a => a.currentAction?.title),
          coordinationType: session.workflow.collaborationType
        }
      };

      session.coordinationLog.push(coordinationEvent);

      // Generate system coordination message
      const coordinationMessage: AgentMessage = {
        sessionId: session.id,
        fromAgentId: 'system',
        type: 'coordination',
        content: `System note: ${activeAgents.length} users are working simultaneously. Coordination protocols active.`,
        timestamp: Date.now(),
        metadata: { 
          coordinationType: session.workflow.collaborationType,
          activeUsers: activeAgents.map(a => a.name)
        }
      };

      session.messages.push(coordinationMessage);
    }
  }

  // Public methods for API
  async getSession(sessionId: string): Promise<MultiAgentSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getAllSessions(): Promise<MultiAgentSession[]> {
    return Array.from(this.sessions.values());
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      
      // Generate final analysis
      session.analysisResults = await this.generateSessionAnalysis(session);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    await this.stopSession(sessionId);
  }

  async sendMessage(
    sessionId: string, 
    message: string, 
    fromAgentId?: string
  ): Promise<{ messageId: string; responses: any[] }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create message
    const agentMessage: AgentMessage = {
      sessionId,
      fromAgentId: fromAgentId || 'user',
      toAgentId: 'all',
      type: 'broadcast',
      content: message,
      timestamp: Date.now(),
      metadata: { fromUser: !fromAgentId }
    };

    // Add to session
    session.messages.push(agentMessage);

    // Publish to RabbitMQ
    await rabbitmqService.publishMessage(
      'persona_agents',
      'user.message',
      agentMessage
    );

    // Trigger responses from all agents
    const responses = [];
    for (const agent of session.agents) {
      if (agent.id !== fromAgentId) {
        await this.triggerAgentResponse(agent, agentMessage, session);
        responses.push({
          agentId: agent.id,
          agentName: agent.name,
          status: 'triggered'
        });
      }
    }

    return {
      messageId: `msg_${Date.now()}`,
      responses
    };
  }

  private async generateSessionAnalysis(session: MultiAgentSession): Promise<any> {
    try {
      const analysisPrompt = `Analyze this multi-agent conversation between ${session.agents.length} different personas:

Participants:
${session.agents.map(a => `- ${a.name}: ${a.messageCount} messages`).join('\n')}

Messages:
${session.messages.map(m => `${m.metadata?.agentName}: ${m.content}`).join('\n')}

Provide analysis including:
1. Key themes discussed
2. Different perspectives shown
3. Interaction patterns
4. Insights about each persona's behavior
5. Overall conversation dynamics

Analysis:`;

      const response = await grok.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: analysisPrompt }],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        summary: response.choices[0]?.message?.content,
        messageCount: session.messages.length,
        participantCount: session.agents.length,
        duration: Date.now() - session.startedAt.getTime(),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating session analysis:', error);
      return {
        summary: 'Analysis generation failed',
        messageCount: session.messages.length,
        participantCount: session.agents.length,
        duration: Date.now() - session.startedAt.getTime(),
        generatedAt: new Date()
      };
    }
  }
}

// Singleton instance
export const multiAgentSystem = new MultiAgentPersonaSystem();
