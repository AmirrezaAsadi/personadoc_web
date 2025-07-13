'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Users, Brain, Lightbulb, Download, Loader2, Network, AlertTriangle, Plus, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  metadata?: any
}

interface SwimLaneAction {
  id: string
  title: string
  description: string
  order: number
  estimatedTime?: string
}

interface SwimLane {
  id: string
  name: string
  personaId: string
  color: string
  description?: string
  actions: SwimLaneAction[]
}

interface Workflow {
  id: string
  name: string
  description: string
  swimLanes: SwimLane[]
  collaborationType: 'sequential' | 'parallel' | 'hybrid'
}

interface DesignImplication {
  personaId: string
  personaName: string
  implications: {
    userInterface: string[]
    functionality: string[]
    accessibility: string[]
    content: string[]
    technical: string[]
    behavioral: string[]
  }
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

interface CollaborativePainPoint {
  workflowId: string
  laneId: string
  laneName: string
  involvedPersonas: string[]
  painPoints: {
    communication: string[]
    coordination: string[]
    trust: string[]
    efficiency: string[]
    technical: string[]
  }
  recommendations: string[]
  severity: 'critical' | 'high' | 'medium' | 'low'
}

const SWIMLANE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
]

export default function MultiPersonaAnalysisPage() {
  const { data: session } = useSession()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [systemInfo, setSystemInfo] = useState({
    title: '',
    description: '',
    requirements: '',
    constraints: '',
    targetPlatform: '',
    businessGoals: ''
  })
  const [analysisResults, setAnalysisResults] = useState<DesignImplication[]>([])
  const [collaborativePainPoints, setCollaborativePainPoints] = useState<CollaborativePainPoint[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workflow' | 'analysis'>('workflow')

  useEffect(() => {
    if (session) {
      loadPersonas()
    }
  }, [session])

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas')
      if (response.ok) {
        const data = await response.json()
        setPersonas(data)
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Workflow Management
  const createWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Sequence',
      description: '',
      swimLanes: [],
      collaborationType: 'sequential'
    }
    setWorkflows([...workflows, newWorkflow])
    setCurrentWorkflow(newWorkflow)
  }

  const updateWorkflow = (updates: Partial<Workflow>) => {
    if (!currentWorkflow) return
    
    const updatedWorkflow = { ...currentWorkflow, ...updates }
    setCurrentWorkflow(updatedWorkflow)
    setWorkflows(workflows.map(w => w.id === currentWorkflow.id ? updatedWorkflow : w))
  }

  const addSwimLane = () => {
    if (!currentWorkflow) return
    
    const newSwimLane: SwimLane = {
      id: `lane-${Date.now()}`,
      name: 'New Actor',
      personaId: '',
      color: SWIMLANE_COLORS[currentWorkflow.swimLanes.length % SWIMLANE_COLORS.length],
      description: '',
      actions: []
    }
    
    updateWorkflow({
      swimLanes: [...currentWorkflow.swimLanes, newSwimLane]
    })
  }

  const updateSwimLane = (laneId: string, updates: Partial<SwimLane>) => {
    if (!currentWorkflow) return
    
    updateWorkflow({
      swimLanes: currentWorkflow.swimLanes.map(lane => 
        lane.id === laneId ? { ...lane, ...updates } : lane
      )
    })
  }

  const removeSwimLane = (laneId: string) => {
    if (!currentWorkflow) return
    
    updateWorkflow({
      swimLanes: currentWorkflow.swimLanes.filter(lane => lane.id !== laneId)
    })
  }

  const addAction = (laneId: string) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId)
    if (!lane) return
    
    const newAction: SwimLaneAction = {
      id: `action-${Date.now()}`,
      title: 'New Action',
      description: '',
      order: lane.actions.length + 1
    }
    
    updateSwimLane(laneId, {
      actions: [...lane.actions, newAction]
    })
  }

  const updateAction = (laneId: string, actionId: string, updates: Partial<SwimLaneAction>) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId)
    if (!lane) return
    
    updateSwimLane(laneId, {
      actions: lane.actions.map(action => 
        action.id === actionId ? { ...action, ...updates } : action
      )
    })
  }

  const removeAction = (laneId: string, actionId: string) => {
    const lane = currentWorkflow?.swimLanes.find(l => l.id === laneId)
    if (!lane) return
    
    updateSwimLane(laneId, {
      actions: lane.actions.filter(action => action.id !== actionId)
    })
  }

  const handleAnalyze = async () => {
    if (!currentWorkflow || currentWorkflow.swimLanes.length === 0 || !systemInfo.title || !systemInfo.description) {
      alert('Please create a sequence with swim lanes and provide system information.')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/multi-persona-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: currentWorkflow,
          systemInfo
        })
      })

      if (response.ok) {
        const results = await response.json()
        setAnalysisResults(results.implications || [])
        setCollaborativePainPoints(results.collaborativePainPoints || [])
        setActiveTab('analysis')
      } else {
        const error = await response.json()
        alert('Analysis failed: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportResults = () => {
    const exportData = {
      systemInfo,
      workflow: currentWorkflow,
      analysisResults,
      collaborativePainPoints,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sequence-analysis-${systemInfo.title.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPersonaName = (id: string) => personas.find(p => p.id === id)?.name || 'Select Persona'

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
    )
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
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-cyan-100 underwater-glow mb-2">
              Multi-Persona Sequence Analysis
            </h1>
            <p className="text-cyan-200 text-lg">
              Design sequence diagrams with persona swim lanes and analyze collaboration patterns
            </p>
          </div>
        </div>

        {/* Workflow/Analysis Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'workflow' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Network className="w-4 h-4 inline mr-2" />
              Sequence Design
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'analysis' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Analysis Results
            </button>
          </div>
        </div>

        {activeTab === 'workflow' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column: Configuration */}
            <div className="space-y-6">
              {/* System Information */}
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Brain className="w-5 h-5" />
                    System Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      System/Product Title *
                    </label>
                    <Input
                      value={systemInfo.title}
                      onChange={(e) => setSystemInfo(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., E-commerce Platform"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Description *
                    </label>
                    <Textarea
                      value={systemInfo.description}
                      onChange={(e) => setSystemInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the interaction sequence..."
                      rows={3}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Target Platform
                    </label>
                    <Input
                      value={systemInfo.targetPlatform}
                      onChange={(e) => setSystemInfo(prev => ({ ...prev, targetPlatform: e.target.value }))}
                      placeholder="Web, Mobile, Desktop..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sequence Management */}
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
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
                        <p className="text-lg mb-2">No actors defined</p>
                        <p className="text-sm">Add swim lanes to represent different personas/actors in your sequence.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Swim Lane Headers */}
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${currentWorkflow.swimLanes.length}, 1fr)` }}>
                          {currentWorkflow.swimLanes.map((lane) => (
                            <div key={lane.id} className="text-center">
                              <div 
                                className="p-4 rounded-lg border-2 mb-4" 
                                style={{ borderColor: lane.color, backgroundColor: lane.color + '20' }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lane.color }}></div>
                                    <Input
                                      value={lane.name}
                                      onChange={(e) => updateSwimLane(lane.id, { name: e.target.value })}
                                      placeholder="Actor name"
                                      className="bg-white/10 border-white/20 text-white text-sm"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => removeSwimLane(lane.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-300 hover:text-red-200 h-6 w-6 p-0 ml-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                <select
                                  value={lane.personaId}
                                  onChange={(e) => updateSwimLane(lane.id, { personaId: e.target.value })}
                                  className="w-full bg-white/10 border border-white/20 text-white rounded px-2 py-1 text-xs mb-2"
                                >
                                  <option value="" className="bg-gray-800">Select Persona</option>
                                  {personas.map(persona => (
                                    <option key={persona.id} value={persona.id} className="bg-gray-800">
                                      {persona.name}
                                    </option>
                                  ))}
                                </select>

                                <Input
                                  value={lane.description || ''}
                                  onChange={(e) => updateSwimLane(lane.id, { description: e.target.value })}
                                  placeholder="Role description"
                                  className="bg-white/10 border-white/20 text-white text-xs"
                                />
                              </div>

                              {/* Action sequence for this lane */}
                              <div className="space-y-2">
                                {lane.actions.sort((a, b) => a.order - b.order).map((action, index) => (
                                  <div key={action.id} className="bg-white/5 rounded p-3 text-left">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs text-white/60">#{index + 1}</span>
                                      <Button
                                        onClick={() => removeAction(lane.id, action.id)}
                                        size="sm"
                                        variant="outline"
                                        className="text-red-300 hover:text-red-200 h-5 w-5 p-0"
                                      >
                                        <Trash2 className="w-2 h-2" />
                                      </Button>
                                    </div>
                                    <Input
                                      value={action.title}
                                      onChange={(e) => updateAction(lane.id, action.id, { title: e.target.value })}
                                      placeholder="Action title"
                                      className="bg-white/10 border-white/20 text-white text-xs mb-2"
                                    />
                                    <Textarea
                                      value={action.description}
                                      onChange={(e) => updateAction(lane.id, action.id, { description: e.target.value })}
                                      placeholder="Action description"
                                      rows={2}
                                      className="bg-white/10 border-white/20 text-white text-xs mb-2"
                                    />
                                    <Input
                                      value={action.estimatedTime || ''}
                                      onChange={(e) => updateAction(lane.id, action.id, { estimatedTime: e.target.value })}
                                      placeholder="Duration"
                                      className="bg-white/10 border-white/20 text-white text-xs"
                                    />
                                  </div>
                                ))}
                                
                                <Button
                                  onClick={() => addAction(lane.id)}
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-white/70 border-white/20 hover:bg-white/10"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Action
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-morphism border-white/20 underwater-glow">
                  <CardContent className="text-center py-12">
                    <Network className="w-16 h-16 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white/70 mb-2">
                      Create Your First Sequence
                    </h3>
                    <p className="text-white/50 mb-4">
                      Design persona interaction sequences like a sequence diagram.
                    </p>
                    <Button
                      onClick={createWorkflow}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Sequence
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {(analysisResults.length > 0 || collaborativePainPoints.length > 0) && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-cyan-100">Analysis Results</h2>
                  <Button
                    onClick={exportResults}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Analysis
                  </Button>
                </div>

                {/* Collaborative Pain Points */}
                {collaborativePainPoints.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-cyan-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Collaboration Pain Points
                    </h3>
                    {collaborativePainPoints.map((painPoint, index) => (
                      <Card key={index} className="glass-morphism border-white/20 underwater-glow">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <span>{painPoint.laneName}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              painPoint.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                              painPoint.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                              painPoint.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {painPoint.severity} severity
                            </span>
                          </CardTitle>
                          <p className="text-white/70 text-sm">
                            Involves: {painPoint.involvedPersonas.join(', ')}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {Object.entries(painPoint.painPoints).map(([category, points]) => (
                            points.length > 0 && (
                              <div key={category} className="space-y-2">
                                <h4 className="font-medium text-white/90 capitalize">
                                  {category} Issues
                                </h4>
                                <ul className="space-y-1">
                                  {points.map((point, pointIndex) => (
                                    <li key={pointIndex} className="text-white/70 text-sm flex items-start">
                                      <span className="text-red-300 mr-2">⚠</span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          ))}
                          
                          <div className="border-t border-white/10 pt-4">
                            <h4 className="font-medium text-white/90 mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                              {painPoint.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="text-green-300 text-sm flex items-start">
                                  <span className="text-green-400 mr-2">✓</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Individual Analysis Results */}
                {analysisResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-cyan-100">Individual Persona Insights</h3>
                    {analysisResults.map((result) => (
                      <Card key={result.personaId} className="glass-morphism border-white/20 underwater-glow">
                        <CardHeader>
                          <CardTitle className="text-white">
                            {result.personaName}
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              result.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                              result.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {result.priority} priority
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-white/5 rounded-lg p-3">
                            <h4 className="font-medium text-white/90 mb-2">Rationale</h4>
                            <p className="text-white/70 text-sm">{result.rationale}</p>
                          </div>
                          
                          {Object.entries(result.implications).map(([category, implications]) => (
                            implications.length > 0 && (
                              <div key={category} className="space-y-2">
                                <h4 className="font-medium text-white/90 capitalize">
                                  {category.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <ul className="space-y-1">
                                  {implications.map((implication, index) => (
                                    <li key={index} className="text-white/70 text-sm flex items-start">
                                      <span className="text-cyan-300 mr-2">•</span>
                                      {implication}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {analysisResults.length === 0 && collaborativePainPoints.length === 0 && (
              <Card className="glass-morphism border-white/20 underwater-glow">
                <CardContent className="text-center py-12">
                  <Lightbulb className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white/70 mb-2">
                    No Analysis Results
                  </h3>
                  <p className="text-white/50">
                    Create a sequence with swim lanes and run analysis to see results here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
