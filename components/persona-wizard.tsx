'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, User, Brain, Smartphone, FileText, Heart } from 'lucide-react'
import Step1Demographics from './persona-wizard/step1-demographics'
import Step2Personality from './persona-wizard/step2-personality'
import Step3Technology from './persona-wizard/step3-technology'
import Step4Research from './persona-wizard/step4-research'
import Step5BrandsAndAttributes from './persona-wizard/step5-brands-attributes'

interface PersonaWizardProps {
  onComplete: (personaData: any) => void
  onCancel: () => void
  initialData?: any
  isEditing?: boolean
}

const STEPS = [
  { id: 1, title: 'Demographics & Background', icon: User, description: 'Basic information and background story' },
  { id: 2, title: 'Personality & Traits', icon: Brain, description: 'Behavioral characteristics and motivations' },
  { id: 3, title: 'Technology & Digital Behavior', icon: Smartphone, description: 'Tech preferences and digital habits' },
  { id: 4, title: 'Research Data Integration', icon: FileText, description: 'Upload research and validation' },
  { id: 5, title: 'Brands & Custom Attributes', icon: Heart, description: 'Preferred brands and custom characteristics' }
]

export default function PersonaWizard({ onComplete, onCancel, initialData, isEditing = false }: PersonaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  // Helper to safely get nested values with proper defaults
  const getNestedValue = (obj: any, path: string, defaultValue: any = null) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue
  }
  
  const [personaData, setPersonaData] = useState({
    // Step 1: Demographics
    name: initialData?.name || '',
    age: initialData?.age?.toString() || '',
    gender: getNestedValue(initialData, 'metadata.demographics.gender', ''),
    location: initialData?.location || '',
    occupation: initialData?.occupation || '',
    incomeLevel: getNestedValue(initialData, 'metadata.demographics.incomeLevel', ''),
    education: getNestedValue(initialData, 'metadata.demographics.education', ''),
    backgroundStory: initialData?.introduction || initialData?.backgroundStory || '',
    // Preserve existing avatar data during editing
    avatar: isEditing && getNestedValue(initialData, 'metadata.avatar') ? 'existing' : null as any,
    existingAvatarData: isEditing ? getNestedValue(initialData, 'metadata.avatar') : null,
    
    // Step 2: Personality
    personalityTraits: Array.isArray(initialData?.personalityTraits) ? initialData.personalityTraits : [],
    interests: Array.isArray(initialData?.interests) ? initialData.interests : [],
    techSavvy: getNestedValue(initialData, 'metadata.personality.techSavvy', 5),
    socialness: getNestedValue(initialData, 'metadata.personality.socialness', 5),
    creativity: getNestedValue(initialData, 'metadata.personality.creativity', 5),
    organization: getNestedValue(initialData, 'metadata.personality.organization', 5),
    riskTaking: getNestedValue(initialData, 'metadata.personality.riskTaking', 5),
    adaptability: getNestedValue(initialData, 'metadata.personality.adaptability', 5),
    values: getNestedValue(initialData, 'metadata.personality.values', ''),
    motivations: getNestedValue(initialData, 'metadata.personality.motivations', ''),
    politicalCompass: getNestedValue(initialData, 'metadata.politicalCompass'),
    
    // Step 3: Technology
    devicesOwned: getNestedValue(initialData, 'metadata.technology.devicesOwned', []),
    appPreferences: getNestedValue(initialData, 'metadata.technology.appPreferences', []),
    techProficiency: getNestedValue(initialData, 'metadata.technology.techProficiency', 5),
    digitalHabits: getNestedValue(initialData, 'metadata.technology.digitalHabits', ''),
    communicationPreferences: getNestedValue(initialData, 'metadata.technology.communicationPreferences', []),
    
    // Step 4: Research
    researchFiles: [], // Always start empty for new uploads
    dataSourceTypes: getNestedValue(initialData, 'metadata.research.dataSourceTypes', []),
    manualKnowledge: getNestedValue(initialData, 'metadata.research.manualKnowledge', ''),
    researchMethodology: getNestedValue(initialData, 'metadata.research.researchMethodology', ''),

    // Step 5: Brands & Custom Attributes
    preferredBrands: getNestedValue(initialData, 'metadata.brands.preferredBrands', []),
    customAttributes: getNestedValue(initialData, 'metadata.brands.customAttributes', {}),
  })

  const updatePersonaData = (stepData: any) => {
    setPersonaData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // Validate minimum age
    const age = parseInt(personaData.age) || null
    if (age && age < 18) {
      alert('Age must be 18 or older. We do not allow simulation of minors.')
      return
    }
    
    // Convert uploaded files to base64 for API transmission
    const processedFiles = await Promise.all(
      (personaData.researchFiles || []).map(async (file: File) => {
        const base64Content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.readAsDataURL(file)
        })

        return {
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64Content
        }
      })
    )

    // Process avatar - handle both new uploads and existing avatar preservation
    let avatarData = null
    if (personaData.avatar && personaData.avatar !== 'existing') {
      // New avatar file uploaded
      const avatarBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result) // Keep full data URL for display
        }
        reader.readAsDataURL(personaData.avatar!)
      })
      
      avatarData = {
        name: personaData.avatar.name,
        type: personaData.avatar.type,
        size: personaData.avatar.size,
        dataUrl: avatarBase64
      }
    } else if (personaData.avatar === 'existing' && personaData.existingAvatarData) {
      // Preserve existing avatar data
      avatarData = personaData.existingAvatarData
    }

    // Transform data to match your existing persona structure
    const transformedData = {
      name: personaData.name,
      age: parseInt(personaData.age) || null,
      occupation: personaData.occupation,
      location: personaData.location,
      introduction: personaData.backgroundStory,
      personalityTraits: personaData.personalityTraits,
      interests: personaData.interests,
      // Preserve existing persona attributes that aren't in the wizard
      inclusivityAttributes: initialData?.inclusivityAttributes || {},
      appliedSuggestions: initialData?.appliedSuggestions || [],
      // Add new fields for extended data
      metadata: {
        avatar: avatarData,
        demographics: {
          gender: personaData.gender,
          incomeLevel: personaData.incomeLevel,
          education: personaData.education,
        },
        personality: {
          techSavvy: personaData.techSavvy,
          socialness: personaData.socialness,
          creativity: personaData.creativity,
          organization: personaData.organization,
          riskTaking: personaData.riskTaking,
          adaptability: personaData.adaptability,
          values: personaData.values,
          motivations: personaData.motivations,
        },
        politicalCompass: personaData.politicalCompass,
        technology: {
          devicesOwned: personaData.devicesOwned,
          appPreferences: personaData.appPreferences,
          techProficiency: personaData.techProficiency,
          digitalHabits: personaData.digitalHabits,
          communicationPreferences: personaData.communicationPreferences,
        },
        research: {
          dataSourceTypes: personaData.dataSourceTypes,
          manualKnowledge: personaData.manualKnowledge,
          researchMethodology: personaData.researchMethodology,
          uploadedFiles: processedFiles,
          // Preserve existing uploaded files from metadata
          ...(initialData?.metadata?.research?.uploadedFiles && {
            existingFiles: initialData.metadata.research.uploadedFiles
          })
        },
        brands: {
          preferredBrands: personaData.preferredBrands,
          customAttributes: personaData.customAttributes
        },
        // Preserve any other metadata that might exist
        ...Object.keys(initialData?.metadata || {}).reduce((acc, key) => {
          if (!['avatar', 'demographics', 'personality', 'politicalCompass', 'technology', 'research', 'brands'].includes(key)) {
            acc[key] = initialData.metadata[key]
          }
          return acc
        }, {} as any)
      }
    }
    
    onComplete(transformedData)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Demographics data={personaData} onUpdate={updatePersonaData} />
      case 2:
        return <Step2Personality data={personaData} onUpdate={updatePersonaData} />
      case 3:
        return <Step3Technology data={personaData} onUpdate={updatePersonaData} />
      case 4:
        return <Step4Research data={personaData} onUpdate={updatePersonaData} />
      case 5:
        return <Step5BrandsAndAttributes data={personaData} onUpdate={updatePersonaData} />
      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        const age = parseInt(personaData.age) || 0
        return personaData.name && personaData.age && personaData.occupation && personaData.location && age >= 18
      case 2:
        return personaData.personalityTraits.length > 0 && personaData.interests.length > 0
      case 3:
        return personaData.devicesOwned.length > 0 && personaData.communicationPreferences.length > 0
      case 4:
        return true // Research step is optional
      case 5:
        return true // Brands & attributes step is optional
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditing ? 'Edit Persona' : 'Create New Persona'}
        </h1>
        <p className="text-gray-600 mb-6">Build a comprehensive AI persona through our guided process</p>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = step.id < currentStep
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : isCompleted 
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(STEPS[currentStep - 1].icon, { className: "w-5 h-5" })}
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentStep < 5 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              {isEditing ? 'Save Changes' : 'Create Persona'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
