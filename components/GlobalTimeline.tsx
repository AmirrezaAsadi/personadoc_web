'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, GitBranch, ChevronLeft, ChevronRight, 
  Calendar, Eye, EyeOff, RefreshCw, Plus,
  Check, Edit, Archive, Zap, Activity
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
    <div className={`bg-white border-t border-gray-200 shadow-lg relative overflow-hidden ${className}`}>
      {/* Subtle sci-fi background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Animated data flow particles */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent">
        <div className="h-full w-8 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" 
             style={{ animation: 'flow 3s ease-in-out infinite' }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-2 relative z-10">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Sci-fi timeline icon with subtle glow */}
            <div className="relative">
              <Activity className="w-4 h-4 text-blue-600" />
              <div className="absolute inset-0 w-4 h-4 text-cyan-400/30 animate-pulse">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 font-mono">TEMPORAL.LOG</h3>
            {currentVersion && (
              <div className="relative">
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-mono border border-blue-200/50">
                  [{currentVersion.version}]
                </Badge>
                {/* Quantum probability indicator */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-30" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {onCreateVersion && (
              <Button
                onClick={onCreateVersion}
                size="sm"
                variant="outline"
                className="text-cyan-600 border-cyan-600/50 hover:bg-cyan-50 hover:border-cyan-500 h-7 text-xs px-2 font-mono transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Plus className="w-3 h-3 mr-1 relative z-10" />
                <span className="relative z-10">NEW</span>
              </Button>
            )}
            
            <Button
              onClick={onToggleTimeline}
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 font-mono hover:border-red-300 hover:text-red-600 transition-colors duration-300"
            >
              <EyeOff className="w-3 h-3 mr-1" />
              HIDE
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Neural network connection line */}
          {versions.length > 1 && (
            <div className="absolute top-8 left-4 right-4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
          )}
          
          {versions.length > 0 ? (
            <>
              {/* Navigation Controls with sci-fi styling */}
              {versions.length > 5 && (
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-gray-50/80 to-blue-50/60 border border-gray-200/50" style={{ backdropFilter: 'blur(2px)' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.max(0, timelinePosition - 1))}
                    disabled={timelinePosition === 0}
                    className="h-7 px-3 font-mono text-xs border-blue-300/50 hover:border-cyan-400/60 hover:bg-cyan-50/50 disabled:opacity-40 transition-all duration-300"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    PREV
                  </Button>
                  
                  <div className="px-3 py-1 bg-white/60 rounded border border-blue-200/50 shadow-sm">
                    <span className="text-xs text-gray-700 font-mono">
                      [{timelinePosition + 1}-{Math.min(timelinePosition + 5, versions.length)}] / [{versions.length}]
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTimelinePosition(Math.min(versions.length - 5, timelinePosition + 1))}
                    disabled={timelinePosition >= versions.length - 5}
                    className="h-7 px-3 font-mono text-xs border-blue-300/50 hover:border-cyan-400/60 hover:bg-cyan-50/50 disabled:opacity-40 transition-all duration-300"
                  >
                    NEXT
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}

              {/* Compact Version Cards with sci-fi styling */}
              <div className="flex gap-3 overflow-x-auto pb-1 relative">
                {versions
                  .slice(timelinePosition, timelinePosition + 5)
                  .map((version, index) => (
                    <div
                      key={version.id}
                      className={`flex-shrink-0 p-3 border rounded-lg cursor-pointer transition-all duration-300 min-w-32 relative group ${
                        version.isActive
                          ? 'border-cyan-400/60 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 shadow-lg shadow-cyan-100/50'
                          : 'border-gray-200/60 bg-white/80 hover:border-blue-300/60 hover:shadow-md'
                      }`}
                      onClick={() => !version.isActive && onSwitchVersion(version.id)}
                      style={{
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      {/* Corner brackets for sci-fi effect */}
                      <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-cyan-400/40" />
                      <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-cyan-400/40" />
                      <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-cyan-400/40" />
                      <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-cyan-400/40" />
                      
                      {/* Neural network node */}
                      {index < 4 && (
                        <div className="absolute top-8 -right-4 w-2 h-2 bg-blue-300/60 rounded-full border border-white shadow-sm" />
                      )}
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-center justify-between mb-1 relative z-10">
                        <Badge 
                          variant={version.isActive ? 'default' : 'secondary'}
                          className={`text-xs h-5 font-mono transition-all duration-300 ${
                            version.isActive 
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' 
                              : 'bg-gray-100/80 text-gray-700 hover:bg-blue-100/80'
                          }`}
                        >
                          [{version.version}]
                        </Badge>
                        {version.isActive && (
                          <div className="relative">
                            <Check className="w-3 h-3 text-cyan-600" />
                            <div className="absolute inset-0 w-3 h-3 text-cyan-400/50 animate-ping">
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-xs font-medium text-gray-900 truncate mb-1 relative z-10 font-mono">
                        {version.name}
                      </h4>
                      
                      <div className="text-xs text-gray-500 relative z-10 font-mono">
                        {new Date(version.createdAt).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit'
                        })}
                      </div>
                      
                      {/* Quantum state indicator */}
                      {version.isActive && (
                        <div className="absolute top-2 right-2 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                      )}
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500 relative">
              {/* Empty state with sci-fi styling */}
              <div className="relative inline-block">
                <Archive className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <div className="absolute inset-0 w-6 h-6 text-blue-400/20 animate-pulse">
                  <Archive className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-mono text-gray-400 mb-3">
                [NO_TEMPORAL_DATA_FOUND]
              </p>
              {onCreateVersion && (
                <Button
                  onClick={onCreateVersion}
                  size="sm"
                  className="h-8 text-xs px-3 font-mono bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  INIT_TIMELINE
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
