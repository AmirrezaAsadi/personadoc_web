'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Heart, Briefcase, Home, Globe, MessageCircle, Plus, Settings, Send, X, Sparkles, Bot } from 'lucide-react'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  metadata?: any
}

interface SocialConnection {
  id: string
  name: string
  relationshipType: 'family' | 'professional' | 'friend' | 'community' | 'online'
  connectionStrength: number // 1-10
  influenceLevel: number // 1-10
  description: string
  isProtopersona?: boolean
}

interface SocialCircleTabProps {
  persona: Persona
}

const RELATIONSHIP_TYPES = [
  { id: 'family', label: 'Family', icon: Home, color: 'bg-red-500' },
  { id: 'professional', label: 'Professional', icon: Briefcase, color: 'bg-blue-500' },
  { id: 'friend', label: 'Friends', icon: Heart, color: 'bg-green-500' },
  { id: 'community', label: 'Community', icon: Users, color: 'bg-purple-500' },
  { id: 'online', label: 'Online', icon: Globe, color: 'bg-orange-500' }
]

const SUGGESTED_CONNECTIONS = [
  { name: 'Sarah (Colleague)', type: 'professional', description: 'Works in the same team' },
  { name: 'Mom', type: 'family', description: 'Primary family influence' },
  { name: 'Best Friend Alex', type: 'friend', description: 'Close personal friend' },
  { name: 'Neighborhood Group', type: 'community', description: 'Local community involvement' },
  { name: 'LinkedIn Network', type: 'online', description: 'Professional online connections' }
]

