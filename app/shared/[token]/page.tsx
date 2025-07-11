'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Calendar, MapPin, Share, Eye, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SharedPersona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  profileImage?: string
  createdAt: string
  shareCount: number
  allowComments: boolean
  metadata?: any
  creator: {
    name: string
    email: string
  }
}

export default function SharedPersonaPage() {
  const params = useParams()
  const shareToken = params.token as string
  const [persona, setPersona] = useState<SharedPersona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shareToken) {
      loadSharedPersona()
    }
  }, [shareToken])

  const loadSharedPersona = async () => {
    try {
      const response = await fetch(`/api/personas/shared/${shareToken}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Persona not found or link has expired')
        } else {
          setError('Failed to load persona')
        }
        return
      }
      const data = await response.json()
      setPersona(data)
    } catch (error) {
      console.error('Failed to load shared persona:', error)
      setError('Failed to load persona')
    } finally {
      setIsLoading(false)
    }
  }

  const getPersonaTraits = (persona: SharedPersona) => {
    const traits = []
    if (persona.personalityTraits?.length) {
      traits.push(...persona.personalityTraits.slice(0, 5))
    }
    if (persona.interests?.length) {
      traits.push(...persona.interests.slice(0, 3))
    }
    return traits.slice(0, 8)
  }

  if (isLoading) {
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
            <p className="mt-4 text-cyan-200">Loading shared persona...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !persona) {
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
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl underwater-glow">
              <Share className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-cyan-100 mb-4">Persona Not Found</h2>
            <p className="text-cyan-300/80 mb-8 max-w-md mx-auto">
              {error || 'This shared persona link is invalid or has expired.'}
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg underwater-glow">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
              <Link href="/">
                <Button variant="outline" className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/30">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Shared Persona
                </h1>
                <p className="text-blue-200/80 flex items-center gap-2">
                  <Share className="w-4 h-4" />
                  Shared by {persona.creator.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-cyan-300/80">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Viewed {persona.shareCount} times
                </div>
              </div>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Create Your Own
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Persona Details */}
      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
        <Card className="bg-black/30 border-cyan-500/30 backdrop-blur-sm underwater-glow">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg underwater-glow">
                  {persona.profileImage || persona.metadata?.avatar?.dataUrl ? (
                    <img 
                      src={persona.profileImage || persona.metadata?.avatar?.dataUrl} 
                      alt={persona.name} 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-cyan-400 mb-2">
                  {persona.name}
                </CardTitle>
                <div className="flex items-center gap-4 text-cyan-300/80 mb-3">
                  {persona.age && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {persona.age} years old
                    </span>
                  )}
                  {persona.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {persona.location}
                    </span>
                  )}
                </div>
                {persona.occupation && (
                  <div className="text-lg text-cyan-400/90 font-medium">
                    {persona.occupation}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {persona.introduction && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Introduction</h3>
                <p className="text-cyan-400/80 leading-relaxed">
                  {persona.introduction}
                </p>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-cyan-300 mb-3">Traits & Interests</h3>
              <div className="flex flex-wrap gap-2">
                {getPersonaTraits(persona).map((trait, index) => (
                  <Badge 
                    key={index} 
                    className="bg-cyan-900/30 text-cyan-200 border-cyan-500/30 px-3 py-1 underwater-glow"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-cyan-500/20">
              <div className="text-center">
                <p className="text-cyan-300/80 mb-4">
                  This persona was created and shared by {persona.creator.name} using PersonaDock.
                </p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg underwater-glow">
                    Create Your Own Personas
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
