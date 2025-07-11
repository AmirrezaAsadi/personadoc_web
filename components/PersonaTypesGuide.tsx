'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, User, Globe, Share, Filter, Lightbulb, ArrowRight } from 'lucide-react'

interface PersonaTypesGuideProps {
  onClose: () => void
}

export function PersonaTypesGuide({ onClose }: PersonaTypesGuideProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-900/90 border border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl underwater-glow backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-cyan-100">Persona Types Guide</CardTitle>
              <p className="text-cyan-300/80 text-sm">Understanding different persona access levels</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-900/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* My Personas */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-900/30 border border-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-cyan-200">My Personas</h3>
                <Badge className="bg-blue-900/30 text-blue-200 border-blue-500/30 text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Mine
                </Badge>
              </div>
              <p className="text-cyan-300/80 text-sm">
                Personas you created and own. You have full control over these personas including editing, sharing, and deleting them.
              </p>
            </div>
          </div>

          {/* Public Personas */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-cyan-200">Public Personas</h3>
                <Badge className="bg-green-900/30 text-green-200 border-green-500/30 text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              </div>
              <p className="text-cyan-300/80 text-sm">
                Personas shared publicly by other users. You can view and interact with these personas, but cannot edit them. Great for inspiration and learning.
              </p>
            </div>
          </div>

          {/* Shared Personas */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Share className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-cyan-200">Shared with Me</h3>
                <Badge className="bg-purple-900/30 text-purple-200 border-purple-500/30 text-xs">
                  <Share className="w-3 h-3 mr-1" />
                  Shared
                </Badge>
              </div>
              <p className="text-cyan-300/80 text-sm">
                Personas that have been privately shared with you via direct links. These are not publicly visible but you have been granted access.
              </p>
            </div>
          </div>

          {/* All Personas */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-900/30 border border-cyan-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Filter className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-cyan-200">All Personas</h3>
                <Badge className="bg-cyan-900/30 text-cyan-200 border-cyan-500/30 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  All
                </Badge>
              </div>
              <p className="text-cyan-300/80 text-sm">
                Shows all personas you have access to - your own creations, public personas, and those shared with you. Use this for comprehensive searching.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-cyan-500/20">
            <div className="flex items-center justify-between">
              <p className="text-cyan-300/70 text-sm">
                Use the filter tabs to switch between different persona types
              </p>
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg"
              >
                Got it
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
