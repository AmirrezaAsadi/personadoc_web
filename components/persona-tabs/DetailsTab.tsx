'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Smartphone,
  Brain,
  Star,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Home,
  Baby,
  DollarSign,
  Coffee,
  Car,
  ShoppingBag,
  TrendingUp,
  FileText,
  Database,
  MessageSquare,
  Globe
} from 'lucide-react'
import { PoliticalCompass } from '@/components/PoliticalCompass'

interface DetailsTabProps {
  persona: any
  isEditable?: boolean
}

const CATEGORY_ICONS: Record<string, any> = {
  'Technology': Smartphone,
  'Retail & E-commerce': ShoppingBag,
  'Food & Beverage': Coffee,
  'Automotive': Car,
  'Lifestyle & Home': Home,
  'Custom': Settings
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  'loves': 'bg-red-100 text-red-800 border-red-200',
  'uses': 'bg-green-100 text-green-800 border-green-200',
  'prefers': 'bg-blue-100 text-blue-800 border-blue-200',
  'avoids': 'bg-gray-100 text-gray-800 border-gray-200',
  'neutral': 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const RELATIONSHIP_ICONS: Record<string, string> = {
  'loves': '❤️',
  'uses': '✅',
  'prefers': '⭐',
  'avoids': '❌',
  'neutral': '😐'
}

export default function DetailsTab({ persona, isEditable = false }: DetailsTabProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  const renderSection = (
    id: string,
    title: string,
    icon: React.ComponentType<any>,
    content: React.ReactNode,
    isEmpty: boolean = false
  ) => {
    const Icon = icon
    const isCollapsed = collapsedSections.has(id)

    if (isEmpty) return null

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSection(id)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className="pt-0">
            {content}
          </CardContent>
        )}
      </Card>
    )
  }

  const renderBasicInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-500" />
          <div>
            <span className="text-sm text-gray-500">Name</span>
            <p className="font-medium">{persona.name}</p>
          </div>
        </div>
        
        {persona.age && (
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Age</span>
              <p className="font-medium">{persona.age} years old</p>
            </div>
          </div>
        )}

        {persona.location && (
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Location</span>
              <p className="font-medium">{persona.location}</p>
            </div>
          </div>
        )}

        {persona.occupation && (
          <div className="flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Occupation</span>
              <p className="font-medium">{persona.occupation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Gender - try multiple access patterns */}
        {(persona.metadata?.demographics?.gender || persona.gender) && (
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Gender</span>
              <p className="font-medium">{persona.metadata?.demographics?.gender || persona.gender}</p>
            </div>
          </div>
        )}

        {persona.metadata?.demographics?.education && (
          <div className="flex items-center gap-3">
            <GraduationCap className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Education</span>
              <p className="font-medium">{persona.metadata.demographics.education}</p>
            </div>
          </div>
        )}

        {persona.metadata?.demographics?.incomeLevel && (
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Income Level</span>
              <p className="font-medium">{persona.metadata.demographics.incomeLevel}</p>
            </div>
          </div>
        )}

        {persona.metadata?.demographics?.maritalStatus && (
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Marital Status</span>
              <p className="font-medium">{persona.metadata.demographics.maritalStatus}</p>
            </div>
          </div>
        )}

        {persona.metadata?.demographics?.children && (
          <div className="flex items-center gap-3">
            <Baby className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Children</span>
              <p className="font-medium">{persona.metadata.demographics.children}</p>
            </div>
          </div>
        )}
        
        {/* Show avatar info if available */}
        {persona.metadata?.avatar && (
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <span className="text-sm text-gray-500">Avatar</span>
              <div className="flex items-center gap-2 mt-1">
                <img 
                  src={persona.metadata.avatar.dataUrl} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm text-gray-600">{persona.metadata.avatar.name || 'Custom avatar'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPersonality = () => (
    <div className="space-y-6">
      {/* Personality Traits */}
      {persona.personalityTraits && persona.personalityTraits.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Personality Traits</h4>
          <div className="flex flex-wrap gap-2">
            {persona.personalityTraits.map((trait: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {persona.interests && persona.interests.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {persona.interests.map((interest: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Scores */}
      {persona.metadata?.personality && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Behavioral Profile</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">{score}/10</div>
                  <div className="text-xs text-gray-600">{label}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Values and Motivations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {persona.metadata?.personality?.values && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Values</h4>
            <p className="text-gray-700 text-sm">{persona.metadata.personality.values}</p>
          </div>
        )}
        
        {persona.metadata?.personality?.motivations && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Motivations</h4>
            <p className="text-gray-700 text-sm">{persona.metadata.personality.motivations}</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderTechnology = () => (
    <div className="space-y-6">
      {/* Devices */}
      {persona.metadata?.technology?.devicesOwned && persona.metadata.technology.devicesOwned.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Devices Owned</h4>
          <div className="flex flex-wrap gap-2">
            {persona.metadata.technology.devicesOwned.map((device: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {device}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Apps */}
      {persona.metadata?.technology?.appPreferences && persona.metadata.technology.appPreferences.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">App Preferences</h4>
          <div className="flex flex-wrap gap-2">
            {persona.metadata.technology.appPreferences.map((app: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                {app}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tech Proficiency */}
      {persona.metadata?.technology?.techProficiency && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Tech Proficiency</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${persona.metadata.technology.techProficiency * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{persona.metadata.technology.techProficiency}/10</span>
          </div>
        </div>
      )}

      {/* Digital Habits & Communication */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {persona.metadata?.technology?.digitalHabits && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Digital Habits</h4>
            <p className="text-gray-700 text-sm">{persona.metadata.technology.digitalHabits}</p>
          </div>
        )}
        
        {persona.metadata?.technology?.communicationPreferences && persona.metadata.technology.communicationPreferences.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Communication Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {persona.metadata.technology.communicationPreferences.map((pref: string, index: number) => (
                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {pref}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderBrands = () => {
    const brands = persona?.metadata?.brands?.preferredBrands || []
    const customAttributes = persona?.metadata?.brands?.customAttributes || {}

    if (!brands.length && !Object.keys(customAttributes).length) return null

    return (
      <div className="space-y-6">
        {/* Brand Preferences */}
        {brands.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Brand Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand: any, index: number) => {
                const IconComponent = CATEGORY_ICONS[brand.category] || Settings
                const relationshipClass = RELATIONSHIP_COLORS[brand.relationship] || RELATIONSHIP_COLORS.neutral
                const relationshipIcon = RELATIONSHIP_ICONS[brand.relationship] || RELATIONSHIP_ICONS.neutral

                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">{brand.name}</h5>
                        <p className="text-xs text-gray-500 mb-2">{brand.category}</p>
                        
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${relationshipClass}`}
                        >
                          {relationshipIcon} {brand.relationship}
                        </Badge>
                        
                        {brand.notes && (
                          <p className="text-xs text-gray-600 mt-2">{brand.notes}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Custom Attributes */}
        {Object.keys(customAttributes).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Custom Attributes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(customAttributes).map(([key, value]) => {
                const isNumeric = typeof value === 'number'
                
                return (
                  <Card key={key} className="p-4">
                    <h5 className="font-medium text-gray-900 capitalize mb-2">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h5>
                    
                    {isNumeric ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>1</span>
                          <span className="font-medium text-lg text-blue-600">{value}</span>
                          <span>10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(value as number / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {String(value)}
                      </Badge>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderResearch = () => (
    <div className="space-y-6">
      {/* Data Sources */}
      {persona.metadata?.research?.dataSourceTypes && persona.metadata.research.dataSourceTypes.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Data Source Types</h4>
          <div className="flex flex-wrap gap-2">
            {persona.metadata.research.dataSourceTypes.map((source: string, index: number) => (
              <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {source}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Research Files */}
      {persona.metadata?.research?.uploadedFiles && persona.metadata.research.uploadedFiles.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Uploaded Research Files</h4>
          <div className="space-y-2">
            {persona.metadata.research.uploadedFiles.map((file: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name || `Research File ${index + 1}`}</p>
                  {file.size && (
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing files from metadata */}
      {persona.metadata?.research?.existingFiles && persona.metadata.research.existingFiles.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Previous Research Files</h4>
          <div className="space-y-2">
            {persona.metadata.research.existingFiles.map((file: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name || `Previous File ${index + 1}`}</p>
                  {file.size && (
                    <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge and Methodology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {persona.metadata?.research?.manualKnowledge && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Manual Knowledge</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{persona.metadata.research.manualKnowledge}</p>
            </div>
          </div>
        )}
        
        {persona.metadata?.research?.researchMethodology && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Research Methodology</h4>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{persona.metadata.research.researchMethodology}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderInclusivity = () => {
    if (!persona.inclusivityAttributes || Object.keys(persona.inclusivityAttributes).length === 0) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(persona.inclusivityAttributes).map(([category, attributes]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {(attributes as string[]).map((attribute, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  {attribute}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderPoliticalCompass = () => {
    if (!persona.metadata?.politicalCompass) return null

    return (
      <div className="max-w-md mx-auto">
        <PoliticalCompass
          initialValues={persona.metadata.politicalCompass}
          readOnly={true}
        />
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Economic: {persona.metadata.politicalCompass.economic > 0 ? 'Right' : 'Left'} ({Math.abs(persona.metadata.politicalCompass.economic)})</p>
          <p>Social: {persona.metadata.politicalCompass.social > 0 ? 'Libertarian' : 'Authoritarian'} ({Math.abs(persona.metadata.politicalCompass.social)})</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Persona Details</h2>
        <p className="text-gray-600">Comprehensive view of all persona information and attributes</p>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <summary className="cursor-pointer font-medium">Debug: Persona Data Structure</summary>
            <pre className="mt-2 overflow-auto">{JSON.stringify(persona, null, 2)}</pre>
          </details>
        )}
      </div>

      {/* Background/Introduction */}
      {persona.introduction && renderSection(
        'background',
        'Background',
        FileText,
        <p className="text-gray-700 leading-relaxed">{persona.introduction}</p>
      )}

      {/* Basic Information */}
      {renderSection(
        'basic',
        'Basic Information',
        User,
        renderBasicInfo()
      )}

      {/* Personality */}
      {renderSection(
        'personality',
        'Personality & Behavior',
        Brain,
        renderPersonality()
      )}

      {/* Technology */}
      {(persona.metadata?.technology && Object.keys(persona.metadata.technology).some(key => persona.metadata.technology[key])) && renderSection(
        'technology',
        'Technology Profile',
        Smartphone,
        renderTechnology()
      )}

      {/* Brands & Custom Attributes */}
      {renderSection(
        'brands',
        'Brands & Custom Attributes',
        Heart,
        renderBrands(),
        !persona?.metadata?.brands?.preferredBrands?.length && !Object.keys(persona?.metadata?.brands?.customAttributes || {}).length
      )}

      {/* Research */}
      {(persona.metadata?.research && Object.keys(persona.metadata.research).some(key => persona.metadata.research[key])) && renderSection(
        'research',
        'Research Data',
        Database,
        renderResearch()
      )}

      {/* Political Compass */}
      {renderSection(
        'political',
        'Political Orientation',
        Globe,
        <div>
          {persona.metadata?.politicalCompass ? (
            renderPoliticalCompass()
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No political compass data available</p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2 text-xs text-left">
                  <summary>Debug: Check metadata structure</summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                    Political Compass in metadata: {JSON.stringify(persona.metadata?.politicalCompass, null, 2)}
                    {'\n'}Full metadata keys: {JSON.stringify(Object.keys(persona.metadata || {}), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>,
        !persona.metadata?.politicalCompass
      )}

      {/* Inclusivity Attributes */}
      {renderSection(
        'inclusivity',
        'Niche Attributes',
        Star,
        renderInclusivity(),
        !persona.inclusivityAttributes || Object.keys(persona.inclusivityAttributes).length === 0
      )}
    </div>
  )
}
