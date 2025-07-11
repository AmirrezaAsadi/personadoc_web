'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, GitBranch, ChevronLeft, ChevronRight, 
  Calendar, Eye, EyeOff, RefreshCw, Plus,
  Check, Edit, Archive
} from 'lucide-react'

interface Version {
  id: string
  version: string
  name: string
  isActive: boolean
  isDraft: boolean
  createdAt: string
  notes?: string
  metadata?: any
}

interface GlobalTimelineProps {
  versions: Version[]
  currentVersion: Version | null
  showTimeline: boolean
  onToggleTimeline: () => void
  onSwitchVersion: (versionId: string) => void
  onCreateVersion?: () => void
  className?: string
}

export function GlobalTimeline({
  versions,
  currentVersion,
  showTimeline,
  onToggleTimeline,
  onSwitchVersion,
  onCreateVersion,
  className = ''
}: GlobalTimelineProps) {
  const [timelinePosition, setTimelinePosition] = React.useState(0)

  if (!showTimeline) {
    // Collapsed state - just a toggle button
    return (
      <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
        <Button
          onClick={onToggleTimeline}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          Show Timeline
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Version Timeline</h3>
            {currentVersion && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Current: {currentVersion.version} - {currentVersion.name}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onCreateVersion && (
              <Button
                onClick={onCreateVersion}
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Version
              </Button>
            )}
            
            <Button
              onClick={onToggleTimeline}
              size="sm"
              variant="outline"
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Hide Timeline
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {versions.length > 0 ? (
            <>
              {/* Navigation Controls */}
              {versions.length > 5 && (
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.max(0, timelinePosition - 1))}
                    disabled={timelinePosition === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Showing {timelinePosition + 1}-{Math.min(timelinePosition + 5, versions.length)} of {versions.length} versions
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.min(versions.length - 5, timelinePosition + 1))}
                    disabled={timelinePosition >= versions.length - 5}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Version Cards */}
              <div className="flex gap-4 overflow-x-auto pb-2">
                {versions
                  .slice(timelinePosition, timelinePosition + 5)
                  .map((version) => (
                    <div
                      key={version.id}
                      className={`flex-shrink-0 w-64 p-4 border rounded-lg cursor-pointer transition-all ${
                        version.isActive
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => !version.isActive && onSwitchVersion(version.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={version.isActive ? 'default' : 'secondary'}
                            className={version.isActive ? 'bg-blue-600' : ''}
                          >
                            {version.version}
                          </Badge>
                          {version.isDraft && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Draft
                            </Badge>
                          )}
                        </div>
                        
                        {version.isActive && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <h4 className="font-medium text-gray-900 truncate mb-1">
                        {version.name}
                      </h4>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                      
                      {version.notes && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {version.notes}
                        </p>
                      )}
                      
                      {!version.isActive && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSwitchVersion(version.id)
                            }}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Switch to this version
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Timeline Line */}
              <div className="relative mt-4">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2"></div>
                <div className="flex justify-between">
                  {versions
                    .slice(timelinePosition, timelinePosition + 5)
                    .map((version, index) => (
                      <div
                        key={version.id}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            version.isActive
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">
                          {version.version}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Archive className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No versions available</p>
              {onCreateVersion && (
                <Button
                  onClick={onCreateVersion}
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Version
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
