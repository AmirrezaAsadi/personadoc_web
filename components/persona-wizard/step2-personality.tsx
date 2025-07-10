'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

interface Step2Props {
  data: any
  onUpdate: (data: any) => void
}

const PREDEFINED_TRAITS = [
  'Analytical', 'Creative', 'Empathetic', 'Detail-oriented', 'Optimistic',
  'Introverted', 'Extroverted', 'Patient', 'Ambitious', 'Collaborative',
  'Independent', 'Methodical', 'Innovative', 'Pragmatic', 'Curious',
  'Decisive', 'Flexible', 'Reliable', 'Spontaneous', 'Thoughtful'
]

const INTEREST_CATEGORIES = {
  'Technology': ['AI & Machine Learning', 'Software Development', 'Gadgets', 'Gaming', 'Cybersecurity', 'Data Science'],
  'Lifestyle': ['Fitness', 'Cooking', 'Travel', 'Fashion', 'Photography', 'Gardening'],
  'Professional': ['Leadership', 'Entrepreneurship', 'Marketing', 'Finance', 'Project Management', 'Networking'],
  'Personal': ['Reading', 'Music', 'Art', 'Sports', 'Meditation', 'Volunteering']
}

const BEHAVIORAL_DIMENSIONS = [
  { key: 'techSavvy', label: 'Tech Savvy', description: 'Comfort with technology and digital tools' },
  { key: 'socialness', label: 'Social', description: 'Preference for social interaction and collaboration' },
  { key: 'creativity', label: 'Creative', description: 'Innovative thinking and artistic expression' },
  { key: 'organization', label: 'Organized', description: 'Structured approach and attention to detail' },
  { key: 'riskTaking', label: 'Risk-Taking', description: 'Willingness to take chances and try new things' },
  { key: 'adaptability', label: 'Adaptable', description: 'Flexibility and openness to change' }
]

export default function Step2Personality({ data, onUpdate }: Step2Props) {
  const [customTrait, setCustomTrait] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Technology')

  const addTrait = (trait: string) => {
    const currentTraits = data.personalityTraits || []
    if (!currentTraits.includes(trait)) {
      onUpdate({ personalityTraits: [...currentTraits, trait] })
    }
  }

  const removeTrait = (trait: string) => {
    const currentTraits = data.personalityTraits || []
    onUpdate({ personalityTraits: currentTraits.filter((t: string) => t !== trait) })
  }

  const addCustomTrait = () => {
    if (customTrait.trim()) {
      addTrait(customTrait.trim())
      setCustomTrait('')
    }
  }

  const toggleInterest = (interest: string) => {
    const currentInterests = data.interests || []
    if (currentInterests.includes(interest)) {
      onUpdate({ interests: currentInterests.filter((i: string) => i !== interest) })
    } else {
      onUpdate({ interests: [...currentInterests, interest] })
    }
  }

  const updateSlider = (dimension: string, value: number) => {
    onUpdate({ [dimension]: value })
  }

  return (
    <div className="space-y-8">
      {/* Personality Traits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality Traits *</h3>
        
        {/* Selected Traits */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {(data.personalityTraits || []).map((trait: string) => (
              <Badge key={trait} variant="secondary" className="flex items-center gap-1">
                {trait}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeTrait(trait)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Predefined Traits */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Select from common traits:</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TRAITS.map(trait => (
              <Button
                key={trait}
                variant={data.personalityTraits?.includes(trait) ? "default" : "outline"}
                size="sm"
                onClick={() => data.personalityTraits?.includes(trait) ? removeTrait(trait) : addTrait(trait)}
              >
                {trait}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Trait Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTrait}
            onChange={(e) => setCustomTrait(e.target.value)}
            placeholder="Add custom trait..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addCustomTrait()}
          />
          <Button onClick={addCustomTrait} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Interests & Hobbies */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests & Hobbies *</h3>
        <div className="space-y-4">
          {Object.entries(INTEREST_CATEGORIES).map(([category, interests]) => (
            <Card key={category} className="border">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  className="w-full justify-between p-0 h-auto"
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                >
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-gray-500">
                    {interests.filter(i => data.interests?.includes(i)).length} selected
                  </span>
                </Button>
                
                {expandedCategory === category && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {interests.map(interest => (
                      <Button
                        key={interest}
                        variant={data.interests?.includes(interest) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleInterest(interest)}
                        className="justify-start"
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Behavioral Characteristics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavioral Characteristics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BEHAVIORAL_DIMENSIONS.map(dimension => (
            <div key={dimension.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  {dimension.label}
                </label>
                <span className="text-sm text-gray-500">
                  {data[dimension.key] || 5}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={data[dimension.key] || 5}
                onChange={(e) => updateSlider(dimension.key, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">{dimension.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values & Motivations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Core Values
          </label>
          <textarea
            value={data.values || ''}
            onChange={(e) => onUpdate({ values: e.target.value })}
            placeholder="What principles and values guide this persona's decisions? (e.g., family, achievement, authenticity, security...)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivations & Goals
          </label>
          <textarea
            value={data.motivations || ''}
            onChange={(e) => onUpdate({ motivations: e.target.value })}
            placeholder="What drives this persona? What are their short-term and long-term goals? What fears or aspirations motivate their actions?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-900 mb-2">🎯 Tips for Step 2</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Select 3-7 personality traits for a balanced persona</li>
          <li>• Choose interests across multiple categories for depth</li>
          <li>• Use the behavioral sliders to create unique personality patterns</li>
          <li>• Values and motivations help the AI understand decision-making</li>
        </ul>
      </div>
    </div>
  )
}
