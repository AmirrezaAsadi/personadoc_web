'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Brain, User, CheckCircle, X, Loader2 } from 'lucide-react'

interface TranscriptFile {
  id: string
  file: File
  name: string
  size: number
  content?: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

interface TranscriptWizardProps {
  onComplete: (personaData: any) => void
  onCancel: () => void
}

const STEP_INFO = [
  { 
    id: 1, 
    title: 'Upload Transcripts', 
    icon: Upload, 
    description: 'Upload 1-5 interview, conversation, or meeting transcripts' 
  },
  { 
    id: 2, 
    title: 'AI Analysis', 
    icon: Brain, 
    description: 'AI analyzes transcripts and infers persona characteristics' 
  },
  { 
    id: 3, 
    title: 'Review & Customize', 
    icon: User, 
    description: 'Review AI-generated persona and make adjustments' 
  }
]

export default function TranscriptWizard({ onComplete, onCancel }: TranscriptWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [transcripts, setTranscripts] = useState<TranscriptFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiInferredPersona, setAiInferredPersona] = useState<any>(null)
  const [personaData, setPersonaData] = useState<any>({
    name: '',
    age: '',
    gender: '',
    location: '',
    occupation: '',
    incomeLevel: '',
    education: '',
    backgroundStory: '',
    personalityTraits: [],
    interests: [],
    values: '',
    motivations: ''
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (transcripts.length + files.length > 5) {
      alert('Maximum 5 transcripts allowed')
      return
    }

    const newTranscripts = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const
    }))

    setTranscripts(prev => [...prev, ...newTranscripts])
  }

  const removeTranscript = (id: string) => {
    setTranscripts(prev => prev.filter(t => t.id !== id))
  }

  const processTranscripts = async () => {
    setIsProcessing(true)
    setCurrentStep(2)

    try {
      // Read transcript contents
      const transcriptContents = await Promise.all(
        transcripts.map(async (transcript) => {
          const content = await readFileContent(transcript.file)
          setTranscripts(prev => prev.map(t => 
            t.id === transcript.id 
              ? { ...t, content, status: 'completed' } 
              : t
          ))
          return { name: transcript.name, content }
        })
      )

      // Call AI analysis API
      const response = await fetch('/api/transcripts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcripts: transcriptContents })
      })

      if (response.ok) {
        const result = await response.json()
        setAiInferredPersona(result.persona)
        setPersonaData(result.persona)
        setCurrentStep(3)
      } else {
        throw new Error('Failed to analyze transcripts')
      }
    } catch (error) {
      console.error('Error processing transcripts:', error)
      alert('Failed to process transcripts. Please try again.')
      setCurrentStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const updatePersonaData = (field: string, value: any) => {
    setPersonaData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleComplete = () => {
    // Validate minimum age
    const age = parseInt(personaData.age) || 0
    if (age && age < 18) {
      alert('Age must be 18 or older. We do not allow simulation of minors.')
      return
    }
    
    // Prepare final persona data with transcript metadata
    const finalPersonaData = {
      ...personaData,
      metadata: {
        transcripts: transcripts.map(t => ({
          name: t.name,
          size: t.size,
          content: t.content
        })),
        aiInferred: true,
        createdFrom: 'transcripts'
      }
    }
    onComplete(finalPersonaData)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
    return Math.round(bytes / (1024 * 1024)) + ' MB'
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h3 className="text-xl font-semibold mb-2">Upload Interview Transcripts</h3>
        <p className="text-gray-600 mb-6">
          Upload 1-5 transcripts (interviews, conversations, meetings) to create a persona based on real speech patterns and characteristics.
        </p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          id="transcript-upload"
          multiple
          accept=".txt,.md,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label htmlFor="transcript-upload" className="cursor-pointer">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop transcript files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports .txt, .md, .doc, .docx files • Max 5 files
          </p>
        </label>
      </div>

      {/* Uploaded Files */}
      {transcripts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Uploaded Transcripts ({transcripts.length}/5)</h4>
          {transcripts.map((transcript) => (
            <div key={transcript.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">{transcript.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(transcript.size)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeTranscript(transcript.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={processTranscripts}
          disabled={transcripts.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Analyze Transcripts
          <Brain className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="relative">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          {isProcessing && (
            <Loader2 className="w-6 h-6 absolute top-2 right-2 animate-spin text-blue-500" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-600 mb-6">
          Analyzing speech patterns, personality traits, and characteristics from your transcripts...
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        {transcripts.map((transcript) => (
          <div key={transcript.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {transcript.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{transcript.name}</p>
              <p className="text-xs text-gray-500 capitalize">{transcript.status}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">🤖 AI Analysis Process</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Extracting personality traits and communication style</li>
          <li>• Identifying interests, values, and motivations</li>
          <li>• Anonymizing personal information for privacy</li>
          <li>• Creating vector embeddings for knowledge base</li>
        </ul>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold mb-2">Review AI-Generated Persona</h3>
        <p className="text-gray-600 mb-6">
          Review and customize the persona created from your transcripts. All personal information has been anonymized.
        </p>
      </div>

      {/* AI-Generated Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={personaData.name}
            onChange={(e) => updatePersonaData('name', e.target.value)}
            placeholder="Anonymous persona name"
          />
        </div>
        
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={personaData.age}
            onChange={(e) => updatePersonaData('age', e.target.value)}
            placeholder="Estimated age"
            min="18"
            max="100"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum age is 18 years</p>
        </div>

        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={personaData.occupation}
            onChange={(e) => updatePersonaData('occupation', e.target.value)}
            placeholder="Inferred occupation"
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={personaData.location}
            onChange={(e) => updatePersonaData('location', e.target.value)}
            placeholder="General location"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="background">Background Story</Label>
        <textarea
          id="background"
          value={personaData.backgroundStory}
          onChange={(e) => updatePersonaData('backgroundStory', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="AI-generated background based on transcript analysis..."
        />
      </div>

      {/* Personality Traits */}
      <div>
        <Label>Personality Traits (AI Detected)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {personaData.personalityTraits?.map((trait: string, index: number) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back to Upload
        </Button>
        <Button 
          onClick={handleComplete}
          disabled={!personaData.name}
          className="bg-green-600 hover:bg-green-700"
        >
          Create Persona
          <CheckCircle className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEP_INFO.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-100 text-blue-700' : 
                isCompleted ? 'bg-green-100 text-green-700' : 
                'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </div>
              
              {index < STEP_INFO.length - 1 && (
                <div className={`w-8 h-px mx-2 ${
                  isCompleted ? 'bg-green-300' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {STEP_INFO[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>
    </div>
  )
}