export default function SocialCircleTab({ persona }: SocialCircleTabProps) {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<SocialConnection | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [chatWithConnection, setChatWithConnection] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    loadSocialConnections()
    generateAISuggestions()
  }, [persona.id])

  const generateAISuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/personas/${persona.id}/social-circle/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to load AI suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const loadSocialConnections = async () => {
    try {
      const response = await fetch(`/api/personas/${persona.id}/social-circle`)
      if (response.ok) {
        const data = await response.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Failed to load social connections:', error)
    }
  }

  const addConnection = async (connectionData: Partial<SocialConnection>) => {
    const newConnection: SocialConnection = {
      id: Date.now().toString(),
      name: connectionData.name || '',
      relationshipType: connectionData.relationshipType || 'friend',
      connectionStrength: connectionData.connectionStrength || 5,
      influenceLevel: connectionData.influenceLevel || 5,
      description: connectionData.description || '',
      isProtopersona: false
    }
    
    const updatedConnections = [...connections, newConnection]
    setConnections(updatedConnections)
    setShowAddForm(false)
    
    // Save to API
    try {
      await fetch(`/api/personas/${persona.id}/social-circle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections: updatedConnections }),
      })
    } catch (error) {
      console.error('Failed to save connection:', error)
    }
  }

  const getRelationshipInfo = (type: string) => {
    return RELATIONSHIP_TYPES.find(r => r.id === type) || RELATIONSHIP_TYPES[0]
  }

  const getConnectionsByType = (type: string) => {
    return connections.filter(c => c.relationshipType === type)
  }

  const startChatWithConnection = (connectionId: string) => {
    setChatWithConnection(connectionId)
  }

  const addSuggestionAsConnection = async (suggestion: any) => {
    const newConnection: SocialConnection = {
      id: Date.now().toString(),
      name: suggestion.name,
      relationshipType: suggestion.type,
      connectionStrength: suggestion.strength,
      influenceLevel: suggestion.influence,
      description: suggestion.description,
      isProtopersona: false
    }
    
    const updatedConnections = [...connections, newConnection]
    setConnections(updatedConnections)
    
    // Save to API
    try {
      await fetch(`/api/personas/${persona.id}/social-circle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connections: updatedConnections }),
      })
    } catch (error) {
      console.error('Failed to save connection:', error)
    }
  }

  const createProtopersonaFromConnection = async (connection: SocialConnection) => {
    try {
      // Navigate to persona creation with pre-filled data based on the connection
      const protoPersonaData = {
        name: connection.name,
        occupation: connection.relationshipType === 'professional' ? 'Professional Contact' : '',
        introduction: connection.description,
        personalityTraits: [],
        interests: [],
        metadata: {
          isProtopersona: true,
          baseConnection: connection,
          createdFrom: persona.id
        }
      }
      
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protoPersonaData),
      })
      
      if (response.ok) {
        const newPersona = await response.json()
        // Update the connection to mark it as a protopersona
        const updatedConnections = connections.map(c => 
          c.id === connection.id 
            ? { ...c, isProtopersona: true, protopersonaId: newPersona.id }
            : c
        )
        setConnections(updatedConnections)
        
        // Save updated connections
        await fetch(`/api/personas/${persona.id}/social-circle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connections: updatedConnections }),
        })
        
        // Provide better feedback
        const confirmed = window.confirm(
          `Protopersona "${connection.name}" created successfully!\n\n` +
          `Would you like to navigate to the new protopersona to develop it further?`
        )
        
        if (confirmed) {
          // Navigate to the new protopersona
          window.open(`/personas/${newPersona.id}`, '_blank')
        }
      } else {
        throw new Error('Failed to create protopersona')
      }
    } catch (error) {
      console.error('Failed to create protopersona:', error)
      alert('Failed to create protopersona. Please try again.')
    }
  }

  const getInfluenceColor = (level: number) => {
    if (level >= 8) return 'text-red-600'
    if (level >= 6) return 'text-orange-600'
    if (level >= 4) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return 'border-green-500 bg-green-50'
    if (strength >= 6) return 'border-blue-500 bg-blue-50'
    if (strength >= 4) return 'border-yellow-500 bg-yellow-50'
    return 'border-gray-400 bg-gray-50'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-white text-slate-800 rounded-lg">
      {/* Network Overview */}
      <div className="lg:col-span-2">
        <Card className="bg-white border-slate-200">
          <CardHeader className="bg-white border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-slate-600" />
                {persona.name}'s Social Network
              </CardTitle>
              <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            {/* Network Visualization */}
            <div className="relative bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg p-8 min-h-[400px] mb-6 border border-slate-200">
              {/* Central Persona */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-bold text-sm">{persona.name?.charAt(0)}</span>
                </div>
                <p className="text-center text-sm font-medium mt-2 text-slate-800">{persona.name}</p>
              </div>

              {/* Connection Nodes */}
              {connections.map((connection, index) => {
                const relationshipInfo = getRelationshipInfo(connection.relationshipType)
                const Icon = relationshipInfo.icon
                const angle = (index * (360 / connections.length)) * (Math.PI / 180)
                const radius = 120
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                return (
                  <div
                    key={connection.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`
                    }}
                    onClick={() => setSelectedConnection(connection)}
                  >
                    {/* Connection Line */}
                    <div
                      className="absolute border-t-2 border-gray-300 origin-left"
                      style={{
                        width: `${radius}px`,
                        transform: `rotate(${angle + Math.PI}rad)`,
                        top: '50%',
                        left: '50%'
                      }}
                    />
                    
                    {/* Node */}
                    <div className={`w-12 h-12 ${relationshipInfo.color} rounded-full flex items-center justify-center border-2 border-white shadow-md hover:scale-110 transition-transform ${getStrengthColor(connection.connectionStrength)}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-center text-xs mt-1 max-w-16 leading-tight">
                      {connection.name}
                    </p>
                  </div>
                )
              })}

              {connections.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No social connections added yet</p>
                    <p className="text-sm">Click "Add Connection" to build {persona.name}'s network</p>
                  </div>
                </div>
              )}
            </div>

            {/* Relationship Type Legend */}
            <div className="flex flex-wrap gap-4 justify-center">
              {RELATIONSHIP_TYPES.map((type) => {
                const Icon = type.icon
                const count = getConnectionsByType(type.id).length
                return (
                  <div key={type.id} className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${type.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{type.label} ({count})</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Details & Controls */}
      <div className="space-y-6">
        {selectedConnection ? (
          <Card className="bg-white border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-slate-600" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">{selectedConnection.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {getRelationshipInfo(selectedConnection.relationshipType).label}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-600">{selectedConnection.description}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Connection Strength</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedConnection.connectionStrength * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600">{selectedConnection.connectionStrength}/10</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Influence Level</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${selectedConnection.influenceLevel * 10}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getInfluenceColor(selectedConnection.influenceLevel)}`}>
                      {selectedConnection.influenceLevel}/10
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => startChatWithConnection(selectedConnection.id)}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with {selectedConnection.name}
                </Button>
                
                {!selectedConnection.isProtopersona ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => createProtopersonaFromConnection(selectedConnection)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Protopersona
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    <Users className="w-4 h-4 mr-2" />
                    Protopersona Created
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-slate-200">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Settings className="h-5 w-5 text-slate-600" />
                Network Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connections.length}</div>
                <div className="text-sm text-slate-600">Total Connections</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Avg. Connection Strength:</span>
                  <span className="font-medium text-slate-800">
                    {connections.length > 0 
                      ? (connections.reduce((sum, c) => sum + c.connectionStrength, 0) / connections.length).toFixed(1)
                      : '0'}/10
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Avg. Influence Level:</span>
                  <span className="font-medium text-slate-800">
                    {connections.length > 0 
                      ? (connections.reduce((sum, c) => sum + c.influenceLevel, 0) / connections.length).toFixed(1)
                      : '0'}/10
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Click on any connection in the network to view details and start conversations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Connections */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="bg-white border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Plus className="h-5 w-5 text-slate-600" />
              Suggested Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 bg-white">
            {SUGGESTED_CONNECTIONS.map((suggestion, index) => (
              <div key={index} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer bg-white transition-colors"
                onClick={() => addConnection({
                  name: suggestion.name,
                  relationshipType: suggestion.type as any,
                  description: suggestion.description,
                  connectionStrength: 6,
                  influenceLevel: 5
                })}>
                <div className="font-medium text-sm text-slate-800">{suggestion.name}</div>
                <div className="text-xs text-slate-600">{suggestion.description}</div>
                <Badge variant="outline" className="text-xs mt-1">
                  {getRelationshipInfo(suggestion.type).label}
                </Badge>
              </div>
            ))}

            {/* AI Suggestions */}
            {loadingSuggestions ? (
              <div className="flex items-center justify-center p-4">
                <Bot className="w-5 h-5 animate-spin mr-2 text-blue-600" />
                <span className="text-sm text-slate-600">Generating AI suggestions...</span>
              </div>
            ) : aiSuggestions.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Sparkles className="w-4 h-4" />
                  AI Suggestions
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer bg-white transition-colors"
                    onClick={() => addSuggestionAsConnection(suggestion)}>
                    <div className="font-medium text-sm text-slate-800">{suggestion.name}</div>
                    <div className="text-xs text-slate-600">{suggestion.description}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getRelationshipInfo(suggestion.type).label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Strength: {suggestion.strength}/10 | Influence: {suggestion.influence}/10
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Connection Form Modal */}
      {showAddForm && <AddConnectionForm onAdd={addConnection} onCancel={() => setShowAddForm(false)} />}

      {/* Chat Modal */}
      {chatWithConnection && (
        <ChatModal 
          connectionId={chatWithConnection}
          connectionName={connections.find(c => c.id === chatWithConnection)?.name || ''}
          personaId={persona.id}
          onClose={() => setChatWithConnection(null)}
        />
      )}
    </div>
  )
}

