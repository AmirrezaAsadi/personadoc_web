'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Heart, ShoppingBag, Smartphone, Car, Coffee, Home } from 'lucide-react'

interface Step5Props {
  data: any
  onUpdate: (data: any) => void
}

const BRAND_CATEGORIES = {
  'Technology': {
    icon: Smartphone,
    brands: ['Apple', 'Google', 'Microsoft', 'Samsung', 'Tesla', 'Netflix', 'Spotify', 'Adobe', 'Zoom', 'Slack']
  },
  'Retail & E-commerce': {
    icon: ShoppingBag,
    brands: ['Amazon', 'Target', 'Walmart', 'Costco', 'Best Buy', 'IKEA', 'H&M', 'Zara', 'Nike', 'Adidas']
  },
  'Food & Beverage': {
    icon: Coffee,
    brands: ['Starbucks', 'McDonald\'s', 'Subway', 'Chipotle', 'Whole Foods', 'Trader Joe\'s', 'Coca-Cola', 'Pepsi', 'Red Bull', 'Monster']
  },
  'Automotive': {
    icon: Car,
    brands: ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Subaru']
  },
  'Lifestyle & Home': {
    icon: Home,
    brands: ['Amazon Prime', 'Home Depot', 'Lowe\'s', 'Bed Bath & Beyond', 'Williams Sonoma', 'Pottery Barn', 'West Elm', 'CB2']
  }
}

const ATTRIBUTE_TEMPLATES = [
  { key: 'spendingHabits', label: 'Spending Habits', type: 'select', options: ['Conservative', 'Moderate', 'Liberal', 'Impulse Buyer'] },
  { key: 'shoppingFrequency', label: 'Shopping Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Rarely'] },
  { key: 'brandLoyalty', label: 'Brand Loyalty', type: 'slider', min: 1, max: 10, description: '1 = Price-focused, 10 = Brand-loyal' },
  { key: 'socialMediaUsage', label: 'Social Media Usage', type: 'select', options: ['Heavy User', 'Moderate User', 'Light User', 'Non-User'] },
  { key: 'environmentalConcern', label: 'Environmental Concern', type: 'slider', min: 1, max: 10, description: '1 = Not concerned, 10 = Very concerned' },
  { key: 'healthConsciousness', label: 'Health Consciousness', type: 'slider', min: 1, max: 10, description: '1 = Not health-focused, 10 = Very health-focused' },
  { key: 'privacyConcern', label: 'Privacy Concern', type: 'slider', min: 1, max: 10, description: '1 = Not concerned, 10 = Very concerned' }
]

