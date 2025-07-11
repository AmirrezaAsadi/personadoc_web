'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Globe, Users, Search, MessageCircle, 
  Calendar, User, Star, Eye, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface PublicPersona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  shareCount: number
  sharedAt: string
  allowComments: boolean
  creator: {
    name?: string
  }
}

export default function PublicPersonasPage() {
  const [personas, setPersonas] = useState<PublicPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest')

  useEffect(() => {
    loadPublicPersonas()
  }, [])

  const loadPublicPersonas = async () => {
    try {
      const response = await fetch('/api/personas/public')
      if (response.ok) {
        const data = await response.json()
        setPersonas(data.personas || [])
      }
    } catch (error) {
      console.error('Failed to load public personas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedPersonas = personas
    .filter(persona => 
      searchTerm === '' || 
      persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.personalityTraits?.some(trait => 
        trait.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.shareCount - a.shareCount
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
        default:
          return new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Public Personas</h1>
          </div>
          <p className="text-gray-600">
            Explore personas shared by the community. Discover different personalities, backgrounds, and stories.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search personas by name, occupation, or traits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{personas.length}</div>
              <div className="text-sm text-gray-600">Public Personas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {personas.reduce((sum, p) => sum + p.shareCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {new Set(personas.map(p => p.creator.name)).size}
              </div>
              <div className="text-sm text-gray-600">Contributors</div>
            </CardContent>
          </Card>
        </div>

        {/* Personas Grid */}
        {filteredAndSortedPersonas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No personas found' : 'No public personas yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters.'
                  : 'Be the first to share a persona with the community!'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPersonas.map(persona => (
              <Card key={persona.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{persona.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {persona.age && `${persona.age} years old`}
                        {persona.occupation && ` • ${persona.occupation}`}
                        {persona.location && ` • ${persona.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      {persona.shareCount}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {persona.introduction && (
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {persona.introduction}
                      </p>
                    )}
                    
                    {persona.personalityTraits && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-900 mb-2">Personality Traits</h4>
                        <div className="flex flex-wrap gap-1">
                          {persona.personalityTraits.slice(0, 3).map((trait, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                          {persona.personalityTraits.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{persona.personalityTraits.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>by {persona.creator.name || 'Anonymous'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {persona.allowComments && (
                          <MessageCircle className="w-4 h-4 text-blue-500" title="Comments enabled" />
                        )}
                        <Link href={`/personas/${persona.id}`}>
                          <Button size="sm" variant="outline">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Shared {new Date(persona.sharedAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
