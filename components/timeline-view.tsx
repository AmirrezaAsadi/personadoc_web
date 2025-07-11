'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TimelineEvent {
  id: string
  title: string
  description?: string
  eventType: string
  eventDate: string
  importance: number
  category: string
  color?: string
  icon?: string
  interactionId?: string
  researchId?: string
}

interface TimelineViewProps {
  personaId: string
}

export function TimelineView({ personaId }: TimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    eventType: '',
    category: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchTimeline()
  }, [personaId, filter])

  const fetchTimeline = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.eventType) params.append('eventType', filter.eventType)
      if (filter.category) params.append('category', filter.category)
      if (filter.startDate) params.append('startDate', filter.startDate)
      if (filter.endDate) params.append('endDate', filter.endDate)
      params.append('limit', '50')

      const response = await fetch(`/api/personas/${personaId}/timeline?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setEvents(data.timeline || [])
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'milestone': return '🎯'
      case 'interaction': return '💬'
      case 'insight': return '💡'
      case 'creation': return '✨'
      default: return '📅'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'bg-red-100 text-red-800'
    if (importance >= 6) return 'bg-yellow-100 text-yellow-800'
    if (importance >= 4) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading timeline...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Persona Timeline</CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <select
            value={filter.eventType}
            onChange={(e) => setFilter(prev => ({ ...prev, eventType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            <option value="milestone">Milestones</option>
            <option value="interaction">Interactions</option>
            <option value="insight">Insights</option>
            <option value="creation">Creation</option>
          </select>

          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Categories</option>
            <option value="creation">Creation</option>
            <option value="conversation">Conversation</option>
            <option value="research">Research</option>
            <option value="versioning">Versioning</option>
          </select>

          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="End Date"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No timeline events found</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {index < events.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 -z-10" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Event icon */}
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: event.color || '#3B82F6' }}
                  >
                    {getEventIcon(event)}
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImportanceColor(event.importance)}>
                          Priority: {event.importance}/10
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(event.eventDate)}
                        </span>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="mt-1 text-gray-600">{event.description}</p>
                    )}
                    
                    <div className="mt-2 flex items-center space-x-2">
                      <Badge variant="outline">{event.eventType}</Badge>
                      {event.category && (
                        <Badge variant="outline">{event.category}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
