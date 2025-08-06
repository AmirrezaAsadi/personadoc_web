import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, Bot, Play, Square, Loader2 } from 'lucide-react';

interface PersonaAgent {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'responding' | 'listening';
  messageCount: number;
  lastActivity: string;
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
  messages: AgentMessage[];
}

export default function MultiAgentSystemInterface() {
  const [sessions, setSessions] = useState<MultiAgentSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MultiAgentSession | null>(null);
  const [personas, setPersonas] = useState<any[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPersonas();
    loadSessions();
  }, []);

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
    if (!sessionName || selectedPersonas.length < 2 || !topic) {
      alert('Please provide session name, at least 2 personas, and a topic');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/multi-agent-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName,
          description: sessionDescription,
          personaIds: selectedPersonas,
          topic
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSession(data.session);
        setSessions([data.session, ...sessions]);
        // Reset form
        setSessionName('');
        setSessionDescription('');
        setSelectedPersonas([]);
        setTopic('');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
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
                Active Agents ({currentSession.agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSession.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {agent.messageCount} messages
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
                Conversation ({currentSession.messages.length} messages)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 mb-4">
                <div className="space-y-3">
                  {currentSession.messages.map((message, index) => {
                    const agent = currentSession.agents.find(a => a.id === message.fromAgentId);
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Multi-Agent Persona System
          </CardTitle>
          <p className="text-muted-foreground">
            Create conversations between multiple AI personas with real-time messaging
          </p>
        </CardHeader>
      </Card>

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

            <div>
              <label className="text-sm font-medium">Discussion Topic</label>
              <Input
                placeholder="What should the agents discuss?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Select Personas (2-10) - {selectedPersonas.length} selected
              </label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {personas.map((persona) => (
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
              disabled={creating || !sessionName || selectedPersonas.length < 2 || !topic}
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
                        {session.agents.length} agents • {session.messages.length} messages
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
