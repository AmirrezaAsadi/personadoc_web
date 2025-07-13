'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  ArrowRight,
  Info,
  RotateCcw
} from 'lucide-react'

interface PoliticalCompassProps {
  initialValues?: {
    economic: number // -10 to 10 (left to right)
    social: number   // -10 to 10 (authoritarian to libertarian)
  }
  onUpdate?: (values: { economic: number; social: number }) => void
  readOnly?: boolean
}

interface CompassQuadrant {
  name: string
  color: string
  description: string
  economicRange: [number, number]
  socialRange: [number, number]
}

const QUADRANTS: CompassQuadrant[] = [
  {
    name: "Authoritarian Left",
    color: "bg-red-500",
    description: "Supports strong government control and economic equality",
    economicRange: [-10, 0],
    socialRange: [0, 10]
  },
  {
    name: "Authoritarian Right", 
    color: "bg-blue-500",
    description: "Supports strong government control and free market economics",
    economicRange: [0, 10],
    socialRange: [0, 10]
  },
  {
    name: "Libertarian Left",
    color: "bg-green-500", 
    description: "Supports personal freedom and economic equality",
    economicRange: [-10, 0],
    socialRange: [-10, 0]
  },
  {
    name: "Libertarian Right",
    color: "bg-yellow-500",
    description: "Supports personal freedom and free market economics", 
    economicRange: [0, 10],
    socialRange: [-10, 0]
  }
]

const POLITICAL_QUESTIONS = [
  {
    id: 'economic_1',
    text: "Private businesses should be heavily regulated by the government",
    axis: 'economic' as const,
    weight: -1 // agree = more left
  },
  {
    id: 'economic_2', 
    text: "Free market capitalism is the best economic system",
    axis: 'economic' as const,
    weight: 1 // agree = more right
  },
  {
    id: 'economic_3',
    text: "Wealth should be redistributed from rich to poor",
    axis: 'economic' as const,
    weight: -1
  },
  {
    id: 'social_1',
    text: "Government surveillance is necessary for public safety",
    axis: 'social' as const,
    weight: 1 // agree = more authoritarian
  },
  {
    id: 'social_2',
    text: "People should be free to make their own choices without government interference",
    axis: 'social' as const,
    weight: -1 // agree = more libertarian
  },
  {
    id: 'social_3',
    text: "Traditional values should be preserved and promoted by society",
    axis: 'social' as const,
    weight: 1
  }
]

