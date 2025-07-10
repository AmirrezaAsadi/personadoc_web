'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Laptop, Tablet, Home, Watch, Headphones } from 'lucide-react'

interface Step3Props {
  data: any
  onUpdate: (data: any) => void
}

const DEVICES = [
  { id: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'smartHome', label: 'Smart Home Devices', icon: Home },
  { id: 'smartwatch', label: 'Smartwatch', icon: Watch },
  { id: 'wireless-headphones', label: 'Wireless Headphones', icon: Headphones },
]

const APP_CATEGORIES = {
  'Social Media': ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'Snapchat'],
  'Productivity': ['Slack', 'Microsoft Teams', 'Notion', 'Trello', 'Google Workspace', 'Zoom'],
  'Entertainment': ['Netflix', 'YouTube', 'Spotify', 'Disney+', 'Gaming Apps', 'Podcasts'],
  'Shopping': ['Amazon', 'eBay', 'Shopify', 'Etsy', 'Target', 'Local delivery apps'],
  'Finance': ['Banking Apps', 'PayPal', 'Venmo', 'Investment Apps', 'Budgeting Apps', 'Crypto'],
  'Health & Fitness': ['Apple Health', 'Fitbit', 'MyFitnessPal', 'Meditation Apps', 'Workout Apps']
}

const COMMUNICATION_PREFERENCES = [
  'Email', 'Text Messages', 'Voice Calls', 'Video Calls', 
  'Social Media DMs', 'Instant Messaging', 'In-person meetings'
]

export default function Step3Technology({ data, onUpdate }: Step3Props) {
  const toggleDevice = (deviceId: string) => {
    const currentDevices = data.devicesOwned || []
    if (currentDevices.includes(deviceId)) {
      onUpdate({ devicesOwned: currentDevices.filter((d: string) => d !== deviceId) })
    } else {
      onUpdate({ devicesOwned: [...currentDevices, deviceId] })
    }
  }

  const toggleApp = (app: string) => {
    const currentApps = data.appPreferences || []
    if (currentApps.includes(app)) {
      onUpdate({ appPreferences: currentApps.filter((a: string) => a !== app) })
    } else {
      onUpdate({ appPreferences: [...currentApps, app] })
    }
  }

  const toggleCommunication = (method: string) => {
    const currentMethods = data.communicationPreferences || []
    if (currentMethods.includes(method)) {
      onUpdate({ communicationPreferences: currentMethods.filter((m: string) => m !== method) })
    } else {
      onUpdate({ communicationPreferences: [...currentMethods, method] })
    }
  }

  return (
    <div className="space-y-8">
      {/* Devices Owned */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices Owned *</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DEVICES.map(device => {
            const Icon = device.icon
            const isSelected = data.devicesOwned?.includes(device.id)
            
            return (
              <Card 
                key={device.id}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleDevice(device.id)}
              >
                <CardContent className="flex flex-col items-center p-4">
                  <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {device.label}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* App Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">App Preferences</h3>
        <div className="space-y-4">
          {Object.entries(APP_CATEGORIES).map(([category, apps]) => (
            <div key={category}>
              <h4 className="font-medium text-gray-800 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {apps.map(app => (
                  <Button
                    key={app}
                    variant={data.appPreferences?.includes(app) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleApp(app)}
                  >
                    {app}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Proficiency */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Tech Proficiency</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">
              Comfort Level with Technology
            </label>
            <span className="text-sm text-gray-500">
              {data.techProficiency || 5}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={data.techProficiency || 5}
            onChange={(e) => onUpdate({ techProficiency: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Beginner</span>
            <span>Expert</span>
          </div>
        </div>
      </div>

      {/* Digital Habits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Habits</h3>
        <textarea
          value={data.digitalHabits || ''}
          onChange={(e) => onUpdate({ digitalHabits: e.target.value })}
          placeholder="Describe how this persona discovers new products, seeks information, and navigates digital spaces. Include browsing habits, information sources, and decision-making patterns..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Communication Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Preferences *</h3>
        <p className="text-sm text-gray-600 mb-3">Select preferred communication methods:</p>
        <div className="flex flex-wrap gap-2">
          {COMMUNICATION_PREFERENCES.map(method => (
            <Button
              key={method}
              variant={data.communicationPreferences?.includes(method) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCommunication(method)}
            >
              {method}
            </Button>
          ))}
        </div>
        
        {/* Selected Preferences Display */}
        {data.communicationPreferences?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Selected preferences:</p>
            <div className="flex flex-wrap gap-2">
              {data.communicationPreferences.map((method: string) => (
                <Badge key={method} variant="secondary">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-900 mb-2">📱 Tips for Step 3</h3>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Device ownership affects how the persona accesses information</li>
          <li>• App preferences reveal lifestyle and work patterns</li>
          <li>• Tech proficiency impacts how they approach new tools</li>
          <li>• Communication preferences shape interaction expectations</li>
        </ul>
      </div>
    </div>
  )
}
