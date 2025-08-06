'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Brain, Lightbulb, Download, Loader2, Network, AlertTriangle, Plus, Trash2, ArrowRight, Bot, Play, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import MultiAgentSystemInterface from '@/components/multi-agent-system-interface';

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

interface DesignImplication {
  personaId: string;
  personaName: string;
  implications: {
    userInterface: string[];
    functionality: string[];
    accessibility: string[];
    content: string[];
    technical: string[];
    behavioral: string[];
  };
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface CollaborativePainPoint {
  workflowId: string;
  laneId: string;
  laneName: string;
  involvedPersonas: string[];
  painPoints: {
    communication: string[];
    coordination: string[];
    trust: string[];
    efficiency: string[];
    technical: string[];
  };
  recommendations: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const SWIMLANE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function MultiPersonaAnalysisPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'workflows' | 'multiagent' | 'analysis'>('workflows');
  
  // Workflow-related state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [systemInfo, setSystemInfo] = useState({
    title: '',
    description: '',
    requirements: '',
    constraints: '',
    targetPlatform: '',
    businessGoals: ''
  });
  const [analysisResults, setAnalysisResults] = useState<DesignImplication[]>([]);
  const [collaborativePainPoints, setCollaborativePainPoints] = useState<CollaborativePainPoint[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadPersonas();
    }
  }, [session]);

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas');
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Workflow Management Functions
  const createWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Sequence',
      description: '',
      swimLanes: [],
      collaborationType: 'parallel'
    };
    setWorkflows([...workflows, newWorkflow]);
    setCurrentWorkflow(newWorkflow);
  };

  const updateWorkflow = (updates: Partial<Workflow>) => {
    if (!currentWorkflow) return;
    const updated = { ...currentWorkflow, ...updates };
    setCurrentWorkflow(updated);
    setWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const addSwimLane = () => {
    if (!currentWorkflow) return;
    const newLane: SwimLane = {
      id: `lane-${Date.now()}`,
      name: 'New Actor',
      personaId: '',
      color: SWIMLANE_COLORS[currentWorkflow.swimLanes.length % SWIMLANE_COLORS.length],
      actions: []
    };
    updateWorkflow({
      swimLanes: [...currentWorkflow.swimLanes, newLane]
    });
  };

  const updateSwimLane = (laneId: string, updates: Partial<SwimLane>) => {
    if (!currentWorkflow) return;
    updateWorkflow({
      swimLanes: currentWorkflow.swimLanes.map(lane => 
        lane.id === laneId ? { ...lane, ...updates } : lane
      )
    });
  };

  const removeSwimLane = (laneId: string) => {
    if (!currentWorkflow) return;
    updateWorkflow({
      swimLanes: currentWorkflow.swimLanes.filter(lane => lane.id !== laneId)
    });
  };

  const addAction = (laneId: string) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId);
    if (!lane) return;
    
    const newAction: SwimLaneAction = {
      id: `action-${Date.now()}`,
      title: 'New Action',
      description: '',
      order: lane.actions.length,
      estimatedTime: ''
    };
    
    updateSwimLane(laneId, {
      actions: [...lane.actions, newAction]
    });
  };

  const updateAction = (laneId: string, actionId: string, updates: Partial<SwimLaneAction>) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId);
    if (!lane) return;
    
    updateSwimLane(laneId, {
      actions: lane.actions.map(action => 
        action.id === actionId ? { ...action, ...updates } : action
      )
    });
  };

  const removeAction = (laneId: string, actionId: string) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId);
    if (!lane) return;
    
    updateSwimLane(laneId, {
      actions: lane.actions.filter(action => action.id !== actionId)
    });
  };

  const handleAnalyze = async () => {
    if (!currentWorkflow || currentWorkflow.swimLanes.length === 0 || !systemInfo.title || !systemInfo.description) {
      alert('Please create a sequence with swim lanes and provide system information.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/multi-persona-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: currentWorkflow,
          systemInfo
        })
      });

      if (response.ok) {
        const results = await response.json();
        setAnalysisResults(results.implications || []);
        setCollaborativePainPoints(results.collaborativePainPoints || []);
        setActiveTab('analysis');
      } else {
        const error = await response.json();
        alert('Analysis failed: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportResults = () => {
    const exportData = {
      systemInfo,
      workflow: currentWorkflow,
      analysisResults,
      collaborativePainPoints,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sequence-analysis-${systemInfo.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPersonaName = (id: string) => personas.find(p => p.id === id)?.name || 'Select Persona';

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="sea-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
            <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg">
              <p className="text-slate-700 font-medium">Loading personas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Underwater Background */}
      <div className="sea-waves">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-block mb-4">
            <Button variant="outline" size="sm" className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
              ← Back to Dashboard
            </Button>
          </Link>

          <div className="glass-morphism border-white/20 underwater-glow rounded-lg p-6">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              Multi-Persona Analysis & Agent System
            </h1>
            <p className="text-white/80 mb-4">Design workflows, analyze interactions, and run multi-agent conversations</p>
            
            {/* Quick Actions */}
            <div className="flex gap-3 mt-4">
              <Link href="/" className="inline-block">
                <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Persona
                </Button>
              </Link>
              <Button 
                onClick={() => setActiveTab('multiagent')}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Bot className="w-4 h-4 mr-2" />
                Start Multi-Agent Session
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="glass-morphism border-white/20 underwater-glow rounded-lg p-2">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('workflows')}
                variant={activeTab === 'workflows' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  activeTab === 'workflows' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <Network className="w-4 h-4" />
                Workflow Designer
              </Button>
              <Button
                onClick={() => setActiveTab('multiagent')}
                variant={activeTab === 'multiagent' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  activeTab === 'multiagent' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <Bot className="w-4 h-4" />
                Multi-Agent System
              </Button>
              <Button
                onClick={() => setActiveTab('analysis')}
                variant={activeTab === 'analysis' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  activeTab === 'analysis' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                disabled={analysisResults.length === 0}
              >
                <Brain className="w-4 h-4" />
                Analysis Results
                {analysisResults.length > 0 && (
                  <Badge className="ml-1 bg-green-600 text-white">{analysisResults.length}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'multiagent' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1">
            <MultiAgentSystemInterface />
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: System Information & Workflow Management */}
            <div className="space-y-6">
              {/* System Information */}
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">System Title *</label>
                    <Input
                      value={systemInfo.title}
                      onChange={(e) => setSystemInfo({ ...systemInfo, title: e.target.value })}
                      placeholder="e.g., Food Delivery App"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Description *</label>
                    <Textarea
                      value={systemInfo.description}
                      onChange={(e) => setSystemInfo({ ...systemInfo, description: e.target.value })}
                      rows={3}
                      placeholder="Brief description of your system..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Target Platform</label>
                    <Input
                      value={systemInfo.targetPlatform}
                      onChange={(e) => setSystemInfo({ ...systemInfo, targetPlatform: e.target.value })}
                      placeholder="e.g., Web, Mobile, Desktop"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Business Goals</label>
                    <Textarea
                      value={systemInfo.businessGoals}
                      onChange={(e) => setSystemInfo({ ...systemInfo, businessGoals: e.target.value })}
                      rows={2}
                      placeholder="What are the main business objectives?"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Management */}
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Network className="w-5 h-5" />
                      Sequences ({workflows.length})
                    </CardTitle>
                    <Button
                      onClick={createWorkflow}
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Sequence
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {workflows.length === 0 ? (
                    <div className="text-center py-8 text-white/70">
                      <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No sequences created yet.</p>
                      <p className="text-sm">Create a sequence to start designing interactions.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">Select Sequence</label>
                        <select
                          value={currentWorkflow?.id || ''}
                          onChange={(e) => setCurrentWorkflow(workflows.find(w => w.id === e.target.value) || null)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2"
                        >
                          <option value="" className="bg-gray-800">Select a sequence</option>
                          {workflows.map(workflow => (
                            <option key={workflow.id} value={workflow.id} className="bg-gray-800">
                              {workflow.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {currentWorkflow && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Sequence Name</label>
                            <Input
                              value={currentWorkflow.name}
                              onChange={(e) => updateWorkflow({ name: e.target.value })}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
                            <Textarea
                              value={currentWorkflow.description}
                              onChange={(e) => updateWorkflow({ description: e.target.value })}
                              rows={2}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !currentWorkflow || currentWorkflow.swimLanes.length === 0 || !systemInfo.title}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-xl py-6 text-lg underwater-glow"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Sequence...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Analyze Sequence
                  </>
                )}
              </Button>
            </div>

            {/* Right Columns: Sequence Diagram */}
            <div className="lg:col-span-2">
              {currentWorkflow ? (
                <Card className="glass-morphism border-white/20 underwater-glow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Sequence Diagram</CardTitle>
                      <Button
                        onClick={addSwimLane}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Actor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentWorkflow.swimLanes.length === 0 ? (
                      <div className="text-center py-12 text-white/70">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No actors in this sequence yet.</p>
                        <p className="text-sm">Add actors to start building your interaction sequence.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {currentWorkflow.swimLanes.map((lane, laneIndex) => (
                          <div key={lane.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: lane.color }}
                                />
                                <Input
                                  value={lane.name}
                                  onChange={(e) => updateSwimLane(lane.id, { name: e.target.value })}
                                  className="font-medium bg-white/10 border-white/20 text-white"
                                  placeholder="Actor name"
                                />
                              </div>
                              <Button
                                onClick={() => removeSwimLane(lane.id)}
                                size="sm"
                                variant="outline"
                                className="bg-red-500/20 border-red-400/20 text-red-300 hover:bg-red-500/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-white/90 mb-2">Assign Persona</label>
                              <select
                                value={lane.personaId}
                                onChange={(e) => updateSwimLane(lane.id, { personaId: e.target.value })}
                                className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2"
                              >
                                <option value="" className="bg-gray-800">Select a persona</option>
                                {personas.map(persona => (
                                  <option key={persona.id} value={persona.id} className="bg-gray-800">
                                    {persona.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-white/90">Actions</h4>
                                <Button
                                  onClick={() => addAction(lane.id)}
                                  size="sm"
                                  className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Action
                                </Button>
                              </div>

                              {lane.actions.map((action, actionIndex) => (
                                <div key={action.id} className="bg-white/5 border border-white/10 rounded p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <Input
                                      value={action.title}
                                      onChange={(e) => updateAction(lane.id, action.id, { title: e.target.value })}
                                      className="font-medium bg-white/10 border-white/20 text-white text-sm"
                                      placeholder="Action title"
                                    />
                                    <Button
                                      onClick={() => removeAction(lane.id, action.id)}
                                      size="sm"
                                      variant="outline"
                                      className="ml-2 bg-red-500/20 border-red-400/20 text-red-300 hover:bg-red-500/40"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <Textarea
                                    value={action.description}
                                    onChange={(e) => updateAction(lane.id, action.id, { description: e.target.value })}
                                    rows={2}
                                    placeholder="Describe what happens in this action..."
                                    className="bg-white/10 border-white/20 text-white text-sm"
                                  />
                                  <div className="mt-2">
                                    <Input
                                      value={action.estimatedTime || ''}
                                      onChange={(e) => updateAction(lane.id, action.id, { estimatedTime: e.target.value })}
                                      placeholder="Est. time (optional)"
                                      className="bg-white/10 border-white/20 text-white text-sm"
                                    />
                                  </div>
                                </div>
                              ))}

                              {lane.actions.length === 0 && (
                                <div className="text-center py-4 text-white/50 text-sm">
                                  No actions defined for this actor.
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-morphism border-white/20 underwater-glow">
                  <CardContent className="text-center py-12">
                    <Network className="w-16 h-16 mx-auto mb-4 text-white/50" />
                    <p className="text-white/70 mb-2">No sequence selected</p>
                    <p className="text-white/50 text-sm">Create or select a sequence to start designing.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysisResults.length > 0 && (
          <div className="space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={exportResults}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
            </div>

            {/* Analysis Results */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <CardTitle className="text-white">Design Implications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {analysisResults.map((result, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-white">{result.personaName}</h3>
                            <Badge 
                              className={`${
                                result.priority === 'high' ? 'bg-red-500' :
                                result.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              } text-white`}
                            >
                              {result.priority}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            {Object.entries(result.implications).map(([category, items]) => (
                              items.length > 0 && (
                                <div key={category}>
                                  <h4 className="font-medium text-white/90 capitalize">{category}:</h4>
                                  <ul className="text-white/70 ml-4">
                                    {items.map((item, i) => (
                                      <li key={i} className="list-disc">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            ))}
                          </div>
                          <p className="text-white/60 text-xs mt-3 italic">{result.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <CardTitle className="text-white">Collaborative Pain Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {collaborativePainPoints.map((painPoint, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-white">{painPoint.laneName}</h3>
                            <Badge 
                              className={`${
                                painPoint.severity === 'critical' ? 'bg-red-600' :
                                painPoint.severity === 'high' ? 'bg-red-500' :
                                painPoint.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              } text-white`}
                            >
                              {painPoint.severity}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            {Object.entries(painPoint.painPoints).map(([category, items]) => (
                              items.length > 0 && (
                                <div key={category}>
                                  <h4 className="font-medium text-white/90 capitalize">{category}:</h4>
                                  <ul className="text-white/70 ml-4">
                                    {items.map((item, i) => (
                                      <li key={i} className="list-disc">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )
                            ))}
                          </div>
                          {painPoint.recommendations.length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-medium text-white/90">Recommendations:</h4>
                              <ul className="text-white/70 ml-4 text-sm">
                                {painPoint.recommendations.map((rec, i) => (
                                  <li key={i} className="list-disc">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysisResults.length === 0 && (
          <Card className="glass-morphism border-white/20 underwater-glow">
            <CardContent className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-white/50" />
              <p className="text-white/70 mb-2">No analysis results yet</p>
              <p className="text-white/50 text-sm">Run an analysis on a workflow to see results here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