export function PoliticalCompass({ initialValues, onUpdate, readOnly = false }: PoliticalCompassProps) {
  const [economic, setEconomic] = useState(initialValues?.economic ?? 0)
  const [social, setSocial] = useState(initialValues?.social ?? 0)
  const [showQuestions, setShowQuestions] = useState(false)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setEconomic(initialValues.economic)
      setSocial(initialValues.social)
    }
  }, [initialValues])

  useEffect(() => {
    const hasChanged = economic !== (initialValues?.economic ?? 0) || 
                      social !== (initialValues?.social ?? 0)
    setHasChanges(hasChanged)
    
    // Auto-update when values change (consistent with other wizard components)
    if (hasChanged && onUpdate) {
      onUpdate({ economic, social })
    }
  }, [economic, social, initialValues, onUpdate])

  const getQuadrant = (econ: number, soc: number): CompassQuadrant => {
    return QUADRANTS.find(q => 
      econ >= q.economicRange[0] && econ <= q.economicRange[1] &&
      soc >= q.socialRange[0] && soc <= q.socialRange[1]
    ) || QUADRANTS[3]
  }

  const calculateFromQuestions = () => {
    let economicScore = 0
    let socialScore = 0
    let economicCount = 0
    let socialCount = 0

    POLITICAL_QUESTIONS.forEach(q => {
      const response = responses[q.id]
      if (response !== undefined) {
        const score = response * q.weight
        if (q.axis === 'economic') {
          economicScore += score
          economicCount++
        } else {
          socialScore += score
          socialCount++
        }
      }
    })

    const newEconomic = economicCount > 0 ? Math.round((economicScore / economicCount) * 2) : 0
    const newSocial = socialCount > 0 ? Math.round((socialScore / socialCount) * 2) : 0

    setEconomic(Math.max(-10, Math.min(10, newEconomic)))
    setSocial(Math.max(-10, Math.min(10, newSocial)))
    setShowQuestions(false)
    
    // Auto-update after calculating from questions
    if (onUpdate) {
      onUpdate({ 
        economic: Math.max(-10, Math.min(10, newEconomic)), 
        social: Math.max(-10, Math.min(10, newSocial)) 
      })
    }
  }



  const handleReset = () => {
    setEconomic(initialValues?.economic ?? 0)
    setSocial(initialValues?.social ?? 0)
    setResponses({})
  }

  const currentQuadrant = getQuadrant(economic, social)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Political Compass
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Optional: Maps political and economic orientation
            </p>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestions(!showQuestions)}
              className="text-xs"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              {showQuestions ? 'Hide Questions' : 'Quick Assessment'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Political Compass Grid */}
        <div className="relative">
          <div className="w-full h-80 border-2 border-gray-300 relative bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Quadrant backgrounds */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-red-100 opacity-50"></div>
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-100 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-green-100 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-100 opacity-50"></div>

            {/* Axis lines */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-400"></div>

            {/* Axis labels */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
              Authoritarian
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700">
              Libertarian
            </div>
            <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 -rotate-90 text-xs font-medium text-gray-700">
              Left
            </div>
            <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 rotate-90 text-xs font-medium text-gray-700">
              Right
            </div>

            {/* Position marker */}
            <div 
              className="absolute w-4 h-4 bg-purple-600 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${((economic + 10) / 20) * 100}%`,
                top: `${((10 - social) / 20) * 100}%`
              }}
              title={`Economic: ${economic}, Social: ${social}`}
            />

            {/* Grid lines */}
            {[-5, 5].map(line => (
              <React.Fragment key={line}>
                <div 
                  className="absolute w-full h-px bg-gray-300 opacity-50"
                  style={{ top: `${((10 - line) / 20) * 100}%` }}
                />
                <div 
                  className="absolute h-full w-px bg-gray-300 opacity-50"
                  style={{ left: `${((line + 10) / 20) * 100}%` }}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Manual adjustment controls */}
          {!readOnly && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium min-w-[100px]">Economic:</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEconomic(Math.max(-10, economic - 1))}
                    disabled={economic <= -10}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-sm font-mono">{economic}</span>
                    <div className="text-xs text-gray-500">
                      {economic < 0 ? 'Left' : economic > 0 ? 'Right' : 'Center'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEconomic(Math.min(10, economic + 1))}
                    disabled={economic >= 10}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium min-w-[100px]">Social:</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSocial(Math.max(-10, social - 1))}
                    disabled={social <= -10}
                  >
                    <TrendingDown className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-sm font-mono">{social}</span>
                    <div className="text-xs text-gray-500">
                      {social < 0 ? 'Libertarian' : social > 0 ? 'Authoritarian' : 'Center'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSocial(Math.min(10, social + 1))}
                    disabled={social >= 10}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Assessment Questions */}
        {showQuestions && !readOnly && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium text-gray-800">Quick Political Assessment</h3>
            <p className="text-sm text-gray-600">
              Rate your agreement with each statement (1 = Strongly Disagree, 5 = Strongly Agree)
            </p>
            
            {POLITICAL_QUESTIONS.map(question => (
              <div key={question.id} className="space-y-2">
                <p className="text-sm">{question.text}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <Button
                      key={value}
                      variant={responses[question.id] === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setResponses({...responses, [question.id]: value})}
                      className="text-xs w-8 h-8 p-0"
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={calculateFromQuestions}
                disabled={Object.keys(responses).length < POLITICAL_QUESTIONS.length}
                className="text-xs"
              >
                Calculate Position
              </Button>
              <Button
                variant="outline"
                onClick={() => setResponses({})}
                className="text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Current Quadrant Info */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-4 h-4 rounded ${currentQuadrant.color}`}></div>
            <Badge variant="secondary" className="text-xs">
              {currentQuadrant.name}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {currentQuadrant.description}
          </p>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Design Implications:</p>
                <ul className="space-y-1">
                  {currentQuadrant.name.includes('Left') && (
                    <li>• May prefer cooperative features and sharing options</li>
                  )}
                  {currentQuadrant.name.includes('Right') && (
                    <li>• May value individual achievement and competition</li>
                  )}
                  {currentQuadrant.name.includes('Authoritarian') && (
                    <li>• May accept stricter moderation and verification systems</li>
                  )}
                  {currentQuadrant.name.includes('Libertarian') && (
                    <li>• May prioritize privacy controls and personal autonomy</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Reset option */}
        {!readOnly && hasChanges && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset to Original
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PoliticalCompass
