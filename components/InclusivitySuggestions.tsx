'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Users, Globe, Heart, Brain, DollarSign, Accessibility, Loader2, Home, GraduationCap, Activity } from 'lucide-react'

interface InclusivitySuggestionsProps {
  persona: any
  onApplySuggestion: (suggestion: any) => void
}

interface AISuggestion {
  label: string
  icon_type: string
  description: string
}

const iconMapping: { [key: string]: any } = {
  accessibility: Accessibility,
  identity: Heart,
  culture: Globe,
  economic: DollarSign,
  family: Users,
  health: Activity,
  education: GraduationCap,
  geographic: Home,
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
        label: 'Neurodivergent',
        icon_type: 'accessibility',
        description: 'Consider different cognitive processing patterns and accessibility needs.'
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
    ? (iconMapping[currentSuggestion.icon_type] || iconMapping.default)
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
        <Card className="w-96 bg-white/95 backdrop-blur-md border-purple-200 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                <Sparkles className="h-4 w-4" />
                Granular Perspective Insights
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
            <p className="text-xs text-gray-600 mt-1">
              Specific behavioral patterns and contextual factors
            </p>
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
              <div className="space-y-4">
                {/* Enhanced granular suggestion display */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-800 leading-tight mb-1">
                        {currentSuggestion.label}
                      </h3>
                      <span className="text-xs text-purple-600 font-medium capitalize bg-purple-100 px-2 py-1 rounded">
                        {currentSuggestion.icon_type} context
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentSuggestion.description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={currentSuggestions.length > 1 ? nextSuggestion : generateNewSuggestions}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={isLoading}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {currentSuggestions.length > 1 ? 'Next Insight' : 'New Insights'}
                  </Button>
                  <Button
                    onClick={() => onApplySuggestion(currentSuggestion)}
                    size="sm"
                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    Apply Context
                  </Button>
                </div>

                {currentSuggestions.length > 1 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-400">
                      {currentIndex + 1} of {currentSuggestions.length} insights
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Contextual insights for authentic personas ✨
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
