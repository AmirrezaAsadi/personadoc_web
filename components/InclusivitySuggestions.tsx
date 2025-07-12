'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Users, Globe, Heart, Brain, DollarSign, Accessibility } from 'lucide-react'

interface InclusivitySuggestionsProps {
  persona: any
  onApplySuggestion: (suggestion: any) => void
}

const inclusivitySuggestions = [
  {
    category: 'Economic Diversity',
    icon: DollarSign,
    suggestions: [
      { aspect: 'Income Level', options: ['Low income', 'Middle income', 'High income', 'Variable income'] },
      { aspect: 'Employment', options: ['Full-time', 'Part-time', 'Gig worker', 'Student', 'Retired', 'Unemployed'] },
      { aspect: 'Financial Goals', options: ['Saving for basics', 'Building emergency fund', 'Investing', 'Debt management'] }
    ]
  },
  {
    category: 'Accessibility & Abilities',
    icon: Accessibility,
    suggestions: [
      { aspect: 'Physical Abilities', options: ['Mobility differences', 'Visual differences', 'Hearing differences', 'Cognitive differences'] },
      { aspect: 'Technology Access', options: ['Screen reader user', 'Voice control user', 'Limited device access', 'Slow internet'] },
      { aspect: 'Communication', options: ['Sign language', 'Alternative communication', 'Multiple languages', 'Learning differences'] }
    ]
  },
  {
    category: 'Cultural & Social',
    icon: Globe,
    suggestions: [
      { aspect: 'Cultural Background', options: ['Immigrant experience', 'Multicultural family', 'Indigenous heritage', 'Rural vs urban'] },
      { aspect: 'Family Structure', options: ['Single parent', 'Multigenerational home', 'Chosen family', 'Long-distance relationships'] },
      { aspect: 'Social Context', options: ['Community leader', 'Social anxiety', 'Extroverted networker', 'Prefers small groups'] }
    ]
  },
  {
    category: 'Gender & Identity',
    icon: Heart,
    suggestions: [
      { aspect: 'Gender Identity', options: ['Non-binary', 'Transgender', 'Gender-fluid', 'Questioning'] },
      { aspect: 'Pronouns', options: ['They/them', 'She/her', 'He/him', 'Multiple pronouns', 'Name only'] },
      { aspect: 'Expression', options: ['Traditional', 'Gender-neutral', 'Fluid expression', 'Professional constraints'] }
    ]
  },
  {
    category: 'Literacy & Learning',
    icon: Brain,
    suggestions: [
      { aspect: 'Digital Literacy', options: ['Tech-savvy', 'Basic digital skills', 'Learning technology', 'Prefers offline'] },
      { aspect: 'Language', options: ['Multilingual', 'English as second language', 'Regional dialects', 'Professional jargon'] },
      { aspect: 'Learning Style', options: ['Visual learner', 'Hands-on learner', 'Audio learner', 'Takes time to process'] }
    ]
  }
]

export function InclusivitySuggestions({ persona, onApplySuggestion }: InclusivitySuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentSuggestion, setCurrentSuggestion] = useState<any>(null)
  const [showReminder, setShowReminder] = useState(true)

  useEffect(() => {
    // Show reminder occasionally to nudge users
    const timer = setTimeout(() => {
      setShowReminder(true)
    }, 30000) // Show every 30 seconds

    return () => clearTimeout(timer)
  }, [])

  const getRandomSuggestion = () => {
    const category = inclusivitySuggestions[Math.floor(Math.random() * inclusivitySuggestions.length)]
    const aspect = category.suggestions[Math.floor(Math.random() * category.suggestions.length)]
    const option = aspect.options[Math.floor(Math.random() * aspect.options.length)]
    
    return {
      category: category.category,
      icon: category.icon,
      aspect: aspect.aspect,
      option: option,
      prompt: `Consider exploring: How might "${option}" influence ${persona?.name || 'this persona'}'s ${aspect.aspect.toLowerCase()}?`
    }
  }

  const handleExpand = () => {
    setIsExpanded(true)
    setCurrentSuggestion(getRandomSuggestion())
    setShowReminder(false)
  }

  const generateNewSuggestion = () => {
    setCurrentSuggestion(getRandomSuggestion())
  }

  if (!showReminder && !isExpanded) return null

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
                Inclusive Research Suggestions
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
            {currentSuggestion && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <currentSuggestion.icon className="h-4 w-4 text-purple-600" />
                  {currentSuggestion.category}
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {currentSuggestion.prompt}
                  </p>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  💡 <strong>Research tip:</strong> Consider how {currentSuggestion.aspect.toLowerCase()} might affect their technology use, decision-making, and daily experiences.
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={generateNewSuggestion}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    New Idea
                  </Button>
                  <Button
                    onClick={() => onApplySuggestion(currentSuggestion)}
                    size="sm"
                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    Explore This
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Building inclusive personas creates better products for everyone ✨
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
