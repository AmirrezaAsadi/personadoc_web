import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, Bot, Play, Square, Loader2, Workflow, Zap, Settings } from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  age?: number;
  occupation?: string;
  location?: string;
  metadata?: any;
}

interface SwimLaneAction {
  id: string;
  title: string;
  description: string;
  order: number;
  estimatedTime?: string;
}

interface SwimLane {
  id: string;
  name: string;
  personaId: string;
  color: string;
  description?: string;
  actions: SwimLaneAction[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  swimLanes: SwimLane[];
  collaborationType: 'sequential' | 'parallel' | 'hybrid';
}

interface SystemInfo {
  title: string;
  description: string;
  requirements: string;
  constraints: string;
  targetPlatform: string;
  businessGoals: string;
}

interface Props {
  workflow?: Workflow | null;
  systemInfo?: SystemInfo;
  personas?: Persona[];
}

interface PersonaAgent {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'responding' | 'listening' | 'acting' | 'waiting_for_system';
  messageCount: number;
  lastActivity: string;
  pendingSystemResponse?: boolean;
  currentAction?: string;
}

interface SystemAgent {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface SystemEvent {
  id: string;
  type: string;
  content: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'success';
  affectedAgents: string[];
}

interface CoordinationEvent {
  id: string;
  type: string;
  description: string;
  participants: string[];
  outcome: string;
  timestamp: number;
}

interface AgentMessage {
  fromAgentId: string;
  toAgentId: string;
  content: string;
  timestamp: number;
  type: 'broadcast' | 'coordination';
}

interface MultiAgentSession {
  id: string;
  name: string;
  description: string;
  status: 'initializing' | 'active' | 'completed';
  startedAt: string;
  agents: PersonaAgent[];
  systemAgent?: SystemAgent;
  messages: AgentMessage[];
  systemEvents?: SystemEvent[];
  coordinationLog?: CoordinationEvent[];
}

export default function MultiAgentSystemInterface({ workflow, systemInfo, personas: propPersonas }: Props) {
  const [sessions, setSessions] = useState<MultiAgentSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MultiAgentSession | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [framework, setFramework] = useState<'typescript' | 'google-adk' | 'langgraph'>('google-adk');
  const [googleADKHealth, setGoogleADKHealth] = useState<boolean>(false);
  const [langGraphHealth, setLangGraphHealth] = useState<boolean>(false);

  // Use workflow data if provided, otherwise load from API
  useEffect(() => {
    if (propPersonas && propPersonas.length > 0) {
      setPersonas(propPersonas);
    } else {
      loadPersonas();
    }
    loadSessions();
    checkLangGraphHealth();
  }, [propPersonas]);

  // Check Google ADK service health
  const checkLangGraphHealth = async () => {
    try {
      const response = await fetch('/api/multi-agent-sessions/google-adk/health');
      setGoogleADKHealth(response.ok);
    } catch {
      setGoogleADKHealth(false);
    }
  };

  // Auto-populate session details from workflow
  useEffect(() => {
    if (workflow && systemInfo) {
      setSessionName(workflow.name || 'Workflow Analysis Session');
      setSessionDescription(`${systemInfo.title}: ${workflow.description}`);
      
      // Auto-select personas from workflow swim lanes
      const workflowPersonaIds = workflow.swimLanes?.map(lane => lane.personaId).filter(Boolean) || [];
      setSelectedPersonas(workflowPersonaIds);
    }
  }, [workflow, systemInfo]);

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      const data = await response.json();
      setPersonas(data.personas || []);
    } catch (error) {
      console.error('Failed to load personas:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/multi-agent-sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const createSession = async () => {
    if (!sessionName || selectedPersonas.length < 2) {
      alert('Please provide session name and at least 2 personas');
      return;
    }

    setCreating(true);
    try {
      const endpoint = framework === 'google-adk' 
        ? '/api/multi-agent-sessions/google-adk'
        : framework === 'langgraph'
        ? '/api/multi-agent-sessions/langgraph'
        : '/api/multi-agent-sessions';
        
      const requestBody = framework === 'google-adk' || framework === 'langgraph'
        ? {
            userQuery: sessionDescription || userMessage,
            personaIds: selectedPersonas,
            sessionId: `${framework}_${Date.now()}`
          }
        : {
            name: sessionName,
            description: sessionDescription,
            personaIds: selectedPersonas,
            workflow,
            systemInfo
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success || data.sessionId) {
        const newSession = framework === 'google-adk' || framework === 'langgraph'
          ? {
              id: data.sessionId,
              name: `${framework === 'google-adk' ? 'Google ADK' : 'LangGraph'} Analysis - ${new Date().toLocaleString()}`,
              description: sessionDescription,
              status: data.status,
              startedAt: new Date().toISOString(),
              agents: [],
              messages: [],
              framework: framework,
              synthesis: data.synthesis,
              personaResponses: data.personaResponses,
              coordinationEvents: data.coordinationEvents
            }
          : data.session;
          
        setCurrentSession(newSession);
        setSessions([newSession, ...sessions]);
        
        // Reset form
        setSessionName('');
        setSessionDescription('');
        setSelectedPersonas([]);
        setUserMessage('');
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (error: any) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${error.message || 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/multi-agent-sessions/${sessionId}`);
      const data = await response.json();
      setCurrentSession(data.session);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userMessage || !currentSession) return;

    try {
      const response = await fetch(`/api/multi-agent-sessions/${currentSession.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      if (data.success) {
        setUserMessage('');
        // Reload session to get updated messages
        setTimeout(() => loadSession(currentSession.id), 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      await fetch(`/api/multi-agent-sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
      loadSessions();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'thinking': return 'bg-yellow-500';
      case 'responding': return 'bg-green-500';
      case 'listening': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (currentSession) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {currentSession.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{currentSession.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
                {currentSession.status}
              </Badge>
              <Button variant="outline" onClick={() => setCurrentSession(null)}>
                Back to Sessions
              </Button>
              <Button variant="outline" onClick={() => endSession(currentSession.id)}>
                End Session
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Active Agents ({currentSession.agents?.length || 0})
              </CardTitle>
              {currentSession.systemAgent && (
                <div className="text-sm text-muted-foreground">
                  System Agent: {currentSession.systemAgent.name} ({currentSession.systemAgent.status})
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {(currentSession.agents || []).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.messageCount} messages
                      {agent.pendingSystemResponse && (
                        <span className="ml-2 text-yellow-600">⏳ Waiting for system</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                    <span className="text-xs capitalize">{agent.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Messages Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation ({currentSession.messages?.length || 0} messages)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 mb-4">
                <div className="space-y-3">
                  {(currentSession.messages || []).map((message, index) => {
                    const agent = (currentSession.agents || []).find(a => a.id === message.fromAgentId);
                    const isSystem = message.fromAgentId === 'system';
                    const isUser = message.fromAgentId === 'user';
                    
                    return (
                      <div key={index} className={`p-3 rounded-lg ${
                        isSystem ? 'bg-blue-50 border-blue-200' :
                        isUser ? 'bg-green-50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      } border`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {isSystem ? '🤖 System' : 
                             isUser ? '👤 You' : 
                             `🎭 ${agent?.name || 'Unknown Agent'}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                        <div className="text-sm">{message.content}</div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Send a message to all agents..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  className="flex-1"
                  rows={2}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!userMessage.trim()}
                  className="self-end"
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Events Panel */}
        {currentSession.systemEvents && currentSession.systemEvents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                System Events ({currentSession.systemEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {currentSession.systemEvents.map((event, index) => (
                    <div key={event.id} className={`p-2 rounded border-l-4 ${
                      event.severity === 'error' ? 'bg-red-50 border-red-400' :
                      event.severity === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      event.severity === 'success' ? 'bg-green-50 border-green-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{event.type.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.content}</p>
                      {event.affectedAgents.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Affects: {event.affectedAgents.map(id => 
                            currentSession.agents?.find(a => a.id === id)?.name || id
                          ).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Coordination Log */}
        {currentSession.coordinationLog && currentSession.coordinationLog.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Coordination Events ({currentSession.coordinationLog.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {currentSession.coordinationLog.map((coord, index) => (
                    <div key={coord.id} className="p-2 border rounded bg-purple-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{coord.type.replace('_', ' ')}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(coord.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{coord.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Outcome: {coord.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Workflow Status */}
      {!workflow && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Workflow className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-800">No Workflow Selected</p>
                <p className="text-sm text-amber-600">
                  Create a workflow in the "Workflow Designer" tab first. The multi-agent system will execute your workflow steps and provide analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Session */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Session Name</label>
              <Input
                placeholder="e.g., Climate Change Debate"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="Brief description of the session"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
              />
            </div>

            {workflow && (
              <div>
                <label className="text-sm font-medium">Workflow Information</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Workflow className="w-4 h-4" />
                    <span className="font-medium">{workflow.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                  <div className="text-xs text-gray-500">
                    {workflow.swimLanes?.length || 0} swim lanes • {workflow.collaborationType} execution
                  </div>
                </div>
              </div>
            )}

            {/* Framework Selection */}
            <div>
              <label className="text-sm font-medium">Multi-Agent Framework</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    framework === 'google-adk' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFramework('google-adk')}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Google ADK</span>
                    {googleADKHealth ? (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                        Offline
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Google ADK coordination + Grok-3 intelligence
                  </p>
                </div>
                
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    framework === 'langgraph' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFramework('langgraph')}
                >
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    <span className="font-medium">LangGraph</span>
                    {langGraphHealth ? (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                        Offline
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    LangGraph framework with Grok-3
                  </p>
                </div>
                
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    framework === 'typescript' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFramework('typescript')}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">TypeScript</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Built-in
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Custom implementation with swim lane workflows
                  </p>
                </div>
              </div>
              
              {(framework === 'google-adk' && !googleADKHealth) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  ⚠️ Google ADK service is offline. Run: <code className="bg-gray-100 px-1 rounded">cd python-agents && python main.py</code>
                </div>
              )}
              
              {(framework === 'langgraph' && !langGraphHealth) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  ⚠️ LangGraph service is offline. Run: <code className="bg-gray-100 px-1 rounded">cd python-agents && python main.py</code>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">
                Select Personas (2-10) - {selectedPersonas.length} selected
              </label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {(personas || []).map((persona) => (
                    <label key={persona.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPersonas.includes(persona.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (selectedPersonas.length < 10) {
                              setSelectedPersonas([...selectedPersonas, persona.id]);
                            }
                          } else {
                            setSelectedPersonas(selectedPersonas.filter(id => id !== persona.id));
                          }
                        }}
                        disabled={!selectedPersonas.includes(persona.id) && selectedPersonas.length >= 10}
                      />
                      <span className="text-sm">{persona.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Button 
              onClick={createSession}
              disabled={creating || !sessionName || selectedPersonas.length < 2}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Multi-Agent Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{session.name}</div>
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {session.description || 'No description'}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {session.agents?.length || 0} agents • {session.messages?.length || 0} messages
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => loadSession(session.id)}>
                          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'View'}
                        </Button>
                        {session.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => endSession(session.id)}>
                            End
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No sessions yet. Create your first multi-agent session!
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
