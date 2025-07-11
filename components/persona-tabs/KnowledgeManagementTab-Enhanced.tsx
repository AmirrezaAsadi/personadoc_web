'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ResearchUpload } from '@/components/research-upload'
import { 
  Upload, Download, FileText, Clock, GitBranch, 
  Search, Filter, BookOpen, Database, BarChart3,
  Archive, Share, Trash2, Eye, Edit, ChevronRight,
  ChevronLeft, Image, File, X, Save, RefreshCw,
  PanelRightClose, PanelRightOpen, Calendar
} from 'lucide-react'

interface KnowledgeManagementTabProps {
  personaId: string
  personaName: string
}

interface ResearchItem {
  id: string
  title: string
  description?: string
  category: string
  content: string
  files: any[]
  source?: string
  relevantDate: string
  tags: string[]
  dataSourceTypes: string[]
  createdAt: string
  ragProcessed?: boolean
}

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

interface DocumentFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
  content?: string
  thumbnail?: string
}

export function KnowledgeManagementTab({ personaId, personaName }: KnowledgeManagementTabProps) {
  // Main state
  const [researchData, setResearchData] = useState<ResearchItem[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Right panel state
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editingPersona, setEditingPersona] = useState<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  
  // Timeline state
  const [showTimeline, setShowTimeline] = useState(true)
  const [timelinePosition, setTimelinePosition] = useState(0)

  useEffect(() => {
    fetchResearchData()
    fetchVersions()
    fetchCurrentPersona()
  }, [personaId])

  const fetchResearchData = async () => {
    try {
      const response = await fetch(`/api/personas/${personaId}/research-upload`)
      if (response.ok) {
        const data = await response.json()
        setResearchData(data.research || [])
      }
    } catch (error) {
      console.error('Failed to fetch research data:', error)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/personas/${personaId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
        const active = data.versions?.find((v: Version) => v.isActive)
        setCurrentVersion(active || null)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const fetchCurrentPersona = async () => {
    try {
      const response = await fetch(`/api/personas/${personaId}`)
      if (response.ok) {
        const data = await response.json()
        setEditingPersona(data)
      }
    } catch (error) {
      console.error('Failed to fetch persona:', error)
    }
  }

  const savePersonaChanges = async () => {
    if (!editingPersona) return

    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPersona)
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        // Create new version automatically
        await createVersionFromChanges()
      }
    } catch (error) {
      console.error('Failed to save persona changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const createVersionFromChanges = async () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const version = `v${Date.now()}`
    
    try {
      const response = await fetch(`/api/personas/${personaId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          name: `Auto-save ${timestamp}`,
          notes: 'Automatic version created from knowledge management edits',
          isDraft: false
        })
      })
      
      if (response.ok) {
        fetchVersions()
      }
    } catch (error) {
      console.error('Failed to create version:', error)
    }
  }

  const switchToVersion = async (versionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/versions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          action: 'activate'
        })
      })
      
      if (response.ok) {
        fetchVersions()
        fetchCurrentPersona()
      }
    } catch (error) {
      console.error('Failed to switch version:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDocument = (file: DocumentFile) => {
    setSelectedDocument(file)
    setShowDocumentViewer(true)
  }

  const updatePersonaField = (field: string, value: any) => {
    if (!editingPersona) return
    
    setEditingPersona((prev: any) => ({
      ...prev,
      [field]: value
    }))
    setHasUnsavedChanges(true)
  }

  const DocumentViewer = () => {
    if (!selectedDocument) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocumentViewer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {selectedDocument.type.startsWith('image/') ? (
              <img 
                src={selectedDocument.url || selectedDocument.thumbnail} 
                alt={selectedDocument.name}
                className="max-w-full h-auto rounded"
              />
            ) : selectedDocument.type === 'application/pdf' ? (
              <iframe 
                src={selectedDocument.url} 
                className="w-full h-[600px] border rounded"
                title={selectedDocument.name}
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded border">
                <pre className="whitespace-pre-wrap text-sm">
                  {selectedDocument.content || 'Content not available for preview'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const EditPanel = () => {
    if (!showEditPanel || !editingPersona) return null

    return (
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl border-l z-40 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Persona</h3>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button
                size="sm"
                onClick={savePersonaChanges}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editingPersona.name || ''}
              onChange={(e) => updatePersonaField('name', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={editingPersona.age || ''}
              onChange={(e) => updatePersonaField('age', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={editingPersona.occupation || ''}
              onChange={(e) => updatePersonaField('occupation', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={editingPersona.location || ''}
              onChange={(e) => updatePersonaField('location', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="introduction">Introduction</Label>
            <Textarea
              id="introduction"
              value={editingPersona.introduction || ''}
              onChange={(e) => updatePersonaField('introduction', e.target.value)}
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="traits">Personality Traits (comma-separated)</Label>
            <Textarea
              id="traits"
              value={Array.isArray(editingPersona.personalityTraits) 
                ? editingPersona.personalityTraits.join(', ') 
                : ''}
              onChange={(e) => updatePersonaField('personalityTraits', 
                e.target.value.split(',').map(t => t.trim()).filter(t => t))}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="interests">Interests (comma-separated)</Label>
            <Textarea
              id="interests"
              value={Array.isArray(editingPersona.interests) 
                ? editingPersona.interests.join(', ') 
                : ''}
              onChange={(e) => updatePersonaField('interests', 
                e.target.value.split(',').map(i => i.trim()).filter(i => i))}
              rows={3}
            />
          </div>
        </div>
      </div>
    )
  }

  const TimelineFooter = () => {
    if (!showTimeline) return null

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30 p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Version Timeline
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimeline(false)}
          >
            <ChevronLeft className="h-4 w-4" />
            Hide
          </Button>
        </div>
        
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-all ${
                version.isActive 
                  ? 'bg-blue-50 border-blue-300 shadow-md' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => !version.isActive && switchToVersion(version.id)}
            >
              <div className="text-sm font-medium">{version.name}</div>
              <div className="text-xs text-gray-500">{version.version}</div>
              <div className="text-xs text-gray-400">
                {new Date(version.createdAt).toLocaleDateString()}
              </div>
              {version.isActive && (
                <Badge className="text-xs mt-1">Active</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`transition-all duration-300 ${showEditPanel ? 'mr-96' : ''} ${showTimeline ? 'mb-32' : ''}`}>
        {/* Main Content Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Knowledge Management
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditPanel(!showEditPanel)}
            >
              {showEditPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              {showEditPanel ? 'Close Editor' : 'Edit Persona'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents and research..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ResearchUpload 
            personaId={personaId} 
            onUploadComplete={fetchResearchData}
          />
        </div>

        {/* Documents and Research Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {researchData
            .filter(item => 
              searchTerm === '' || 
              item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium mb-1">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="h-3 w-3" />
                        {item.category}
                        <span>•</span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {item.ragProcessed && (
                      <Badge variant="secondary" className="text-xs">
                        AI Processed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  {/* File Previews */}
                  {item.files && item.files.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {item.files.slice(0, 4).map((file, index) => (
                        <div
                          key={index}
                          className="relative bg-gray-50 rounded border p-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => viewDocument(file)}
                        >
                          <div className="flex items-center gap-2">
                            {file.type?.startsWith('image/') ? (
                              <Image className="h-4 w-4 text-blue-500" />
                            ) : (
                              <File className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-xs truncate">{file.name}</span>
                          </div>
                          {file.type?.startsWith('image/') && file.thumbnail && (
                            <img 
                              src={file.thumbnail} 
                              alt={file.name}
                              className="w-full h-16 object-cover rounded mt-2"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>

        {researchData.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No research data yet</h3>
            <p className="text-gray-500 mb-4">Upload documents to start building your persona's knowledge base</p>
          </div>
        )}
      </div>

      {/* Right Edit Panel */}
      <EditPanel />

      {/* Document Viewer Modal */}
      {showDocumentViewer && <DocumentViewer />}

      {/* Timeline Footer */}
      <TimelineFooter />
    </>
  )
}
