'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Bot, Users, CheckCircle, Clock, AlertCircle, ExternalLink, Copy } from 'lucide-react';

interface InterviewBot {
  id: string;
  name: string;
  description?: string;
  personality: any;
  interviewStyle: any;
  isActive: boolean;
  createdAt: string;
  _count: {
    interviewSessions: number;
  };
}

interface InterviewSession {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  sessionToken: string;
  currentParticipants: number;
  maxParticipants: number;
  estimatedDuration?: number;
  createdAt: string;
  expiresAt: string;
  bot: {
    name: string;
  };
  persona?: {
    name: string;
  };
  _count: {
    participantSessions: number;
  };
}

export default function MultiAgentSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bots, setBots] = useState<InterviewBot[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [botsResponse, sessionsResponse] = await Promise.all([
        fetch('/api/interview-bots'),
        fetch('/api/interview-sessions'),
      ]);

      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        setBots(botsData);
      }

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Clock className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const copyInterviewLink = (sessionToken: string) => {
    const link = `${window.location.origin}/interview/${sessionToken}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6\">
        <div className=\"max-w-7xl mx-auto\">
          <div className=\"animate-pulse space-y-6\">
            <div className=\"h-8 bg-gray-200 rounded w-1/3\"></div>
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
              {[1, 2, 3].map((i) => (
                <div key={i} className=\"h-32 bg-gray-200 rounded-lg\"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6\">
      <div className=\"max-w-7xl mx-auto space-y-6\">
        {/* Header */}
        <div className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\">
          <div>
            <h1 className=\"text-3xl font-bold text-gray-900\">Multi-Agent Interview System</h1>
            <p className=\"text-gray-600 mt-1\">
              Create intelligent interview bots and validation agents for enhanced persona development
            </p>
          </div>
          <div className=\"flex gap-3\">
            <Button
              onClick={() => setShowCreateBot(true)}
              className=\"bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700\"
            >
              <Bot className=\"w-4 h-4 mr-2\" />
              Create Bot
            </Button>
            <Button
              onClick={() => setShowCreateSession(true)}
              variant=\"outline\"
              className=\"border-blue-200 hover:bg-blue-50\"
            >
              <Plus className=\"w-4 h-4 mr-2\" />
              New Interview
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
          <Card className=\"bg-white/70 backdrop-blur-sm border-blue-100\">
            <CardContent className=\"p-6\">
              <div className=\"flex items-center space-x-2\">
                <Bot className=\"w-5 h-5 text-blue-600\" />
                <div>
                  <p className=\"text-sm font-medium text-gray-600\">Active Bots</p>
                  <p className=\"text-2xl font-bold text-gray-900\">{bots.filter(b => b.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className=\"bg-white/70 backdrop-blur-sm border-green-100\">
            <CardContent className=\"p-6\">
              <div className=\"flex items-center space-x-2\">
                <Users className=\"w-5 h-5 text-green-600\" />
                <div>
                  <p className=\"text-sm font-medium text-gray-600\">Active Sessions</p>
                  <p className=\"text-2xl font-bold text-gray-900\">{sessions.filter(s => s.status === 'ACTIVE').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className=\"bg-white/70 backdrop-blur-sm border-purple-100\">
            <CardContent className=\"p-6\">
              <div className=\"flex items-center space-x-2\">
                <CheckCircle className=\"w-5 h-5 text-purple-600\" />
                <div>
                  <p className=\"text-sm font-medium text-gray-600\">Completed</p>
                  <p className=\"text-2xl font-bold text-gray-900\">{sessions.filter(s => s.status === 'COMPLETED').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className=\"bg-white/70 backdrop-blur-sm border-orange-100\">
            <CardContent className=\"p-6\">
              <div className=\"flex items-center space-x-2\">
                <Clock className=\"w-5 h-5 text-orange-600\" />
                <div>
                  <p className=\"text-sm font-medium text-gray-600\">Total Participants</p>
                  <p className=\"text-2xl font-bold text-gray-900\">
                    {sessions.reduce((sum, s) => sum + s._count.participantSessions, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className=\"space-y-6\">
          <TabsList className=\"grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm\">
            <TabsTrigger value=\"overview\">Overview</TabsTrigger>
            <TabsTrigger value=\"bots\">Interview Bots</TabsTrigger>
            <TabsTrigger value=\"sessions\">Interview Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value=\"overview\" className=\"space-y-6\">
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              {/* Recent Sessions */}
              <Card className=\"bg-white/70 backdrop-blur-sm border-blue-100\">
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Clock className=\"w-5 h-5 text-blue-600\" />
                    Recent Interview Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                        <div className=\"flex-1\">
                          <p className=\"font-medium text-gray-900\">{session.title}</p>
                          <p className=\"text-sm text-gray-600\">{session.bot.name}</p>
                        </div>
                        <div className=\"flex items-center gap-2\">
                          <Badge className={getStatusColor(session.status)}>
                            {getStatusIcon(session.status)}
                            <span className=\"ml-1\">{session.status}</span>
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Bots */}
              <Card className=\"bg-white/70 backdrop-blur-sm border-green-100\">
                <CardHeader>
                  <CardTitle className=\"flex items-center gap-2\">
                    <Bot className=\"w-5 h-5 text-green-600\" />
                    Your Interview Bots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    {bots.slice(0, 5).map((bot) => (
                      <div key={bot.id} className=\"flex items-center justify-between p-3 bg-gray-50 rounded-lg\">
                        <div className=\"flex-1\">
                          <p className=\"font-medium text-gray-900\">{bot.name}</p>
                          <p className=\"text-sm text-gray-600\">
                            {bot._count.interviewSessions} sessions created
                          </p>
                        </div>
                        <div className=\"flex items-center gap-2\">
                          <Badge variant={bot.isActive ? 'default' : 'secondary'}>
                            {bot.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value=\"bots\" className=\"space-y-6\">
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6\">
              {bots.map((bot) => (
                <Card key={bot.id} className=\"bg-white/70 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-shadow\">
                  <CardHeader>
                    <div className=\"flex items-start justify-between\">
                      <div className=\"flex items-center gap-2\">
                        <Bot className=\"w-5 h-5 text-blue-600\" />
                        <CardTitle className=\"text-lg\">{bot.name}</CardTitle>
                      </div>
                      <Badge variant={bot.isActive ? 'default' : 'secondary'}>
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className=\"text-sm\">
                      {bot.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className=\"space-y-3\">
                      <div className=\"text-sm text-gray-600\">
                        <p><span className=\"font-medium\">Style:</span> {bot.personality?.tone || 'Professional'}</p>
                        <p><span className=\"font-medium\">Sessions:</span> {bot._count.interviewSessions}</p>
                        <p><span className=\"font-medium\">Created:</span> {formatDate(bot.createdAt)}</p>
                      </div>
                      <Button 
                        variant=\"outline\" 
                        size=\"sm\" 
                        className=\"w-full\"
                        onClick={() => setShowCreateSession(true)}
                      >
                        Create Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value=\"sessions\" className=\"space-y-6\">
            <div className=\"grid grid-cols-1 gap-6\">
              {sessions.map((session) => (
                <Card key={session.id} className=\"bg-white/70 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-shadow\">
                  <CardHeader>
                    <div className=\"flex items-start justify-between\">
                      <div>
                        <CardTitle className=\"text-lg\">{session.title}</CardTitle>
                        <CardDescription className=\"text-sm mt-1\">
                          {session.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(session.status)}>
                        {getStatusIcon(session.status)}
                        <span className=\"ml-1\">{session.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4\">
                      <div className=\"text-sm\">
                        <p className=\"font-medium text-gray-700\">Bot</p>
                        <p className=\"text-gray-600\">{session.bot.name}</p>
                      </div>
                      <div className=\"text-sm\">
                        <p className=\"font-medium text-gray-700\">Participants</p>
                        <p className=\"text-gray-600\">{session.currentParticipants}/{session.maxParticipants}</p>
                      </div>
                      <div className=\"text-sm\">
                        <p className=\"font-medium text-gray-700\">Duration</p>
                        <p className=\"text-gray-600\">{session.estimatedDuration || 'N/A'} min</p>
                      </div>
                      <div className=\"text-sm\">
                        <p className=\"font-medium text-gray-700\">Expires</p>
                        <p className=\"text-gray-600\">{formatDate(session.expiresAt)}</p>
                      </div>
                    </div>
                    <div className=\"flex gap-2\">
                      <Button
                        variant=\"outline\"
                        size=\"sm\"
                        onClick={() => copyInterviewLink(session.sessionToken)}
                        className=\"flex items-center gap-2\"
                      >
                        <Copy className=\"w-4 h-4\" />
                        Copy Link
                      </Button>
                      <Button
                        variant=\"outline\"
                        size=\"sm\"
                        onClick={() => window.open(`/interview/${session.sessionToken}`, '_blank')}
                        className=\"flex items-center gap-2\"
                      >
                        <ExternalLink className=\"w-4 h-4\" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Bot Modal - This would be a separate component in production */}
        {showCreateBot && (
          <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50\">
            <Card className=\"w-full max-w-2xl max-h-[90vh] overflow-y-auto\">
              <CardHeader>
                <CardTitle>Create Interview Bot</CardTitle>
                <CardDescription>
                  Configure an AI bot to conduct interviews for persona development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className=\"text-center text-gray-600 py-8\">
                  Bot creation form would go here...
                </p>
                <div className=\"flex justify-end gap-2 mt-6\">
                  <Button variant=\"outline\" onClick={() => setShowCreateBot(false)}>
                    Cancel
                  </Button>
                  <Button>Create Bot</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Session Modal - This would be a separate component in production */}
        {showCreateSession && (
          <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50\">
            <Card className=\"w-full max-w-2xl max-h-[90vh] overflow-y-auto\">
              <CardHeader>
                <CardTitle>Create Interview Session</CardTitle>
                <CardDescription>
                  Set up a new interview session for collecting persona data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className=\"text-center text-gray-600 py-8\">
                  Session creation form would go here...
                </p>
                <div className=\"flex justify-end gap-2 mt-6\">
                  <Button variant=\"outline\" onClick={() => setShowCreateSession(false)}>
                    Cancel
                  </Button>
                  <Button>Create Session</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
