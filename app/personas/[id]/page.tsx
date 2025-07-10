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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading persona...</p>
        </div>
      </div>
    )
  }

  if (!persona) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Persona Not Found</h1>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'interview':
        return <InterviewTab persona={persona} />
      case 'social':
        return <SocialPostsTab persona={persona} />
      case 'circle':
        return <SocialCircleTab persona={persona} />
      case 'narrative':
        return <NarrativeTab persona={persona} />
      default:
        return <InterviewTab persona={persona} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{persona.name}</h1>
                <p className="text-gray-600">
                  {persona.age && `${persona.age} years old`} 
                  {persona.occupation && ` • ${persona.occupation}`}
                  {persona.location && ` • ${persona.location}`}
                </p>
              </div>
            </div>
          </div>

          {/* Persona Summary Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Background</h3>
                  <p className="text-sm text-gray-600">{persona.introduction}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personality Traits</h3>
                  <div className="flex flex-wrap gap-1">
                    {persona.personalityTraits?.map((trait, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-1">
                    {persona.interests?.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Behavioral Scores */}
              {persona.metadata?.personality && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Behavioral Profile</h3>
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
                          <div className="text-2xl font-bold text-blue-600">{score}/10</div>
                          <div className="text-xs text-gray-600">{label}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
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
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
