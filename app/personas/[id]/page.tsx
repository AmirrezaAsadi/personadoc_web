'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share2, Users, Map, User, ArrowLeft, Database, Camera, Clock, ChevronLeft, ChevronUp, ChevronDown, Edit, Copy, Eye, X, Save, Sparkles, Heart } from 'lucide-react'
import Link from 'next/link'
import InterviewTab from '@/components/persona-tabs/InterviewTab'
import SocialPostsTab from '@/components/persona-tabs/SocialPostsTab'
import SocialCircleTab from '@/components/persona-tabs/SocialCircleTab'
import NarrativeTab from '@/components/persona-tabs/NarrativeTab'
import { KnowledgeManagementTab } from '@/components/persona-tabs/KnowledgeManagementTab-Enhanced'
import MediaTab from '@/components/persona-tabs/MediaTab'
import BrandsAttributesTab from '@/components/persona-tabs/BrandsAttributesTab'
import { GlobalTimeline } from '@/components/GlobalTimeline'
import { PersonaSharing } from '@/components/PersonaSharing'
import PersonaWizard from '@/components/persona-wizard'
import { InclusivitySuggestions } from '@/components/InclusivitySuggestions'
import { PoliticalCompass } from '@/components/PoliticalCompass'

// Edit Wizard Modal Component
interface EditWizardModalProps {
  persona: any
  onComplete: (editedPersonaData: any, saveOption: 'new' | 'current') => void
  onCancel: () => void
}

