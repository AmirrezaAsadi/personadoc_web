'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, User, LogOut, X, MessageCircle, Users, Eye, Calendar, MapPin, Brain, Heart, Star, Filter, Globe, Lock, Share, HelpCircle, Shield } from 'lucide-react'
import LandingPage from '@/components/landing-page'
import PersonaWizard from '@/components/persona-wizard'
import { PersonaTypesGuide } from '@/components/PersonaTypesGuide'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  profileImage?: string
  createdAt?: string
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
    demographics?: any
    personality?: any
    technology?: any
    research?: any
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isAdmin } = useIsAdmin()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'user' | 'public' | 'shared'>('all')
  const [showWizard, setShowWizard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (session) {
      // Debounce search to avoid too many API calls
      const timeoutId = setTimeout(() => {
        loadPersonas()
      }, 300) // 300ms delay

      return () => clearTimeout(timeoutId)
    }
  }, [session, filterType, searchQuery])

  // Remove the old useEffect for client-side filtering since we're doing it server-side now

  // Show loading screen while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen relative">
        <div className="sea-waves">
          <div className="liquid-blob blob-1"></div>
          <div className="liquid-blob blob-2"></div>
          <div className="liquid-blob blob-3"></div>
          <div className="liquid-blob blob-4"></div>
          <div className="liquid-blob blob-5"></div>
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center floating">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400 mx-auto underwater-glow"></div>
            <p className="mt-4 text-white/80">Loading PersonaDock...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated
  if (!session) {
    return <LandingPage />
  }

  const loadPersonas = async () => {
    setIsLoading(true)
    try {
      const searchParams = new URLSearchParams({
        type: filterType,
        limit: '50'
      })
      
      if (searchQuery.trim()) {
        searchParams.append('q', searchQuery.trim())
      }
      
      const url = `/api/personas/search?${searchParams.toString()}`
      const response = await fetch(url)
      if (!response.ok) {
        console.error('Failed to fetch personas:', response.status)
        setPersonas([])
        return
      }
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPersonas(data)
        setFilteredPersonas(data) // Set filtered personas directly from API
      } else {
        console.error('API returned non-array:', data)
        setPersonas([])
        setFilteredPersonas([])
      }
    } catch (error) {
      console.error('Failed to load personas:', error)
      setPersonas([])
      setFilteredPersonas([])
    } finally {
      setIsLoading(false)
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
      {/* Animated Liquid Background */}
      <div className="sea-waves">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
        <div className="liquid-blob blob-4"></div>
        <div className="liquid-blob blob-5"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      {/* Header */}
      <div className="border-b border-white/20 glass-morphism breathing underwater-glow relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg ripple">
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
                <h1 className="text-3xl font-bold gradient-text">
                  PersonaDock
                </h1>
                <p className="text-white/80 flex items-center gap-2">
                  Welcome back, {session?.user?.name}! 
                  <span className="flex items-center gap-1 text-sm glass-card px-3 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    {personas.length} persona{personas.length !== 1 ? 's' : ''} 
                    {filterType !== 'all' && (
                      <span className="text-white/70">
                        ({filterType === 'user' ? 'yours' : filterType})
                      </span>
                    )}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {/* Hidden Admin Access - only visible for admin users */}
              {isAdmin && (
                <Button 
                  onClick={() => router.push('/admin')} 
                  variant="outline" 
                  className="border-orange-400/50 text-orange-300 hover:bg-orange-500/10 ripple underwater-glow flex items-center gap-2 transition-all duration-300"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}
              
              <Button 
                onClick={createPersona} 
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-lg ripple underwater-glow flex items-center gap-2 transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Create New Persona
              </Button>
              <Button 
                onClick={() => signOut()} 
                variant="outline" 
                className="border-white/30 text-red-400 hover:bg-white/10 ripple underwater-glow flex items-center gap-2"
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
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto search-float mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personas by name, occupation, traits, or interests..."
              className="pl-12 py-4 text-lg bg-white/15 backdrop-blur-[10px] border border-white/30 text-white placeholder-white/60 focus:border-teal-400 focus:ring-teal-400/30 rounded-xl underwater-glow"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-[8px] border border-white/25 rounded-xl p-1 underwater-glow">
              <div className="flex gap-1">
                <Button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    filterType === 'all'
                      ? 'bg-white/20 backdrop-blur-[10px] text-white shadow-lg border border-teal-400/50 underwater-glow'
                      : 'bg-white/10 backdrop-blur-[8px] border border-white/25 text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  All Personas
                </Button>
                <Button
                  onClick={() => setFilterType('user')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    filterType === 'user'
                      ? 'bg-white/20 backdrop-blur-[10px] text-white shadow-lg border border-teal-400/50 underwater-glow'
                      : 'bg-white/10 backdrop-blur-[8px] border border-white/25 text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Personas
                </Button>
                <Button
                  onClick={() => setFilterType('public')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    filterType === 'public'
                      ? 'bg-white/20 backdrop-blur-[10px] text-white shadow-lg border border-teal-400/50 underwater-glow'
                      : 'bg-white/10 backdrop-blur-[8px] border border-white/25 text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Public
                </Button>
                <Button
                  onClick={() => setFilterType('shared')}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    filterType === 'shared'
                      ? 'bg-white/20 backdrop-blur-[10px] text-white shadow-lg border border-teal-400/50 underwater-glow'
                      : 'bg-white/10 backdrop-blur-[8px] border border-white/25 text-white/80 hover:text-white hover:bg-white/15'
                  }`}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Shared with Me
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Description */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-white/70 text-sm">
                {filterType === 'all' && 'Showing all personas you have access to'}
                {filterType === 'user' && 'Showing personas you created'}
                {filterType === 'public' && 'Showing publicly shared personas from the community'}
                {filterType === 'shared' && 'Showing personas that have been privately shared with you'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="h-6 px-2 text-xs bg-white/20 backdrop-blur-[8px] border border-white/25 text-slate-800 hover:bg-white/30 hover:text-slate-900"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </div>

        {/* Personas Grid */}
        {isLoading ? (
          <div className="text-center py-16 floating">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400 mx-auto underwater-glow"></div>
            <p className="mt-4 text-white/80">Loading personas...</p>
          </div>
        ) : filteredPersonas.length === 0 && personas.length === 0 ? (
          <div className="text-center py-16 floating">
            <div className="w-24 h-24 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl underwater-glow ripple">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white/90 mb-4">No Personas Yet</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Create your first persona to start building rich, interactive character profiles for research and development.
            </p>
            <Button 
              onClick={createPersona}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-lg underwater-glow ripple"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Persona
            </Button>
          </div>
        ) : filteredPersonas.length === 0 ? (
          <div className="text-center py-16 floating">
            <Search className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white/90 mb-2">No Results Found</h2>
            <p className="text-white/70">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPersonas.map((persona, index) => (
              <Card
                key={persona.id}
                className="group relative cursor-pointer transition-all duration-700 hover:scale-[1.02] hover:z-10 floating overflow-hidden glass-morphism"
                onClick={() => handlePersonaClick(persona.id)}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Glassmorphic background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-transparent group-hover:from-white/[0.15] group-hover:via-white/[0.1] transition-all duration-700"></div>
                
                {/* Subtle border glow effect */}
                <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-cyan-400/20 via-transparent to-blue-400/20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm"></div>
                
                {/* Inner highlight */}
                <div className="absolute inset-[1px] rounded-[19px] bg-gradient-to-br from-white/[0.1] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <CardHeader className="relative pb-3 z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative group/avatar">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-teal-500/30"
                             style={{
                               background: 'linear-gradient(135deg, rgba(74, 155, 142, 0.6) 0%, rgba(44, 122, 123, 0.6) 100%)',
                               backdropFilter: 'blur(10px)',
                               border: '1px solid rgba(255, 255, 255, 0.2)',
                               boxShadow: '0 8px 25px rgba(74, 155, 142, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                             }}>
                          {persona.profileImage || persona.metadata?.avatar?.dataUrl ? (
                            <img 
                              src={persona.profileImage || persona.metadata?.avatar?.dataUrl} 
                              alt={persona.name} 
                              className="w-14 h-14 rounded-full object-cover border border-white/20 transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <User className="w-8 h-8 text-white/90 transition-transform duration-500 group-hover:scale-110" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                             style={{
                               background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)',
                               backdropFilter: 'blur(10px)',
                               boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                             }}>
                          <Eye className="w-3 h-3 text-white transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white/90 text-lg font-bold truncate group-hover:text-white transition-colors">
                          {persona.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white/70 transition-colors">
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
                    
                    {/* Access Type Indicator */}
                    <div className="flex items-center gap-1">
                      {persona.accessType === 'owner' && (
                        <Badge className="text-xs px-2 py-1 border-0 text-white/90 font-medium bg-teal-500/30 backdrop-blur-sm shadow-lg shadow-teal-500/20">
                          <User className="w-3 h-3 mr-1" />
                          Mine
                        </Badge>
                      )}
                      {persona.accessType === 'public' && (
                        <Badge className="text-xs px-2 py-1 border-0 text-white/90 font-medium bg-emerald-500/30 backdrop-blur-sm shadow-lg shadow-emerald-500/20">
                          <Globe className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                      {persona.accessType === 'shared' && (
                        <Badge className="text-xs px-2 py-1 border-0 text-white/90 font-medium bg-violet-500/30 backdrop-blur-sm shadow-lg shadow-violet-500/20">
                          <Share className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {persona.occupation && (
                    <div className="text-sm text-white/70 group-hover:text-white/80 mb-3 font-medium transition-colors">
                      {persona.occupation}
                    </div>
                  )}

                  {/* Creator info for non-owned personas */}
                  {!persona.isOwner && persona.creator && (
                    <div className="text-xs text-white/50 group-hover:text-white/60 mb-2 transition-colors">
                      Created by {persona.creator.name}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="relative pt-0 z-10">
                  {persona.introduction && (
                    <p className="text-white/70 group-hover:text-white/80 text-sm mb-4 line-clamp-2 transition-colors">
                      {persona.introduction}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {getPersonaTraits(persona).map((trait, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-white/10 text-white/80 border-white/20 text-xs px-2 py-1 backdrop-blur-sm hover:bg-white/15 transition-colors"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 text-xs text-white/60 group-hover:text-white/70 transition-colors">
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
                    <Star className="w-4 h-4 text-yellow-300/80 group-hover:text-yellow-300 group-hover:scale-110 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Persona Types Guide */}
      {showGuide && (
        <PersonaTypesGuide onClose={() => setShowGuide(false)} />
      )}

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
