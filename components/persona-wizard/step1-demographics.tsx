'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, Upload } from 'lucide-react'

interface Step1Props {
  data: any
  onUpdate: (data: any) => void
}

const INCOME_LEVELS = [
  'Under $25,000',
  '$25,000 - $50,000',
  '$50,000 - $75,000',
  '$75,000 - $100,000',
  '$100,000 - $150,000',
  '$150,000+',
  'Prefer not to say'
]

const EDUCATION_LEVELS = [
  'High School',
  'Some College',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'Doctorate',
  'Professional Degree',
  'Other'
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']

export default function Step1Demographics({ data, onUpdate }: Step1Props) {
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onUpdate({ avatar: file })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <Input
              value={data.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter persona name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <Input
                type="number"
                value={data.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="25"
                min="18"
                max="100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum age is 18 years</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={data.gender || ''}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                {GENDERS.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <Input
              value={data.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, State/Country"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation *
            </label>
            <Input
              value={data.occupation || ''}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              placeholder="Job title or profession"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Level
            </label>
            <select
              value={data.incomeLevel || ''}
              onChange={(e) => handleInputChange('incomeLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select income range</option>
              {INCOME_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Level
            </label>
            <select
              value={data.education || ''}
              onChange={(e) => handleInputChange('education', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select education level</option>
              {EDUCATION_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column - Avatar & Background */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Photo
            </label>
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-8">
                {data.avatar && data.avatar !== 'existing' ? (
                  <div className="text-center">
                    <User className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">{data.avatar.name}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => onUpdate({ avatar: null })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : data.avatar === 'existing' && data.existingAvatarData ? (
                  <div className="text-center">
                    <img 
                      src={data.existingAvatarData.dataUrl} 
                      alt="Current avatar" 
                      className="w-16 h-16 mx-auto rounded-full object-cover mb-2"
                    />
                    <p className="text-sm text-gray-600">Current avatar</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        Change
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdate({ avatar: null, existingAvatarData: null })}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Upload avatar image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="avatar-upload"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Story
            </label>
            <textarea
              value={data.backgroundStory || ''}
              onChange={(e) => handleInputChange('backgroundStory', e.target.value)}
              placeholder="Write a brief background story about this persona. Include their life experiences, current situation, and key characteristics that make them unique..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will help the AI understand the persona's context and personality
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Step 1</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be specific with location (e.g., "Austin, Texas" vs "Texas")</li>
          <li>• Include relevant job context (e.g., "Senior Software Engineer at a startup")</li>
          <li>• Write background stories in third person for better AI roleplay</li>
          <li>• Required fields (*) are needed to create a functional persona</li>
        </ul>
      </div>
    </div>
  )
}
