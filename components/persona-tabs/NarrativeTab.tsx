'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Map, Play, Brain, Heart, Clock, MapPin, Users, Target, RefreshCw } from 'lucide-react'

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

interface NarrativeTabProps {
  persona: Persona
}

interface JourneyStep {
  id: string
  title: string
  description: string
  emotion: string
  decisionPoints: string[]
  personaThoughts: string
}

interface ScenarioDefinition {
  where: string
  how: string
  withWho: string
  when: string
  why: string
  emoji: string
}

const SCENARIO_TEMPLATES = [
  {
    emoji: '🛒',
    title: 'Shopping Journey',
    where: 'Online store',
    how: 'Mobile app',
    withWho: 'Alone',
    when: 'Weekend morning',
    why: 'Need new work clothes'
  },
  {
    emoji: '🏥',
    title: 'Healthcare Visit',
    where: 'Medical clinic',
    how: 'In-person appointment',
    withWho: 'With partner',
    when: 'Weekday afternoon',
    why: 'Annual checkup'
  },
  {
    emoji: '🍕',
    title: 'Food Ordering',
    where: 'Home',
    how: 'Delivery app',
    withWho: 'With friends',
    when: 'Friday evening',
    why: 'Social gathering'
  },
  {
    emoji: '🏦',
    title: 'Banking Experience',
    where: 'Bank branch',
    how: 'Mobile + in-person',
    withWho: 'Alone',
    when: 'Lunch break',
    why: 'Loan application'
  },
  {
    emoji: '✈️',
    title: 'Travel Planning',
    where: 'Home + airport',
    how: 'Website + mobile',
    withWho: 'With family',
    when: 'Planning vacation',
    why: 'Family trip'
  }
]

