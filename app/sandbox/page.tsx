'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Wand2, Play, Save, Trash2, Eye, Code, Users, Lightbulb, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  metadata?: any
}

interface GeneratedUI {
  id: string
  name: string
  description: string
  prompt: string
  htmlCode: string
  cssCode: string
  jsCode: string
  personaIds: string[]
  createdAt: string
  lastModified: string
}

interface Experiment {
  id: string
  name: string
  description: string
  generatedUIs: GeneratedUI[]
  createdAt: string
}

export default function GenerativeUISandbox() {
  const { data: session } = useSession()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null)
  const [currentUI, setCurrentUI] = useState<GeneratedUI | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // UI Generation Form
  const [uiPrompt, setUiPrompt] = useState('')
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [uiName, setUiName] = useState('')
  const [uiDescription, setUiDescription] = useState('')
  
  // Preview Mode
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview')
  const [activeTab, setActiveTab] = useState<'experiments' | 'generate' | 'preview'>('experiments')

  useEffect(() => {
    if (session) {
      loadPersonas()
      loadExperiments()
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
    }
  }

  const loadExperiments = async () => {
    try {
      const response = await fetch('/api/sandbox/experiments')
      if (response.ok) {
        const data = await response.json()
        setExperiments(data)
      }
    } catch (error) {
      console.error('Failed to load experiments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createExperiment = () => {
    const newExperiment: Experiment = {
      id: `exp-${Date.now()}`,
      name: 'New Experiment',
      description: '',
      generatedUIs: [],
      createdAt: new Date().toISOString()
    }
    setExperiments([newExperiment, ...experiments])
    setCurrentExperiment(newExperiment)
    setActiveTab('generate')
  }

  const generateUI = async () => {
    if (!uiPrompt.trim() || !currentExperiment) {
      alert('Please provide a UI description and select an experiment.')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/sandbox/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: uiPrompt,
          name: uiName || `Generated UI ${Date.now()}`,
          description: uiDescription,
          personaIds: selectedPersonas,
          experimentId: currentExperiment.id
        })
      })

      if (response.ok) {
        const generatedUI = await response.json()
        
        // Update current experiment with new UI
        const updatedExperiment = {
          ...currentExperiment,
          generatedUIs: [...currentExperiment.generatedUIs, generatedUI]
        }
        
        setCurrentExperiment(updatedExperiment)
        setExperiments(experiments.map(exp => 
          exp.id === currentExperiment.id ? updatedExperiment : exp
        ))
        
        setCurrentUI(generatedUI)
        setActiveTab('preview')
        
        // Clear form
        setUiPrompt('')
        setUiName('')
        setUiDescription('')
        setSelectedPersonas([])
      } else {
        const error = await response.json()
        alert('UI generation failed: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('UI generation failed:', error)
      alert('UI generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const selectUI = (ui: GeneratedUI) => {
    setCurrentUI(ui)
    setActiveTab('preview')
  }

  const getPersonaName = (id: string) => personas.find(p => p.id === id)?.name || 'Unknown'

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
              <p className="text-slate-700 font-medium">Loading sandbox...</p>
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
          
          <div className="glass-morphism p-6 rounded-xl border border-white/20 underwater-glow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Generative UI Sandbox</h1>
                <p className="text-blue-100">AI-powered interface generation with persona testing</p>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{personas.length} Personas Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>{experiments.length} Experiments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 glass-morphism border-white/20">
            <TabsTrigger value="experiments" className="text-white data-[state=active]:bg-white/20">
              Experiments
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-white data-[state=active]:bg-white/20">
              Generate UI
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-white data-[state=active]:bg-white/20">
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Experiments Tab */}
          <TabsContent value="experiments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Your Experiments</h2>
              <Button onClick={createExperiment} className="bg-purple-500 hover:bg-purple-600">
                <Lightbulb className="w-4 h-4 mr-2" />
                New Experiment
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiments.map(experiment => (
                <Card key={experiment.id} className="glass-morphism border-white/20 underwater-glow cursor-pointer hover:border-white/40 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">{experiment.name}</CardTitle>
                    <p className="text-blue-100 text-sm">{experiment.description || 'No description'}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-200">Generated UIs:</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {experiment.generatedUIs.length}
                        </Badge>
                      </div>
                      
                      {experiment.generatedUIs.length > 0 && (
                        <div className="space-y-2">
                          {experiment.generatedUIs.slice(0, 3).map(ui => (
                            <div
                              key={ui.id}
                              onClick={() => {
                                setCurrentExperiment(experiment)
                                selectUI(ui)
                              }}
                              className="p-2 bg-white/10 rounded border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm font-medium">{ui.name}</span>
                                <Eye className="w-4 h-4 text-blue-300" />
                              </div>
                              <p className="text-blue-200 text-xs mt-1 truncate">{ui.description}</p>
                            </div>
                          ))}
                          {experiment.generatedUIs.length > 3 && (
                            <p className="text-blue-300 text-xs">+{experiment.generatedUIs.length - 3} more UIs</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCurrentExperiment(experiment)
                            setActiveTab('generate')
                          }}
                          className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Wand2 className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                        {experiment.generatedUIs.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentExperiment(experiment)
                              setCurrentUI(experiment.generatedUIs[0])
                              setActiveTab('preview')
                            }}
                            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {experiments.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Lightbulb className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Experiments Yet</h3>
                  <p className="text-blue-200 mb-4">Create your first experiment to start generating custom UIs</p>
                  <Button onClick={createExperiment} className="bg-purple-500 hover:bg-purple-600">
                    Create Your First Experiment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Generate UI Tab */}
          <TabsContent value="generate" className="space-y-6">
            <div className="glass-morphism p-6 rounded-xl border border-white/20 underwater-glow">
              <h2 className="text-xl font-semibold text-white mb-6">Generate Custom UI</h2>
              
              {!currentExperiment && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-200">Please select or create an experiment first.</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* UI Generation Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">UI Name</label>
                    <Input
                      value={uiName}
                      onChange={(e) => setUiName(e.target.value)}
                      placeholder="e.g., User Registration Form"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Description</label>
                    <Input
                      value={uiDescription}
                      onChange={(e) => setUiDescription(e.target.value)}
                      placeholder="Brief description of the UI purpose"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      UI Generation Prompt
                    </label>
                    <Textarea
                      value={uiPrompt}
                      onChange={(e) => setUiPrompt(e.target.value)}
                      placeholder="Describe the UI you want to generate. Be specific about functionality, layout, styling, and any persona-specific requirements.

Example: Create a dashboard for project managers with task overview, team member cards, progress charts, and quick action buttons. Use a modern design with blue/green color scheme."
                      className="bg-white/10 border-white/20 text-white h-32 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Test with Personas ({selectedPersonas.length} selected)
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto bg-white/5 rounded border border-white/20 p-3">
                      {personas.map(persona => (
                        <label key={persona.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPersonas.includes(persona.id)}
                            onChange={(e) => {
                              setSelectedPersonas(e.target.checked 
                                ? [...selectedPersonas, persona.id]
                                : selectedPersonas.filter(id => id !== persona.id)
                              )
                            }}
                            className="rounded"
                          />
                          <span className="text-white">{persona.name}</span>
                          <span className="text-blue-300 text-xs">({persona.occupation || 'No occupation'})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generation Info */}
                <div className="space-y-4">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">🤖 AI Generation Process</h3>
                    <div className="text-blue-200 text-sm space-y-2">
                      <p>• AI analyzes your prompt and persona requirements</p>
                      <p>• Generates HTML, CSS, and JavaScript code</p>
                      <p>• Creates persona-specific variations and insights</p>
                      <p>• Provides real-time preview and code view</p>
                    </div>
                  </div>

                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-2">💡 Pro Tips</h3>
                    <div className="text-purple-200 text-sm space-y-1">
                      <p>• Be specific about layout and functionality</p>
                      <p>• Mention color schemes and styling preferences</p>
                      <p>• Include persona-specific requirements</p>
                      <p>• Describe interactions and user flows</p>
                    </div>
                  </div>

                  {currentExperiment && (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-2">Current Experiment</h3>
                      <p className="text-green-200 text-sm">{currentExperiment.name}</p>
                      <p className="text-green-300 text-xs">{currentExperiment.generatedUIs.length} UIs generated</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={generateUI}
                  disabled={generating || !currentExperiment || !uiPrompt.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating UI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate UI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            {currentUI ? (
              <div className="space-y-4">
                {/* UI Info Header */}
                <div className="glass-morphism p-4 rounded-xl border border-white/20 underwater-glow">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-white">{currentUI.name}</h2>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewMode(previewMode === 'preview' ? 'code' : 'preview')}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        {previewMode === 'preview' ? (
                          <>
                            <Code className="w-4 h-4 mr-1" />
                            View Code
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-blue-200 text-sm mb-3">{currentUI.description}</p>
                  
                  {currentUI.personaIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-300 text-sm">Tested with:</span>
                      <div className="flex gap-1">
                        {currentUI.personaIds.map(personaId => (
                          <Badge key={personaId} variant="secondary" className="bg-white/20 text-white text-xs">
                            {getPersonaName(personaId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Preview/Code View */}
                <div className="glass-morphism rounded-xl border border-white/20 underwater-glow overflow-hidden">
                  {previewMode === 'preview' ? (
                    <div className="bg-white">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `
                            <style>${currentUI.cssCode}</style>
                            <div>${currentUI.htmlCode}</div>
                            <script>${currentUI.jsCode}</script>
                          `
                        }}
                      />
                    </div>
                  ) : (
                    <div className="p-4">
                      <Tabs defaultValue="html" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
                          <TabsTrigger value="html" className="text-white data-[state=active]:bg-white/20">HTML</TabsTrigger>
                          <TabsTrigger value="css" className="text-white data-[state=active]:bg-white/20">CSS</TabsTrigger>
                          <TabsTrigger value="js" className="text-white data-[state=active]:bg-white/20">JavaScript</TabsTrigger>
                        </TabsList>
                        <TabsContent value="html">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                            <code>{currentUI.htmlCode}</code>
                          </pre>
                        </TabsContent>
                        <TabsContent value="css">
                          <pre className="bg-gray-900 text-blue-400 p-4 rounded text-sm overflow-x-auto">
                            <code>{currentUI.cssCode}</code>
                          </pre>
                        </TabsContent>
                        <TabsContent value="js">
                          <pre className="bg-gray-900 text-yellow-400 p-4 rounded text-sm overflow-x-auto">
                            <code>{currentUI.jsCode}</code>
                          </pre>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No UI Selected</h3>
                <p className="text-blue-200 mb-4">Generate a new UI or select an existing one to preview</p>
                <Button onClick={() => setActiveTab('generate')} className="bg-purple-500 hover:bg-purple-600">
                  Generate New UI
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
