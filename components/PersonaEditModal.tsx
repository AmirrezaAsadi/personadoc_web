'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, Edit3, Sparkles } from 'lucide-react'

interface PersonaEditModalProps {
  isOpen: boolean
  onClose: () => void
  persona: any
  onSave: (editedPersona: any, versionNotes?: string) => void
}

export function PersonaEditModal({ isOpen, onClose, persona, onSave }: PersonaEditModalProps) {
  const [editedPersona, setEditedPersona] = useState({
    name: '',
    age: '',
    occupation: '',
    location: '',
    introduction: '',
    personalityTraits: [] as string[],
    interests: [] as string[],
    inclusivityAttributes: {} as any,
    appliedSuggestions: [] as any[]
  })
  const [versionNotes, setVersionNotes] = useState('')
  const [personalityInput, setPersonalityInput] = useState('')
  const [interestsInput, setInterestsInput] = useState('')

  useEffect(() => {
    if (persona && isOpen) {
      const isAIEnhanced = persona.versionNotes && persona.versionNotes.includes('inclusivity')
      
      setEditedPersona({
        name: persona.name || '',
        age: persona.age?.toString() || '',
        occupation: persona.occupation || '',
        location: persona.location || '',
        introduction: persona.introduction || '',
        personalityTraits: persona.personalityTraits || [],
        interests: persona.interests || [],
        inclusivityAttributes: persona.inclusivityAttributes || {},
        appliedSuggestions: persona.appliedSuggestions || []
      })
      setPersonalityInput((persona.personalityTraits || []).join(', '))
      setInterestsInput((persona.interests || []).join(', '))
      
      // Pre-populate version notes if this is an AI enhancement
      if (isAIEnhanced && persona.versionNotes) {
        setVersionNotes(persona.versionNotes)
      } else {
        setVersionNotes('')
      }
    }
  }, [persona, isOpen])

  const handleSave = () => {
    const updatedPersona = {
      ...editedPersona,
      age: editedPersona.age ? parseInt(editedPersona.age) : null,
      personalityTraits: personalityInput.split(',').map(t => t.trim()).filter(t => t),
      interests: interestsInput.split(',').map(i => i.trim()).filter(i => i),
      inclusivityAttributes: editedPersona.inclusivityAttributes,
      appliedSuggestions: editedPersona.appliedSuggestions
    }
    onSave(updatedPersona, versionNotes)
    onClose()
  }

  if (!isOpen) return null

  const isAIEnhanced = versionNotes && versionNotes.includes('inclusivity')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {isAIEnhanced ? (
              <>
                <Sparkles className="h-5 w-5 text-purple-600" />
                Edit AI-Enhanced Persona
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5 text-blue-600" />
                Edit Persona
              </>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isAIEnhanced && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-1">
                <Sparkles className="h-4 w-4" />
                AI-Enhanced Content
              </div>
              <p className="text-xs text-purple-600">
                This persona has been automatically enhanced with inclusive design insights. Review the changes and adjust as needed before saving.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedPersona.name}
                onChange={(e) => setEditedPersona(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={editedPersona.age}
                onChange={(e) => setEditedPersona(prev => ({ ...prev, age: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={editedPersona.occupation}
                onChange={(e) => setEditedPersona(prev => ({ ...prev, occupation: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editedPersona.location}
                onChange={(e) => setEditedPersona(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              value={editedPersona.introduction}
              onChange={(e) => setEditedPersona(prev => ({ ...prev, introduction: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="personality">Personality Traits (comma-separated)</Label>
            <Input
              id="personality"
              value={personalityInput}
              onChange={(e) => setPersonalityInput(e.target.value)}
              placeholder="e.g., outgoing, analytical, creative"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="interests">Interests (comma-separated)</Label>
            <Input
              id="interests"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="e.g., technology, cooking, travel"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="versionNotes">Version Notes (optional)</Label>
            <Textarea
              id="versionNotes"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="Describe what changes you made in this version..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save New Version
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
