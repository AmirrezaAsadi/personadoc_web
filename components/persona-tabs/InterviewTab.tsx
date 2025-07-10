'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Send, Lightbulb, Brain, History, Search } from 'lucide-react'

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

interface Message {
  type: 'user' | 'persona'
  content: string
  timestamp: string
  reasoning?: string
}

interface InterviewTabProps {
  persona: Persona
}

const CONVERSATION_STARTERS = [
  "Tell me about a typical day in your life",
  "What's your biggest challenge at work?",
  "How do you prefer to learn new things?",
  "What motivates you the most?",
  "Describe your ideal weekend",
  "What technology do you use daily?",
  "How do you make important decisions?",
  "What are your long-term goals?"
]

export default function InterviewTab({ persona }: InterviewTabProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showReasoning, setShowReasoning] = useState(false)

  useEffect(() => {
    // Load conversation history
    loadConversationHistory()
  }, [persona.id])

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/personas/${persona.id}/conversations`)
      if (response.ok) {
        const history = await response.json()
        setMessages(history.messages || [])
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error)
    }
  }

  const createInterviewPrompt = (message: string, context?: string) => {
    const behaviorScores = persona.metadata?.personality || {}
    
    return `You are ${persona.name}, a ${persona.age}-year-old ${persona.occupation} living in ${persona.location}.

PERSONALITY: ${persona.personalityTraits?.join(', ') || 'Not specified'}
INTERESTS: ${persona.interests?.join(', ') || 'Not specified'}
BEHAVIORAL TRAITS:
- Tech Savvy: ${behaviorScores.techSavvy || 5}/10
- Socialness: ${behaviorScores.socialness || 5}/10  
- Creativity: ${behaviorScores.creativity || 5}/10
- Organization: ${behaviorScores.organization || 5}/10
- Risk Taking: ${behaviorScores.riskTaking || 5}/10
- Adaptability: ${behaviorScores.adaptability || 5}/10

BACKGROUND: ${persona.introduction || 'No background provided'}

${context ? `RELEVANT CONTEXT: ${context}` : ''}

Respond naturally as ${persona.name}, incorporating your personality and background. Keep responses conversational and authentic. After your response, provide a brief explanation of why you responded this way based on your personality traits and background.

Format your response as:
RESPONSE: [Your natural response as ${persona.name}]
REASONING: [Brief explanation of why you responded this way]

User: ${message}`
  }

  const sendMessage = async (messageText?: string) => {
    const finalMessage = messageText || inputMessage
    if (!finalMessage.trim() || loading) return

    const userMessage: Message = {
      type: 'user',
      content: finalMessage,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const prompt = createInterviewPrompt(finalMessage)
      
      const response = await fetch(`/api/personas/${persona.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      })

      const data = await response.json()
      
      // Parse response and reasoning
      const responseText = data.response || ''
      const [responsePart, reasoningPart] = responseText.split('REASONING:')
      const cleanResponse = responsePart.replace('RESPONSE:', '').trim()
      const reasoning = reasoningPart?.trim()

      const aiMessage: Message = {
        type: 'persona',
        content: cleanResponse,
        reasoning: reasoning,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(msg => 
    searchTerm === '' || 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Conversation Starters & Context */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Conversation Starters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CONVERSATION_STARTERS.map((starter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full text-left h-auto p-3 text-sm"
                onClick={() => sendMessage(starter)}
                disabled={loading}
              >
                {starter}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Persona Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Key Traits</h4>
              <div className="flex flex-wrap gap-1">
                {persona.personalityTraits?.map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Behavioral Profile</h4>
              <div className="space-y-2 text-xs">
                {persona.metadata?.personality && Object.entries(persona.metadata.personality).map(([key, value]) => {
                  if (typeof value === 'number' && value >= 1 && value <= 10) {
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-medium">{value}/10</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1"
              >
                <Brain className="h-3 w-3" />
                {showReasoning ? 'Hide' : 'Show'} Reasoning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-3">
        <Card className="h-[700px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Interview with {persona.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-32">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Start your interview with {persona.name}</p>
                  <p className="text-sm mt-2">Use the conversation starters or ask your own questions</p>
                </div>
              ) : (
                filteredMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border shadow-sm'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                      
                      {/* Show reasoning for persona responses */}
                      {message.type === 'persona' && message.reasoning && showReasoning && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-blue-900 mb-1">Why I responded this way:</p>
                              <p className="text-xs text-blue-800">{message.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question or start a conversation..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={loading || !inputMessage.trim()}
                  className="px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
