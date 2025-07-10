'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Heart, Briefcase, Home, Globe, MessageCircle, Plus, Settings } from 'lucide-react'

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

  useEffect(() => {
    loadSocialConnections()
  }, [persona.id])

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

  const addConnection = (connectionData: Partial<SocialConnection>) => {
    const newConnection: SocialConnection = {
      id: Date.now().toString(),
      name: connectionData.name || '',
      relationshipType: connectionData.relationshipType || 'friend',
      connectionStrength: connectionData.connectionStrength || 5,
      influenceLevel: connectionData.influenceLevel || 5,
      description: connectionData.description || '',
      isProtopersona: false
    }
    setConnections(prev => [...prev, newConnection])
    setShowAddForm(false)
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Network Overview */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {persona.name}'s Social Network
              </CardTitle>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Network Visualization */}
            <div className="relative bg-gray-50 rounded-lg p-8 min-h-[400px] mb-6">
              {/* Central Persona */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-bold text-sm">{persona.name?.charAt(0)}</span>
                </div>
                <p className="text-center text-sm font-medium mt-2">{persona.name}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedConnection.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {getRelationshipInfo(selectedConnection.relationshipType).label}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600">{selectedConnection.description}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Connection Strength</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedConnection.connectionStrength * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{selectedConnection.connectionStrength}/10</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Influence Level</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
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
                
                {selectedConnection.isProtopersona && (
                  <Button variant="outline" className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Develop into Full Persona
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Network Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connections.length}</div>
                <div className="text-sm text-gray-600">Total Connections</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Avg. Connection Strength:</span>
                  <span className="font-medium">
                    {connections.length > 0 
                      ? (connections.reduce((sum, c) => sum + c.connectionStrength, 0) / connections.length).toFixed(1)
                      : '0'}/10
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Influence Level:</span>
                  <span className="font-medium">
                    {connections.length > 0 
                      ? (connections.reduce((sum, c) => sum + c.influenceLevel, 0) / connections.length).toFixed(1)
                      : '0'}/10
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Click on any connection in the network to view details and start conversations.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Connections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Suggested Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SUGGESTED_CONNECTIONS.map((suggestion, index) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => addConnection({
                  name: suggestion.name,
                  relationshipType: suggestion.type as any,
                  description: suggestion.description,
                  connectionStrength: 6,
                  influenceLevel: 5
                })}>
                <div className="font-medium text-sm">{suggestion.name}</div>
                <div className="text-xs text-gray-600">{suggestion.description}</div>
                <Badge variant="outline" className="text-xs mt-1">
                  {getRelationshipInfo(suggestion.type).label}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
