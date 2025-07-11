'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, User, LogOut, X, MessageCircle, Users, Eye, Calendar, MapPin, Brain, Heart, Star } from 'lucide-react'
import SignInPage from '@/components/sign-in-page'
import PersonaWizard from '@/components/persona-wizard'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  avatarUrl?: string
  createdAt?: string
  metadata?: {
    avatar?: {
      name: string
      type: string
      size: number
      dataUrl: string
    }
    demographics?: any
    personality?: any
    technology?: any
    research?: any
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    if (session) {
      loadPersonas()
    }
  }, [session])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPersonas(personas)
    } else {
      const filtered = personas.filter(persona => 
        persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        persona.personalityTraits?.some(trait => 
          trait.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        persona.interests?.some(interest => 
          interest.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredPersonas(filtered)
    }
  }, [searchQuery, personas])

  // Show loading screen while checking auth
  if (status === 'loading') {
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto underwater-glow"></div>
            <p className="mt-4 text-cyan-200">Loading PersonaDock...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show sign-in page if not authenticated
  if (!session) {
    return <SignInPage />
  }

  const loadPersonas = async () => {
    try {
      const response = await fetch('/api/personas')
      if (!response.ok) {
        console.error('Failed to fetch personas:', response.status)
        setPersonas([])
        return
      }
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPersonas(data)
      } else {
        console.error('API returned non-array:', data)
        setPersonas([])
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
      setPersonas([])
    }
  }

  const createPersona = async () => {
    setShowWizard(true)
  }

  const handleWizardComplete = async (personaData: any) => {
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData),
      })

      if (!response.ok) {
        throw new Error('Failed to create persona')
      }

      const newPersona = await response.json()
      setPersonas(prev => [newPersona, ...prev])
      setShowWizard(false)
      // Navigate to the new persona
      router.push(`/personas/${newPersona.id}`)
    } catch (error) {
      console.error('Failed to create persona:', error)
    }
  }

  const handleWizardCancel = () => {
    setShowWizard(false)
  }

  const handlePersonaClick = (personaId: string) => {
    router.push(`/personas/${personaId}`)
  }

  const getPersonaTraits = (persona: Persona) => {
    const traits = []
    if (persona.personalityTraits?.length) {
      traits.push(...persona.personalityTraits.slice(0, 3))
    }
    if (persona.interests?.length) {
      traits.push(...persona.interests.slice(0, 2))
    }
    return traits.slice(0, 4)
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

      {/* Header */}
      <div className="border-b border-blue-800/30 bg-black/20 backdrop-blur-sm breathing underwater-glow relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg ripple">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  PersonaDock
                </h1>
                <p className="text-blue-200/80 flex items-center gap-2">
                  Welcome back, {session?.user?.name}! 
                  <span className="flex items-center gap-1 text-sm bg-blue-900/30 px-3 py-1 rounded-full border border-cyan-500/30 underwater-glow">
                    <Users className="w-3 h-3" />
                    {personas.length} persona{personas.length !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={createPersona} 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg ripple underwater-glow flex items-center gap-2 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Create New Persona
              </Button>
              <Button 
                onClick={() => signOut()} 
                variant="outline" 
                className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/30 ripple underwater-glow flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto search-float">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-300 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personas by name, occupation, traits, or interests..."
              className="pl-12 py-4 text-lg bg-black/30 border-cyan-500/30 text-cyan-100 placeholder-cyan-300/70 focus:border-cyan-400 focus:ring-cyan-400/30 rounded-xl underwater-glow backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Personas Grid */}
        {filteredPersonas.length === 0 && personas.length === 0 ? (
          <div className="text-center py-16 floating">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl underwater-glow ripple">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-cyan-100 mb-4">No Personas Yet</h2>
            <p className="text-cyan-300/80 mb-8 max-w-md mx-auto">
              Create your first persona to start building rich, interactive character profiles for research and development.
            </p>
            <Button 
              onClick={createPersona}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg underwater-glow ripple"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Persona
            </Button>
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="text-center py-16 floating">
            <Search className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-cyan-100 mb-2">No Results Found</h2>
            <p className="text-cyan-300/80">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPersonas.map((persona, index) => (
              <Card
                key={persona.id}
                className="group bg-black/30 border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl backdrop-blur-sm floating underwater-glow ripple"
                onClick={() => handlePersonaClick(persona.id)}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg underwater-glow">
                        {persona.avatarUrl || persona.metadata?.avatar?.dataUrl ? (
                          <img 
                            src={persona.avatarUrl || persona.metadata?.avatar?.dataUrl} 
                            alt={persona.name} 
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-gray-900 flex items-center justify-center underwater-glow">
                        <Eye className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-cyan-400 text-lg font-bold truncate">
                        {persona.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-cyan-800/80">
                        {persona.age && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {persona.age}
                          </span>
                        )}
                        {persona.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {persona.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {persona.occupation && (
                    <div className="text-sm text-cyan-400/90 mb-3 font-medium">
                      {persona.occupation}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  {persona.introduction && (
                    <p className="text-cyan-400/80 text-sm mb-4 line-clamp-2">
                      {persona.introduction}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {getPersonaTraits(persona).map((trait, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-cyan-900/30 text-cyan-200 border-cyan-500/30 text-xs px-2 py-1 underwater-glow"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
                    <div className="flex items-center gap-3 text-xs text-cyan-300/80">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        Interview
                      </span>
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Analytics
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        Social
                      </span>
                    </div>
                    <Star className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Persona Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/90 border border-cyan-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl underwater-glow backdrop-blur-md">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
              <h2 className="text-xl font-semibold text-cyan-100">Create New Persona</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWizardCancel}
                className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/30 ripple"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
              <PersonaWizard
                onComplete={handleWizardComplete}
                onCancel={handleWizardCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