const EMOTION_OPTIONS = [
  { emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-800' },
  { emoji: '😐', label: 'Neutral', color: 'bg-gray-100 text-gray-800' },
  { emoji: '😟', label: 'Concerned', color: 'bg-yellow-100 text-yellow-800' },
  { emoji: '😤', label: 'Frustrated', color: 'bg-orange-100 text-orange-800' },
  { emoji: '😡', label: 'Angry', color: 'bg-red-100 text-red-800' },
  { emoji: '🤔', label: 'Confused', color: 'bg-purple-100 text-purple-800' },
  { emoji: '😍', label: 'Delighted', color: 'bg-pink-100 text-pink-800' }
]

export default function NarrativeTab({ persona }: NarrativeTabProps) {
  const [scenario, setScenario] = useState<ScenarioDefinition>({
    where: '',
    how: '',
    withWho: '',
    when: '',
    why: '',
    emoji: '🎯'
  })
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  const applyTemplate = (template: any) => {
    setScenario({
      where: template.where,
      how: template.how,
      withWho: template.withWho,
      when: template.when,
      why: template.why,
      emoji: template.emoji
    })
    setSelectedTemplate(SCENARIO_TEMPLATES.indexOf(template))
  }

  const generateJourney = async () => {
    if (!scenario.where || !scenario.why) return

    setLoading(true)
    try {
      const response = await fetch(`/api/personas/${persona.id}/narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          persona: {
            name: persona.name,
            personalityTraits: persona.personalityTraits,
            interests: persona.interests,
            behaviorScores: persona.metadata?.personality
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setJourneySteps(data.journeySteps)
      }
    } catch (error) {
      console.error('Failed to generate journey:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEmotionInfo = (emotion: string) => {
    return EMOTION_OPTIONS.find(e => e.emoji === emotion) || EMOTION_OPTIONS[1]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scenario Definition */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Scenario Definition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Emoji Selector */}
            <div>
              <Label>Scenario Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['🛒', '🏥', '🍕', '🏦', '✈️', '🏠', '🚗', '💼', '🎓', '🎮', '📱', '🎪'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setScenario(prev => ({ ...prev, emoji }))}
                    className={`p-3 text-2xl border rounded-lg hover:bg-gray-50 ${
                      scenario.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 5W Framework */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="where" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Where
                </Label>
                <Input
                  id="where"
                  placeholder="Location or context"
                  value={scenario.where}
                  onChange={(e) => setScenario(prev => ({ ...prev, where: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="how" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  How
                </Label>
                <Input
                  id="how"
                  placeholder="Method or channel"
                  value={scenario.how}
                  onChange={(e) => setScenario(prev => ({ ...prev, how: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="withWho" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  With Who
                </Label>
                <Input
                  id="withWho"
                  placeholder="Companions or alone"
                  value={scenario.withWho}
                  onChange={(e) => setScenario(prev => ({ ...prev, withWho: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="when" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  When
                </Label>
                <Input
                  id="when"
                  placeholder="Time and context"
                  value={scenario.when}
                  onChange={(e) => setScenario(prev => ({ ...prev, when: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="why" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Why
                </Label>
                <Textarea
                  id="why"
                  placeholder="Motivation and goals"
                  value={scenario.why}
                  onChange={(e) => setScenario(prev => ({ ...prev, why: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
            </div>

            <Button
              onClick={generateJourney}
              disabled={loading || !scenario.where || !scenario.why}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Journey...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Journey
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Template Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCENARIO_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedTemplate === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.emoji}</span>
                  <div>
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs text-gray-600">{template.where} • {template.when}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Persona Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {persona.name}'s Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Personality Influence</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {persona.personalityTraits?.slice(0, 3).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Journey will reflect {persona.name}'s decision-making patterns and emotional responses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Visualization */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              {persona.name}'s Journey Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {journeySteps.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <div className="text-6xl mb-4">{scenario.emoji || '🎯'}</div>
                <p className="text-lg mb-2">No journey generated yet</p>
                <p className="text-sm">Define your scenario using the 5W framework and click "Generate Journey"</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Scenario Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{scenario.emoji}</div>
                    <div>
                      <h3 className="font-semibold text-lg">Journey Scenario</h3>
                      <p className="text-sm text-gray-600">
                        {persona.name} {scenario.why} {scenario.where} {scenario.when} {scenario.withWho && `with ${scenario.withWho}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Journey Steps */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-300"></div>
                  
                  <div className="space-y-8">
                    {journeySteps.map((step, index) => {
                      const emotionInfo = getEmotionInfo(step.emotion)
                      return (
                        <div key={step.id} className="relative flex gap-6">
                          {/* Timeline Node */}
                          <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${emotionInfo.color}`}>
                              <span className="text-lg">{step.emotion}</span>
                            </div>
                            <div className="absolute top-14 left-1/2 transform -translate-x-1/2">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                Step {index + 1}
                              </Badge>
                            </div>
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 pb-8">
                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <h4 className="font-semibold text-lg">{step.title}</h4>
                                  <Badge className={emotionInfo.color}>
                                    {emotionInfo.emoji} {emotionInfo.label}
                                  </Badge>
                                </div>
                                
                                <p className="text-gray-700 mb-4">{step.description}</p>

                                {step.decisionPoints.length > 0 && (
                                  <div className="mb-4">
                                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Decision Points
                                    </h5>
                                    <ul className="space-y-1">
                                      {step.decisionPoints.map((decision, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                          <span className="text-blue-500 mt-1">•</span>
                                          {decision}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {step.personaThoughts && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                      <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-sm font-medium text-blue-900 mb-1">
                                          {persona.name}'s thoughts:
                                        </p>
                                        <p className="text-sm text-blue-800">{step.personaThoughts}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Journey Summary */}
                <Card className="bg-gray-50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Journey Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-600">Emotional Journey</Label>
                        <div className="flex gap-1 mt-1">
                          {journeySteps.map((step, index) => (
                            <span key={index} className="text-lg" title={`Step ${index + 1}`}>
                              {step.emotion}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Total Steps</Label>
                        <div className="text-2xl font-bold text-blue-600">{journeySteps.length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
