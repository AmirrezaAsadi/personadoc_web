'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share2, Users, Map, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import InterviewTab from '@/components/persona-tabs/InterviewTab'
import SocialPostsTab from '@/components/persona-tabs/SocialPostsTab'
import SocialCircleTab from '@/components/persona-tabs/SocialCircleTab'
import NarrativeTab from '@/components/persona-tabs/NarrativeTab'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  metadata?: {
    avatar?: {
      name: string
      type: string
      size: number
      dataUrl: string
    }
    demographics?: {
      gender?: string
      incomeLevel?: string
      education?: string
    }
    personality?: {
      techSavvy?: number
      socialness?: number
      creativity?: number
      organization?: number
      riskTaking?: number
      adaptability?: number
      values?: string
      motivations?: string
    }
    technology?: {
      devicesOwned?: string[]
      appPreferences?: string[]
      techProficiency?: number
      digitalHabits?: string
      communicationPreferences?: string[]
    }
    research?: {
      dataSourceTypes?: string[]
      manualKnowledge?: string
      researchMethodology?: string
    }
  }
}

const TABS = [
  { id: 'interview', label: 'Interview', icon: MessageCircle, description: 'Enhanced chat with conversation starters' },
  { id: 'social', label: 'Social Posts', icon: Share2, description: 'Generate social media content' },
  { id: 'circle', label: 'Social Circle', icon: Users, description: 'Visualize persona connections' },
  { id: 'narrative', label: 'Journey Map', icon: Map, description: 'Create scenario narratives' }
]

export default function PersonaDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [persona, setPersona] = useState<Persona | null>(null)
  const [activeTab, setActiveTab] = useState('interview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id && session) {
      loadPersona()
    }
  }, [params.id, session])

  const loadPersona = async () => {
    try {
      const response = await fetch(`/api/personas/${params.id}`)
      if (response.ok) {
        const personaData = await response.json()
        setPersona(personaData)
      }
    } catch (error) {
      console.error('Failed to load persona:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative">
        {/* Underwater Background */}
        <div className="sea-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
            <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg">
              <p className="text-slate-700 font-medium">Loading persona...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="min-h-screen relative">
        <div className="sea-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center floating">
            <h1 className="text-2xl font-bold text-cyan-100 mb-4 underwater-glow">Persona Not Found</h1>
            <Link href="/">
              <Button className="bg-cyan-600/80 hover:bg-cyan-500/80 text-white border-cyan-400/50 underwater-glow">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    const personaId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!personaId) return null
    
    switch (activeTab) {
      case 'interview':
        return <InterviewTab persona={persona} />
      case 'social':
        return <SocialPostsTab personaId={personaId} persona={persona} />
      case 'circle':
        return <SocialCircleTab persona={persona} />
      case 'narrative':
        return <NarrativeTab persona={persona} />
      default:
        return <InterviewTab persona={persona} />
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Sea Wave Background */}
      <div className="sea-waves">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-100 border-cyan-400/50 underwater-glow backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center floating underwater-glow">
                {persona.metadata?.avatar?.dataUrl ? (
                  <img 
                    src={persona.metadata.avatar.dataUrl} 
                    alt={persona.name} 
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-cyan-100 underwater-glow">{persona.name}</h1>
                <p className="text-cyan-200">
                  {persona.age && `${persona.age} years old`} 
                  {persona.occupation && ` • ${persona.occupation}`}
                  {persona.location && ` • ${persona.location}`}
                </p>
              </div>
            </div>
          </div>

          {/* Persona Summary Card */}
          <Card className="mb-6 floating bg-slate-800/60 border-cyan-400/30 backdrop-blur-sm underwater-glow">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-cyan-100 mb-2">Background</h3>
                  <p className="text-sm text-cyan-200">{persona.introduction}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-cyan-100 mb-2">Personality Traits</h3>
                  <div className="flex flex-wrap gap-1">
                    {persona.personalityTraits?.map((trait, index) => (
                      <span key={index} className="px-2 py-1 bg-cyan-600/50 text-cyan-100 text-xs rounded border border-cyan-400/30">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-cyan-100 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-1">
                    {persona.interests?.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-600/50 text-emerald-100 text-xs rounded border border-emerald-400/30">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Behavioral Scores */}
              {persona.metadata?.personality && (
                <div className="mt-6 pt-6 border-t border-cyan-400/30">
                  <h3 className="font-semibold text-cyan-100 mb-4">Behavioral Profile</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { key: 'techSavvy', label: 'Tech Savvy' },
                      { key: 'socialness', label: 'Social' },
                      { key: 'creativity', label: 'Creative' },
                      { key: 'organization', label: 'Organized' },
                      { key: 'riskTaking', label: 'Risk Taking' },
                      { key: 'adaptability', label: 'Adaptable' }
                    ].map(({ key, label }) => {
                      const score = persona.metadata?.personality?.[key as keyof typeof persona.metadata.personality] as number || 5
                      return (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold text-cyan-300">{score}/10</div>
                          <div className="text-xs text-cyan-200">{label}</div>
                          <div className="w-full bg-slate-700/50 rounded-full h-2 mt-1">
                            <div 
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full underwater-glow" 
                              style={{ width: `${score * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-cyan-400/30">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-cyan-400 text-cyan-300 underwater-glow'
                        : 'border-transparent text-cyan-200 hover:text-cyan-100 hover:border-cyan-500/50'
                    }`}
                  >
                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-cyan-400' : 'text-cyan-300 group-hover:text-cyan-200'
                    }`} />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-cyan-400/70">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 underwater-glow border border-cyan-200/30">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