// Add Connection Form Component
function AddConnectionForm({ onAdd, onCancel }: { 
  onAdd: (data: Partial<SocialConnection>) => void
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    relationshipType: 'friend' as const,
    connectionStrength: 5,
    influenceLevel: 5,
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onAdd(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Add New Connection</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Connection name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Relationship Type</label>
            <select
              value={formData.relationshipType}
              onChange={(e) => setFormData({ ...formData, relationshipType: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RELATIONSHIP_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="How do you know this person?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Connection Strength: {formData.connectionStrength}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.connectionStrength}
              onChange={(e) => setFormData({ ...formData, connectionStrength: parseInt(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Influence Level: {formData.influenceLevel}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.influenceLevel}
              onChange={(e) => setFormData({ ...formData, influenceLevel: parseInt(e.target.value) })}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">Add Connection</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Chat Modal Component
function ChatModal({ 
  connectionId, 
  connectionName, 
  personaId, 
  onClose 
}: { 
  connectionId: string
  connectionName: string
  personaId: string
  onClose: () => void 
}) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    const userMessage = { role: 'user' as const, content: newMessage }
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setLoading(true)

    try {
      // Simulate AI response for the connection
      // In a real app, you might have different AI endpoints for different connections
      const response = await fetch(`/api/personas/${personaId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are responding as ${connectionName}. User says: ${newMessage}`,
          chatHistory: messages
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I'm having trouble responding right now. Please try again later.` 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl h-2/3 flex flex-col border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <h3 className="text-lg font-semibold">Chat with {connectionName}</h3>
          <Button variant="outline" onClick={onClose} className="text-white border-white hover:bg-white hover:text-slate-800">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">Start a conversation with {connectionName}</p>
              <p className="text-sm text-slate-500 mt-2">They'll respond based on their personality and relationship with your persona</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-slate-800 border border-slate-200'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-800 px-4 py-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Message ${connectionName}...`}
              className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
