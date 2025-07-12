'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Users, Globe, Heart, Brain, DollarSign, Accessibility, Loader2 } from 'lucide-react'

interface InclusivitySuggestionsProps {
  persona: any
  onApplySuggestion: (suggestion: any) => void
}

interface AISuggestion {
  category: string
  suggestion: string
  impact: string
  research_prompt: string
}

const categoryIcons: { [key: string]: any } = {
  'Economic Diversity': DollarSign,
  'Accessibility': Accessibility,
  'Cultural Context': Globe,
  'Gender Identity': Heart,
  'Digital Literacy': Brain,
  'Family Structure': Users,
  default: Sparkles
}

export function InclusivitySuggestions({ persona, onApplySuggestion }: InclusivitySuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState<AISuggestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Show reminder occasionally to nudge users
    const timer = setTimeout(() => {
      setShowReminder(true)
    }, 45000) // Show every 45 seconds

    return () => clearTimeout(timer)
  }, [])

  const fetchAISuggestions = async () => {
    if (!persona?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/personas/${persona.id}/inclusivity-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'general' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentSuggestions(data.suggestions || [])
        setCurrentIndex(0)
      } else {
        throw new Error('Failed to fetch suggestions')
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
      setError('Unable to generate suggestions. Please try again.')
      // Fallback to a basic suggestion
      setCurrentSuggestions([{
        category: 'Inclusive Design',
        suggestion: 'Consider exploring diverse user perspectives to make this persona more inclusive.',
        impact: 'Better representation leads to more accessible and inclusive product design.',
        research_prompt: 'What diverse experiences and needs might we be overlooking for this persona?'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExpand = async () => {
    setIsExpanded(true)
    setShowReminder(false)
    if (currentSuggestions.length === 0) {
      await fetchAISuggestions()
    }
  }

  const nextSuggestion = () => {
    if (currentSuggestions.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % currentSuggestions.length)
    }
  }

  const generateNewSuggestions = async () => {
    await fetchAISuggestions()
  }

  const getCurrentSuggestion = () => {
    return currentSuggestions[currentIndex] || null
  }

  if (!showReminder && !isExpanded) return null

  const currentSuggestion = getCurrentSuggestion()
  const IconComponent = currentSuggestion 
    ? (categoryIcons[currentSuggestion.category] || categoryIcons.default)
    : Sparkles

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isExpanded ? (
        <Button
          onClick={handleExpand}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      ) : (
        <Card className="w-80 bg-white/95 backdrop-blur-md border-purple-200 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                <Sparkles className="h-4 w-4" />
                AI Inclusivity Insights
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="ml-2 text-sm text-gray-600">Generating insights...</span>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <Button
                  onClick={generateNewSuggestions}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            ) : currentSuggestion ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <IconComponent className="h-4 w-4 text-purple-600" />
                  {currentSuggestion.category}
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    <strong>Suggestion:</strong> {currentSuggestion.suggestion}
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Impact:</strong> {currentSuggestion.impact}
                  </p>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 <strong>Research question:</strong> {currentSuggestion.research_prompt}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={currentSuggestions.length > 1 ? nextSuggestion : generateNewSuggestions}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {currentSuggestions.length > 1 ? 'Next Idea' : 'New Ideas'}
                  </Button>
                  <Button
                    onClick={() => onApplySuggestion(currentSuggestion)}
                    size="sm"
                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    Explore This
                  </Button>
                </div>

                {currentSuggestions.length > 1 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-400">
                      {currentIndex + 1} of {currentSuggestions.length}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                AI-powered insights for inclusive design ✨
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
