'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, Send, Plus, User } from 'lucide-react'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
}

interface Message {
  type: 'user' | 'persona'
  content: string
  timestamp: string
}

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPersonas()
  }, [])

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas')
      const data = await response.json()
      setPersonas(data)
      if (data.length > 0) setSelectedPersona(data[0])
    } catch (error) {
      console.error('Failed to load personas:', error)
    }
  }

  const createDemoPersona = async () => {
    const demoPersona = {
      name: "Sarah Chen",
      age: 29,
      occupation: "UX Designer",
      location: "San Francisco, CA",
      introduction: "I'm a creative UX designer who loves solving user problems and creating beautiful, intuitive interfaces.",
      personalityTraits: ["Creative", "Empathetic", "Detail-oriented"],
      interests: ["Design", "Psychology", "Photography", "Hiking"]
    }

    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPersona),
      })
      const newPersona = await response.json()
      setPersonas(prev => [newPersona, ...prev])
      setSelectedPersona(newPersona)
      setMessages([])
    } catch (error) {
      console.error('Failed to create persona:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedPersona || loading) return

    const userMessage: Message = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await fetch(`/api/personas/${selectedPersona.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      })

      const data = await response.json()
      
      const aiMessage: Message = {
        type: 'persona',
        content: data.response,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">PersonaDoc</h1>
          <Button onClick={createDemoPersona}>
            <Plus className="w-4 h-4 mr-2" />
            Create Demo Persona
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Personas ({personas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {personas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No personas yet. Create one to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {personas.map((persona) => (
                      <div
                        key={persona.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPersona?.id === persona.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          setSelectedPersona(persona)
                          setMessages([])
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{persona.name}</h3>
                            <p className="text-sm text-gray-600">
                              {persona.occupation} • {persona.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedPersona ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat with {selectedPersona.name}
                  </CardTitle>
                  {selectedPersona.introduction && (
                    <p className="text-sm text-gray-600">{selectedPersona.introduction}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Start a conversation with {selectedPersona.name}!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                msg.type === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white border'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white border rounded-lg px-4 py-2">
                          <p className="text-sm text-gray-500">{selectedPersona.name} is typing...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Message ${selectedPersona.name}...`}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={loading}
                    />
                    <Button onClick={sendMessage} disabled={!inputMessage.trim() || loading}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select a persona to start chatting</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