function EditWizardModal({ persona, onComplete, onCancel }: EditWizardModalProps) {
  const [step, setStep] = useState<'wizard' | 'save-option'>('wizard')
  const [editedPersonaData, setEditedPersonaData] = useState<any>(null)

  const handleWizardComplete = (personaData: any) => {
    setEditedPersonaData(personaData)
    setStep('save-option')
  }

  const handleSaveOptionSelect = (saveOption: 'new' | 'current') => {
    onComplete(editedPersonaData, saveOption)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {step === 'wizard' ? (
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Edit Persona</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <PersonaWizard 
            initialData={persona}
            onComplete={handleWizardComplete}
            onCancel={onCancel}
            isEditing={true}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Save Changes</h3>
          <p className="text-gray-600 mb-6">
            How would you like to save your changes?
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => handleSaveOptionSelect('current')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Update Current Version
            </Button>
            
            <Button
              onClick={() => handleSaveOptionSelect('new')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Save as New Version
            </Button>
            
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p><strong>Update Current:</strong> Overwrites the existing persona</p>
            <p><strong>New Version:</strong> Creates a new version, keeping the original</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface Version {
  id: string
  version: string
  name: string
  isActive: boolean
  isDraft: boolean
  createdAt: string
  notes?: string
  metadata?: any
}

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  inclusivityAttributes?: Record<string, string[]>
  appliedSuggestions?: Array<{
    label: string
    icon_type: string
    description: string
    appliedAt: string
    version: string
  }>
  isPublic?: boolean
  shareToken?: string
  shareCount?: number
  allowComments?: boolean
  isOwner?: boolean
  accessType?: 'owner' | 'public' | 'shared'
  creator?: {
    name: string
    email: string
  }
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
    politicalCompass?: {
      economic: number
      social: number
    }
  }
}

const TABS = [
  { id: 'interview', label: 'Interview', icon: MessageCircle, description: 'Enhanced chat with conversation starters' },
  { id: 'social', label: 'Social Posts', icon: Share2, description: 'Generate social media content' },
  { id: 'circle', label: 'Social Circle', icon: Users, description: 'Visualize persona connections' },
  { id: 'narrative', label: 'Journey Map', icon: Map, description: 'Create scenario narratives' },
  { id: 'brands', label: 'Brands & Attributes', icon: Heart, description: 'Brand preferences and custom attributes' },
  { id: 'media', label: 'Media Gallery', icon: Camera, description: 'Images, videos and social media content' },
  { id: 'knowledge', label: 'Knowledge Management', icon: Database, description: 'Research data, versioning, timeline & export' }
]

export default function PersonaDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [persona, setPersona] = useState<Persona | null>(null)
  const [activeTab, setActiveTab] = useState('interview')
  const [loading, setLoading] = useState(true)
  const [isPersonaSummaryMinimized, setIsPersonaSummaryMinimized] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditWizardOpen, setIsEditWizardOpen] = useState(false)
  
  // Global timeline state
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)
  const [showTimeline, setShowTimeline] = useState(true)

  const handleSharingChange = (updatedSharing: any) => {
    if (persona) {
      setPersona({
        ...persona,
        isPublic: updatedSharing.isPublic,
        shareToken: updatedSharing.shareToken,
        shareCount: updatedSharing.shareCount,
        allowComments: updatedSharing.allowComments
      })
    }
  }

  const handleClonePersona = async () => {
    if (!persona || isCloning) return
    
    try {
      setIsCloning(true)
      const response = await fetch(`/api/personas/${params.id}/fork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const clonedPersona = await response.json()
        // Redirect to the new cloned persona
        window.location.href = `/personas/${clonedPersona.id}`
      } else {
        const error = await response.json()
        alert('Failed to clone persona: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to clone persona:', error)
      alert('Failed to clone persona. Please try again.')
    } finally {
      setIsCloning(false)
    }
  }

  useEffect(() => {
    if (params.id && session) {
      loadPersona()
    }
  }, [params.id, session])

  useEffect(() => {
    // Only fetch versions for owners
    if (params.id && session && persona?.isOwner) {
      fetchVersions()
    }
  }, [params.id, session, persona?.isOwner])

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

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/personas/${params.id}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
        const active = data.versions?.find((v: Version) => v.isActive)
        setCurrentVersion(active || null)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const switchToVersion = async (versionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${params.id}/versions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          action: 'publish'
        })
      })
      
      if (response.ok) {
        await fetchVersions()
        await loadPersona() // Reload persona data
      } else {
        const error = await response.json()
        console.error('Failed to switch version:', error)
        alert('Failed to switch version: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to switch version:', error)
      alert('Failed to switch version. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePersonaEdit = async (editedPersona: any, versionNotes?: string) => {
    try {
      const response = await fetch(`/api/personas/${params.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          personaData: editedPersona,
          versionNotes
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setPersona(data.persona)
        await fetchVersions() // Refresh versions
        alert(data.message || 'Persona updated successfully!')
      } else {
        const error = await response.json()
        alert('Failed to save changes: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save persona edit:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  const handleWizardEditComplete = async (editedPersonaData: any, saveOption: 'new' | 'current') => {
    try {
      if (saveOption === 'new') {
        // Create new version
        const response = await fetch(`/api/personas/${params.id}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            personaData: editedPersonaData,
            versionNotes: 'Edited through wizard'
          })
        })

        if (response.ok) {
          const data = await response.json()
          setPersona(data.persona)
          await fetchVersions()
          setIsEditWizardOpen(false)
          alert(data.message || 'New version created successfully!')
        } else {
          const error = await response.json()
          alert('Failed to create new version: ' + (error.error || 'Unknown error'))
        }
      } else {
        // Update current version
        const response = await fetch(`/api/personas/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedPersonaData)
        })

        if (response.ok) {
          await loadPersona()
          setIsEditWizardOpen(false)
          alert('Persona updated successfully!')
        } else {
          const error = await response.json()
          alert('Failed to update persona: ' + (error.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Failed to save persona edit:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  const handleWizardEditCancel = () => {
    setIsEditWizardOpen(false)
  }

  const handleApplyInclusivitySuggestion = async (suggestion: any) => {
    try {
      console.log('Applying suggestion:', suggestion) // Debug log
      
      // Call new endpoint to create a version with the perspective
      const response = await fetch(`/api/personas/${params.id}/enhance-new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion })
      })
      
      console.log('Response status:', response.status) // Debug log
      
      if (response.ok) {
        const data = await response.json()
        console.log('Enhancement response:', data) // Debug log
        
        // Update the current persona data to reflect the new version
        setPersona(prev => ({
          ...prev,
          ...data.enhancedPersona
        }))
        
        // Refresh versions to show the new version in timeline
        await fetchVersions()
        
        // Show success message
        alert(`✨ New Version Created!\n\n${data.message}\n\nA new version "${data.newVersion.version}" has been created with the "${suggestion.label}" perspective. You can see it in the timeline and the new attributes in the Niche Attributes section.`)
        
        // Reload persona to get fresh data
        await loadPersona()
      } else {
        const error = await response.json()
        console.error('Enhancement error:', error) // Debug log
        alert('Failed to create new version: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to apply inclusivity suggestion:', error)
      alert('Failed to create new version. Please check the console for details.')
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
      case 'brands':
        return <BrandsAttributesTab persona={persona} isEditable={persona?.isOwner || false} />
      case 'media':
        return <MediaTab personaId={personaId} personaName={persona?.name || 'Unknown'} isOwner={persona?.isOwner || false} />
      case 'knowledge':
        return <KnowledgeManagementTab personaId={personaId} personaName={persona?.name || 'Unknown'} globalTimelineVisible={showTimeline} isOwner={persona?.isOwner || false} />
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
                className="bg-white/20 backdrop-blur-[8px] border border-white/25 text-slate-800 hover:bg-white/30 hover:text-slate-900 underwater-glow"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center justify-between gap-4">
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
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {persona.isOwner ? (
                  // Show edit button only for owners
                  <Button
                    onClick={() => setIsEditWizardOpen(true)}
                    className="bg-blue-600/80 hover:bg-blue-700/80 text-white backdrop-blur-sm underwater-glow"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  // Show clone button for non-owners
                  <Button
                    onClick={handleClonePersona}
                    disabled={isCloning}
                    className="bg-purple-600/80 hover:bg-purple-700/80 text-white backdrop-blur-sm underwater-glow"
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {isCloning ? 'Cloning...' : 'Clone'}
                  </Button>
                )}
                
                {/* Show sharing only for owners */}
                {persona.isOwner && (
                  <PersonaSharing 
                    personaId={persona.id}
                    personaName={persona.name}
                    isPublic={persona.isPublic || false}
                    shareToken={persona.shareToken}
                    shareCount={persona.shareCount || 0}
                    allowComments={persona.allowComments || false}
                    onSharingChange={handleSharingChange}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Persona Summary Card */}
          <Card className="mb-6 floating bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">Persona Overview</CardTitle>
                <Button
                  onClick={() => setIsPersonaSummaryMinimized(!isPersonaSummaryMinimized)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 hover:bg-slate-100/50 border-slate-200/50 transition-colors duration-200 minimize-button"
                >
                  {isPersonaSummaryMinimized ? (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className={`persona-summary-content ${
              isPersonaSummaryMinimized ? 'persona-summary-minimized' : 'persona-summary-expanded'
            } pt-0 pb-6`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Background</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{persona.introduction}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Personality Traits</h3>
                    <div className="flex flex-wrap gap-1">
                      {persona.personalityTraits?.map((trait, index) => (
                        <span key={index} className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded border border-cyan-200">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-1">
                      {persona.interests?.map((interest, index) => (
                        <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded border border-emerald-200">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Behavioral Scores */}
                {persona.metadata?.personality && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Behavioral Profile</h3>
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
                            <div className="text-2xl font-bold text-slate-800">{score}/10</div>
                            <div className="text-xs text-slate-600">{label}</div>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full shadow-sm" 
                                style={{ width: `${score * 10}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Political Compass */}
                {persona.metadata?.politicalCompass && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Political Orientation</h3>
                    <div className="max-w-md mx-auto">
                      <PoliticalCompass
                        initialValues={persona.metadata.politicalCompass}
                        readOnly={true}
                      />
                    </div>
                  </div>
                )}

                {/* Inclusivity Attributes */}
                {persona.inclusivityAttributes && Object.keys(persona.inclusivityAttributes).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Niche Attributes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(persona.inclusivityAttributes).map(([category, attributes]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-medium text-slate-700 capitalize">{category}</h4>
                          <div className="flex flex-wrap gap-1">
                            {(attributes as string[]).map((attribute, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded border border-purple-200"
                              >
                                {attribute}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
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

      {/* Global Timeline - only show for owners */}
      {persona?.isOwner && showTimeline ? (
        <GlobalTimeline
          versions={versions}
          currentVersion={currentVersion}
          showTimeline={showTimeline}
          onToggleTimeline={() => setShowTimeline(!showTimeline)}
          onSwitchVersion={switchToVersion}
          onCreateVersion={() => {
            // TODO: Implement create version functionality
            console.log('Create new version')
          }}
        />
      ) : persona?.isOwner && !showTimeline ? (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setShowTimeline(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Timeline
          </Button>
        </div>
      ) : null}

      {/* Edit Wizard - Only show for owners */}
      {persona?.isOwner && isEditWizardOpen && (
        <EditWizardModal 
          persona={persona}
          onComplete={handleWizardEditComplete}
          onCancel={handleWizardEditCancel}
        />
      )}

      {/* Inclusivity Suggestions */}
      <InclusivitySuggestions
        persona={persona}
        onApplySuggestion={handleApplyInclusivitySuggestion}
      />
    </div>
  )
}
