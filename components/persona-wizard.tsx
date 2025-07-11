'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, User, Brain, Smartphone, FileText } from 'lucide-react'
import Step1Demographics from './persona-wizard/step1-demographics'
import Step2Personality from './persona-wizard/step2-personality'
import Step3Technology from './persona-wizard/step3-technology'
import Step4Research from './persona-wizard/step4-research'

interface PersonaWizardProps {
  onComplete: (personaData: any) => void
  onCancel: () => void
}

const STEPS = [
  { id: 1, title: 'Demographics & Background', icon: User, description: 'Basic information and background story' },
  { id: 2, title: 'Personality & Traits', icon: Brain, description: 'Behavioral characteristics and motivations' },
  { id: 3, title: 'Technology & Digital Behavior', icon: Smartphone, description: 'Tech preferences and digital habits' },
  { id: 4, title: 'Research Data Integration', icon: FileText, description: 'Upload research and validation' }
]

export default function PersonaWizard({ onComplete, onCancel }: PersonaWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [personaData, setPersonaData] = useState({
    // Step 1: Demographics
    name: '',
    age: '',
    gender: '',
    location: '',
    occupation: '',
    incomeLevel: '',
    education: '',
    backgroundStory: '',
    avatar: null as File | null,
    
    // Step 2: Personality
    personalityTraits: [],
    interests: [],
    techSavvy: 5,
    socialness: 5,
    creativity: 5,
    organization: 5,
    riskTaking: 5,
    adaptability: 5,
    values: '',
    motivations: '',
    
    // Step 3: Technology
    devicesOwned: [],
    appPreferences: [],
    techProficiency: 5,
    digitalHabits: '',
    communicationPreferences: [],
    
    // Step 4: Research
    researchFiles: [],
    dataSourceTypes: [],
    manualKnowledge: '',
    researchMethodology: '',
  })

  const updatePersonaData = (stepData: any) => {
    setPersonaData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
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

    // Process avatar if present
    let avatarData = null
    if (personaData.avatar) {
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
          uploadedFiles: processedFiles
        }
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
      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return personaData.name && personaData.age && personaData.occupation && personaData.location
      case 2:
        return personaData.personalityTraits.length > 0 && personaData.interests.length > 0
      case 3:
        return personaData.devicesOwned.length > 0 && personaData.communicationPreferences.length > 0
      case 4:
        return true // Research step is optional
      default:
        return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Persona</h1>
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
          {currentStep < 4 ? (
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
              Create Persona
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