export default function Step5BrandsAndAttributes({ data, onUpdate }: Step5Props) {
  const [customBrand, setCustomBrand] = useState('')
  const [customAttributeKey, setCustomAttributeKey] = useState('')
  const [customAttributeValue, setCustomAttributeValue] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Technology')

  const addBrand = (brand: string, category?: string) => {
    const currentBrands = data.preferredBrands || []
    const brandData = {
      name: brand,
      category: category || 'Custom',
      relationship: 'uses', // Default relationship
      addedAt: new Date().toISOString()
    }
    
    if (!currentBrands.find((b: any) => b.name === brand)) {
      onUpdate({ preferredBrands: [...currentBrands, brandData] })
    }
  }

  const removeBrand = (brandName: string) => {
    const currentBrands = data.preferredBrands || []
    onUpdate({ 
      preferredBrands: currentBrands.filter((b: any) => b.name !== brandName) 
    })
  }

  const updateBrandRelationship = (brandName: string, relationship: string) => {
    const currentBrands = data.preferredBrands || []
    const updatedBrands = currentBrands.map((b: any) => 
      b.name === brandName ? { ...b, relationship } : b
    )
    onUpdate({ preferredBrands: updatedBrands })
  }

  const addCustomAttribute = () => {
    if (customAttributeKey && customAttributeValue) {
      const currentAttributes = data.customAttributes || {}
      onUpdate({ 
        customAttributes: {
          ...currentAttributes,
          [customAttributeKey]: customAttributeValue
        }
      })
      setCustomAttributeKey('')
      setCustomAttributeValue('')
    }
  }

  const removeCustomAttribute = (key: string) => {
    const currentAttributes = data.customAttributes || {}
    const { [key]: removed, ...rest } = currentAttributes
    onUpdate({ customAttributes: rest })
  }

  const updateTemplateAttribute = (key: string, value: any) => {
    const currentAttributes = data.customAttributes || {}
    onUpdate({ 
      customAttributes: {
        ...currentAttributes,
        [key]: value
      }
    })
  }

  const addCustomBrand = () => {
    if (customBrand.trim()) {
      addBrand(customBrand.trim())
      setCustomBrand('')
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Brands & Custom Attributes</h2>
        <p className="text-gray-600">Define what brands this persona uses and add custom attributes that matter to your research</p>
      </div>

      {/* Preferred Brands Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Preferred Brands
          </CardTitle>
          <p className="text-sm text-gray-600">Select brands this persona regularly uses or has opinions about</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Categories */}
          <div className="space-y-4">
            {Object.entries(BRAND_CATEGORIES).map(([category, { icon: Icon, brands }]) => (
              <div key={category}>
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="flex items-center gap-2 w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {brands.length} brands
                  </span>
                </button>
                
                {expandedCategory === category && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => addBrand(brand, category)}
                        className="p-2 text-sm bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 rounded-lg transition-colors text-center"
                        disabled={(data.preferredBrands || []).find((b: any) => b.name === brand)}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Brand Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom brand..."
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomBrand()}
            />
            <Button onClick={addCustomBrand} disabled={!customBrand.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Brands */}
          {data.preferredBrands && data.preferredBrands.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Selected Brands:</h4>
              <div className="space-y-2">
                {data.preferredBrands.map((brand: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant="secondary">{brand.category}</Badge>
                    <span className="font-medium flex-1">{brand.name}</span>
                    <select
                      value={brand.relationship || 'uses'}
                      onChange={(e) => updateBrandRelationship(brand.name, e.target.value)}
                      className="text-sm border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="loves">❤️ Loves</option>
                      <option value="uses">✅ Uses</option>
                      <option value="prefers">⭐ Prefers</option>
                      <option value="avoids">❌ Avoids</option>
                      <option value="neutral">😐 Neutral</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBrand(brand.name)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Attributes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Attributes</CardTitle>
          <p className="text-sm text-gray-600">Add specific attributes that are important for your research context</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Attributes */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Common Attributes:</h4>
            {ATTRIBUTE_TEMPLATES.map((template) => (
              <div key={template.key} className="space-y-2">
                <Label className="text-sm font-medium">{template.label}</Label>
                {template.description && (
                  <p className="text-xs text-gray-500">{template.description}</p>
                )}
                
                {template.type === 'select' && (
                  <select
                    value={data.customAttributes?.[template.key] || ''}
                    onChange={(e) => updateTemplateAttribute(template.key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Select {template.label.toLowerCase()}...</option>
                    {template.options?.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}

                {template.type === 'slider' && (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={template.min}
                      max={template.max}
                      value={data.customAttributes?.[template.key] || template.min}
                      onChange={(e) => updateTemplateAttribute(template.key, parseInt(e.target.value))}
                      className="w-full accent-teal-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{template.min}</span>
                      <span className="font-medium">
                        {data.customAttributes?.[template.key] || template.min}
                      </span>
                      <span>{template.max}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Attribute Input */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700">Add Custom Attribute:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Attribute name..."
                value={customAttributeKey}
                onChange={(e) => setCustomAttributeKey(e.target.value)}
              />
              <Input
                placeholder="Value..."
                value={customAttributeValue}
                onChange={(e) => setCustomAttributeValue(e.target.value)}
              />
              <Button onClick={addCustomAttribute} disabled={!customAttributeKey || !customAttributeValue}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Custom Attributes Display */}
          {data.customAttributes && Object.keys(data.customAttributes).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Current Attributes:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(data.customAttributes).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-sm">{key}</span>
                      <span className="text-gray-600 text-sm ml-2">{String(value)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomAttribute(key)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
