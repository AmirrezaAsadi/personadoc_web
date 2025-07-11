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
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Map className="h-5 w-5 text-cyan-600" />
              Scenario Definition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Emoji Selector */}
            <div>
              <Label className="text-slate-700">Scenario Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['🛒', '🏥', '🍕', '🏦', '✈️', '🏠', '🚗', '💼', '🎓', '🎮', '📱', '🎪'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setScenario(prev => ({ ...prev, emoji }))}
                    className={`p-3 text-2xl border rounded-lg hover:bg-slate-50 ${
                      scenario.emoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
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
                <Label htmlFor="where" className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-cyan-600" />
                  Where
                </Label>
                <Input
                  id="where"
                  placeholder="Location or context"
                  value={scenario.where}
                  onChange={(e) => setScenario(prev => ({ ...prev, where: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="how" className="flex items-center gap-2 text-slate-700">
                  <Target className="h-4 w-4 text-cyan-600" />
                  How
                </Label>
                <Input
                  id="how"
                  placeholder="Method or channel"
                  value={scenario.how}
                  onChange={(e) => setScenario(prev => ({ ...prev, how: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="withWho" className="flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-cyan-600" />
                  With Who
                </Label>
                <Input
                  id="withWho"
                  placeholder="Companions or alone"
                  value={scenario.withWho}
                  onChange={(e) => setScenario(prev => ({ ...prev, withWho: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="when" className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4 text-cyan-600" />
                  When
                </Label>
                <Input
                  id="when"
                  placeholder="Time and context"
                  value={scenario.when}
                  onChange={(e) => setScenario(prev => ({ ...prev, when: e.target.value }))}
                  className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>

              <div>
                <Label htmlFor="why" className="flex items-center gap-2 text-slate-700">
                  <Heart className="h-4 w-4 text-cyan-600" />
                  Why
                </Label>
                <Textarea
                  id="why"
                  placeholder="Motivation and goals"
                  value={scenario.why}
                  onChange={(e) => setScenario(prev => ({ ...prev, why: e.target.value }))}
                  className="min-h-[60px] bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                />
              </div>
            </div>

            <Button
              onClick={generateJourney}
              disabled={loading || !scenario.where || !scenario.why}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
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
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm text-slate-800">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCENARIO_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${
                  selectedTemplate === index ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                }`}
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{template.emoji}</span>
                  <div>
                    <div className="font-medium text-sm text-slate-800">{template.title}</div>
                    <div className="text-xs text-slate-600">{template.where} • {template.when}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Persona Context */}
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Brain className="h-5 w-5 text-cyan-600" />
              {persona.name}'s Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-slate-600">Personality Influence</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {persona.personalityTraits?.slice(0, 3).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-600">
              Journey will reflect {persona.name}'s decision-making patterns and emotional responses
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey Visualization */}
      <div className="lg:col-span-2">
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Map className="h-5 w-5 text-cyan-600" />
              {persona.name}'s Journey Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {journeySteps.length === 0 ? (
              <div className="text-center text-slate-500 py-16">
                <div className="text-8xl mb-6 animate-bounce">{scenario.emoji || '🎯'}</div>
                <p className="text-xl mb-3 text-slate-800">Ready to map {persona.name}'s journey?</p>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Define your scenario using the 5W framework (Where, How, With Who, When, Why) and click "Generate Journey" to create an emoji-rich timeline of {persona.name}'s experience.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="text-2xl">📍</span>
                  <span className="text-2xl">➡️</span>
                  <span className="text-2xl">😊</span>
                  <span className="text-2xl">➡️</span>
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Scenario Summary */}
                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl animate-pulse">{scenario.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-xl text-slate-800 mb-2">
                        {persona.name}'s Journey: {scenario.emoji} → 🎯
                      </h3>
                      <p className="text-slate-700 leading-relaxed">
                        <span className="font-medium">{persona.name}</span> wants to{' '}
                        <span className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">{scenario.why}</span>{' '}
                        at <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">{scenario.where}</span>{' '}
                        during <span className="bg-green-100 px-2 py-1 rounded text-green-800">{scenario.when}</span>
                        {scenario.withWho && (
                          <span> with <span className="bg-purple-100 px-2 py-1 rounded text-purple-800">{scenario.withWho}</span></span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Journey Preview */}
                  <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-white/70 rounded-lg">
                    <span className="text-sm text-slate-600">Emotional Journey:</span>
                    {journeySteps.map((step, index) => (
                      <span key={index} className="text-2xl hover:scale-125 transition-transform cursor-pointer" title={step.title}>
                        {step.emotion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enhanced Timeline */}
                <div className="relative">
                  {/* Gradient Timeline Line */}
                  <div className="absolute left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400 rounded-full shadow-lg"></div>
                  
                  <div className="space-y-12">
                    {journeySteps.map((step, index) => {
                      const emotionInfo = getEmotionInfo(step.emotion)
                      const isEven = index % 2 === 0
                      
                      return (
                        <div key={step.id} className={`relative flex gap-8 ${isEven ? '' : 'flex-row-reverse'}`}>
                          {/* Enhanced Timeline Node */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="relative">
                              <div className={`w-16 h-16 rounded-full border-4 border-white shadow-xl flex items-center justify-center bg-gradient-to-br ${
                                emotionInfo.label === 'Happy' || emotionInfo.label === 'Delighted' ? 'from-green-400 to-green-600' :
                                emotionInfo.label === 'Frustrated' || emotionInfo.label === 'Angry' ? 'from-red-400 to-red-600' :
                                emotionInfo.label === 'Confused' ? 'from-purple-400 to-purple-600' :
                                emotionInfo.label === 'Concerned' ? 'from-yellow-400 to-yellow-600' :
                                'from-gray-400 to-gray-600'
                              } hover:scale-110 transition-transform duration-300`}>
                                <span className="text-2xl filter drop-shadow-lg">{step.emotion}</span>
                              </div>
                              
                              {/* Step Number Badge */}
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                {index + 1}
                              </div>
                              
                              {/* Connecting Arrow */}
                              {index < journeySteps.length - 1 && (
                                <div className={`absolute top-20 ${isEven ? 'left-1/2' : 'right-1/2'} transform -translate-x-1/2`}>
                                  <div className="text-2xl text-blue-400 animate-bounce">⬇️</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Step Content */}
                          <div className="flex-1 pb-12">
                            <Card className={`bg-white border-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                              emotionInfo.label === 'Happy' || emotionInfo.label === 'Delighted' ? 'border-green-200 hover:border-green-300' :
                              emotionInfo.label === 'Frustrated' || emotionInfo.label === 'Angry' ? 'border-red-200 hover:border-red-300' :
                              emotionInfo.label === 'Confused' ? 'border-purple-200 hover:border-purple-300' :
                              emotionInfo.label === 'Concerned' ? 'border-yellow-200 hover:border-yellow-300' :
                              'border-gray-200 hover:border-gray-300'
                            }`}>
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-bold text-xl text-slate-800">{step.title}</h4>
                                      <span className="text-2xl">{step.emotion}</span>
                                    </div>
                                    <Badge className={`${emotionInfo.color} text-xs font-medium`}>
                                      {emotionInfo.emoji} {emotionInfo.label} Emotion
                                    </Badge>
                                  </div>
                                </div>
                                
                                <p className="text-slate-700 mb-6 leading-relaxed text-base">{step.description}</p>

                                {step.decisionPoints.length > 0 && (
                                  <div className="mb-6">
                                    <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-800">
                                      <Target className="h-5 w-5 text-cyan-600" />
                                      Key Decision Points
                                    </h5>
                                    <div className="grid gap-2">
                                      {step.decisionPoints.map((decision, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                          <span className="text-blue-500 font-bold text-lg mt-0.5">💭</span>
                                          <span className="text-sm text-slate-700 flex-1">{decision}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {step.personaThoughts && (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-inner">
                                    <div className="flex items-start gap-3">
                                      <Brain className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900 mb-2">
                                          💭 {persona.name}'s inner thoughts:
                                        </p>
                                        <p className="text-sm text-blue-800 italic leading-relaxed">"{step.personaThoughts}"</p>
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

                {/* Enhanced Journey Summary */}
                <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="font-bold text-xl mb-6 text-slate-800 flex items-center gap-3">
                      📊 Journey Analytics & Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        <Label className="text-sm text-slate-600 block mb-2">Emotional Journey Map</Label>
                        <div className="flex justify-center gap-1 mb-2">
                          {journeySteps.map((step, index) => (
                            <span 
                              key={index} 
                              className="text-3xl hover:scale-125 transition-transform cursor-pointer p-1" 
                              title={`Step ${index + 1}: ${step.title} (${getEmotionInfo(step.emotion).label})`}
                            >
                              {step.emotion}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-slate-500">Hover for details</div>
                      </div>
                      
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        <Label className="text-sm text-slate-600 block mb-2">Journey Complexity</Label>
                        <div className="text-3xl font-bold text-blue-600 mb-1">{journeySteps.length}</div>
                        <div className="text-sm text-slate-600">Steps Total</div>
                      </div>
                      
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        <Label className="text-sm text-slate-600 block mb-2">Decision Points</Label>
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {journeySteps.reduce((total, step) => total + step.decisionPoints.length, 0)}
                        </div>
                        <div className="text-sm text-slate-600">Choices Made</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 leading-relaxed">
                        <span className="font-semibold">💡 Journey Insight:</span> This {journeySteps.length}-step journey reflects {persona.name}'s unique personality traits and decision-making patterns. 
                        The emotional progression shows how they navigate challenges and opportunities in this specific scenario.
                      </p>
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
