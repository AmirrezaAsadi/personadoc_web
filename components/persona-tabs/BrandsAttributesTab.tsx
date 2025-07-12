'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  ShoppingBag, 
  Smartphone, 
  Car, 
  Coffee, 
  Home, 
  Settings,
  TrendingUp,
  Star,
  X,
  Edit
} from 'lucide-react'

interface BrandsAttributesTabProps {
  persona: any
  onUpdate?: (updates: any) => void
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

export default function BrandsAttributesTab({ persona, onUpdate, isEditable = false }: BrandsAttributesTabProps) {
  const [editMode, setEditMode] = useState(false)
  
  const brands = persona?.metadata?.brands?.preferredBrands || []
  const customAttributes = persona?.metadata?.brands?.customAttributes || {}

  const groupedBrands = brands.reduce((acc: any, brand: any) => {
    const category = brand.category || 'Custom'
    if (!acc[category]) acc[category] = []
    acc[category].push(brand)
    return acc
  }, {})

  const handleToggleEdit = () => {
    setEditMode(!editMode)
  }

  const renderBrandCard = (brand: any) => {
    const IconComponent = CATEGORY_ICONS[brand.category] || Settings
    const relationshipClass = RELATIONSHIP_COLORS[brand.relationship] || RELATIONSHIP_COLORS.neutral
    const relationshipIcon = RELATIONSHIP_ICONS[brand.relationship] || RELATIONSHIP_ICONS.neutral

    return (
      <Card key={brand.name} className="relative hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
              <IconComponent className="w-4 h-4 text-gray-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{brand.name}</h4>
              <p className="text-sm text-gray-500 mb-2">{brand.category}</p>
              
              <Badge 
                variant="outline" 
                className={`text-xs ${relationshipClass}`}
              >
                {relationshipIcon} {brand.relationship}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAttributeCard = (key: string, value: any) => {
    const isNumeric = typeof value === 'number'
    
    return (
      <Card key={key} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            
            {isNumeric ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>1</span>
                  <span className="font-medium text-lg text-teal-600">{value}</span>
                  <span>10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                  {String(value)}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!brands.length && !Object.keys(customAttributes).length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Brands or Attributes</h3>
        <p className="text-gray-500 mb-4">
          This persona doesn't have any brand preferences or custom attributes defined yet.
        </p>
        {isEditable && (
          <Button onClick={handleToggleEdit} className="bg-teal-600 hover:bg-teal-700">
            <Edit className="w-4 h-4 mr-2" />
            Add Brands & Attributes
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Brands & Attributes</h2>
          <p className="text-gray-600">Brand preferences and custom characteristics</p>
        </div>
        {isEditable && (
          <Button 
            onClick={handleToggleEdit}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {editMode ? 'Save Changes' : 'Edit'}
          </Button>
        )}
      </div>

      {/* Brand Preferences */}
      {brands.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-semibold text-gray-900">Brand Preferences</h3>
            <Badge variant="outline" className="ml-auto">
              {brands.length} brands
            </Badge>
          </div>

          {Object.entries(groupedBrands).map(([category, categoryBrands]) => {
            const IconComponent = CATEGORY_ICONS[category] || Settings
            
            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <IconComponent className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{category}</h4>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {(categoryBrands as any[]).length} brands
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(categoryBrands as any[]).map(renderBrandCard)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom Attributes */}
      {Object.keys(customAttributes).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">Custom Attributes</h3>
            <Badge variant="outline" className="ml-auto">
              {Object.keys(customAttributes).length} attributes
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(customAttributes).map(([key, value]) => 
              renderAttributeCard(key, value)
            )}
          </div>
        </div>
      )}

      {/* Insights Section */}
      {brands.length > 0 && (
        <Card className="bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <TrendingUp className="w-5 h-5" />
              Brand Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {brands.filter((b: any) => b.relationship === 'loves').length}
                </div>
                <div className="text-teal-700">Loved Brands</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {brands.filter((b: any) => b.relationship === 'uses').length}
                </div>
                <div className="text-green-700">Used Brands</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {Object.keys(groupedBrands).length}
                </div>
                <div className="text-gray-700">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
