'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Bot, Users, CheckCircle, Clock } from 'lucide-react';

export default function MultiAgentSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Multi-Agent Interview System</h1>
            <p className="text-gray-600 mt-1">
              Create intelligent interview bots and validation agents for enhanced persona development
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowCreateBot(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Bot className="w-4 h-4 mr-2" />
              Create Bot
            </Button>
            <Button
              onClick={() => setShowCreateSession(true)}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Interview
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bots</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bots">Interview Bots</TabsTrigger>
            <TabsTrigger value="sessions">Interview Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Getting Started */}
              <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    Getting Started
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Welcome to the Multi-Agent Interview System! Here's how to get started:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                      <li>Create your first interview bot with custom personality and style</li>
                      <li>Set up research questions and validation criteria</li>
                      <li>Generate interview sessions with shareable links</li>
                      <li>Collect participant responses and insights</li>
                      <li>Use validation agents to ensure data quality</li>
                    </ol>
                    <Button 
                      onClick={() => setShowCreateBot(true)}
                      className="w-full"
                    >
                      Create Your First Bot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Features */}
              <Card className="bg-white/70 backdrop-blur-sm border-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    System Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Intelligent Interview Bots</p>
                        <p className="text-sm text-gray-600">AI-powered bots with customizable personalities</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Validation Agents</p>
                        <p className="text-sm text-gray-600">Automated quality and bias detection</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">RabbitMQ Integration</p>
                        <p className="text-sm text-gray-600">Scalable message queue for agent communication</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Shareable Links</p>
                        <p className="text-sm text-gray-600">Easy participant access and data collection</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bots" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
              <CardContent className="p-12 text-center">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interview Bots Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first interview bot to start collecting persona data with AI assistance.
                </p>
                <Button
                  onClick={() => setShowCreateBot(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Create Interview Bot
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Interview Sessions Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create interview sessions to share with participants and collect responses.
                </p>
                <Button
                  onClick={() => setShowCreateSession(true)}
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Interview Session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showCreateBot && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create Interview Bot</CardTitle>
                <CardDescription>
                  Configure an AI bot to conduct interviews for persona development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600 py-8">
                  <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="mb-4">Bot creation form will be implemented here.</p>
                  <p className="text-sm">This will include personality settings, interview style, and research questions.</p>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowCreateBot(false)}>
                    Cancel
                  </Button>
                  <Button disabled>Create Bot</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showCreateSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Create Interview Session</CardTitle>
                <CardDescription>
                  Set up a new interview session for collecting persona data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-600 py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="mb-4">Session creation form will be implemented here.</p>
                  <p className="text-sm">This will include bot selection, research focus, and participant settings.</p>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowCreateSession(false)}>
                    Cancel
                  </Button>
                  <Button disabled>Create Session</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
