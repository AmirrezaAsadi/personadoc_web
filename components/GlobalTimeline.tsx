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

  return (
    <div className={`bg-white border-t border-gray-200 shadow-lg ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">Timeline</h3>
            {currentVersion && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                v{currentVersion.version}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onCreateVersion && (
              <Button
                onClick={onCreateVersion}
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 h-7 text-xs px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                New
              </Button>
            )}
            
            <Button
              onClick={onToggleTimeline}
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              Hide
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {versions.length > 0 ? (
            <>
              {/* Navigation Controls */}
              {versions.length > 5 && (
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.max(0, timelinePosition - 1))}
                    disabled={timelinePosition === 0}
                    className="h-6 px-2"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  
                  <span className="text-xs text-gray-600">
                    {timelinePosition + 1}-{Math.min(timelinePosition + 5, versions.length)} of {versions.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.min(versions.length - 5, timelinePosition + 1))}
                    disabled={timelinePosition >= versions.length - 5}
                    className="h-6 px-2"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Compact Version Cards */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {versions
                  .slice(timelinePosition, timelinePosition + 5)
                  .map((version) => (
                    <div
                      key={version.id}
                      className={`flex-shrink-0 p-2 border rounded cursor-pointer transition-all min-w-32 ${
                        version.isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => !version.isActive && onSwitchVersion(version.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge 
                          variant={version.isActive ? 'default' : 'secondary'}
                          className={`text-xs h-4 ${version.isActive ? 'bg-blue-600' : ''}`}
                        >
                          v{version.version}
                        </Badge>
                        {version.isActive && (
                          <Check className="w-3 h-3 text-blue-600" />
                        )}
                      </div>
                      
                      <h4 className="text-xs font-medium text-gray-900 truncate mb-1">
                        {version.name}
                      </h4>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-2 text-gray-500">
              <Archive className="w-4 h-4 mx-auto mb-1 text-gray-400" />
              <p className="text-xs">No versions available</p>
              {onCreateVersion && (
                <Button
                  onClick={onCreateVersion}
                  size="sm"
                  className="mt-1 h-6 text-xs px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create First
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
