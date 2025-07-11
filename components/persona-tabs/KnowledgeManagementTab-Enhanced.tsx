'use client'

import React, { useState, useEffect } from 'react'
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
  PanelRightClose, PanelRightOpen, Calendar, Camera,
  Plus, ImageIcon, FileDown, ExternalLink
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
  caption?: string
  uploadedAt?: string
  category?: 'document' | 'image' | 'social' | 'research'
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
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [activeView, setActiveView] = useState<'all' | 'documents' | 'images' | 'social'>('all')
  
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

  const downloadFile = async (file: DocumentFile) => {
    try {
      if (file.url) {
        // Direct download from URL
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // Fetch from API
        const response = await fetch(`/api/personas/${personaId}/files/${file.id}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = file.name
          document.body.appendChild(link)
          link.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(link)
        }
      }
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('Failed to download file. Please try again.')
    }
  }

  const uploadImage = async (file: File, caption: string, category: 'social' | 'research' = 'social') => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caption', caption)
      formData.append('category', category)
      formData.append('type', 'image')

      const response = await fetch(`/api/personas/${personaId}/files/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        fetchResearchData() // Refresh to show new image
        setShowImageUpload(false)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updatePersonaField = (field: string, value: any) => {
    if (!editingPersona) return
    
    setEditingPersona((prev: any) => ({
      ...prev,
      [field]: value
    }))
    setHasUnsavedChanges(true)
  }

  const ImageUploadModal = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [caption, setCaption] = useState('')
    const [category, setCategory] = useState<'social' | 'research'>('social')
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith('image/')) {
        setSelectedFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }
    }

    const handleUpload = () => {
      if (selectedFile) {
        uploadImage(selectedFile, caption, category)
      }
    }

    if (!showImageUpload) return null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Upload Image</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageUpload(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="image-file">Select Image</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>

            {preview && (
              <div className="border rounded-lg p-2">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption for this image..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as 'social' | 'research')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="social">Social Media</option>
                <option value="research">Research</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImageUpload(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
              >
                {loading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
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

        {/* Search, Filter, and Upload */}
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
          
          {/* View Filter */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            {[
              { id: 'all', label: 'All', icon: Database },
              { id: 'documents', label: 'Docs', icon: FileText },
              { id: 'images', label: 'Images', icon: ImageIcon },
              { id: 'social', label: 'Social', icon: Camera }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeView === id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView(id as any)}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {label}
              </Button>
            ))}
          </div>
          
          {/* Upload Options */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowImageUpload(true)}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Camera className="h-4 w-4" />
              Upload Image
            </Button>
            
            <ResearchUpload 
              personaId={personaId} 
              onUploadComplete={fetchResearchData}
            />
          </div>
        </div>

        {/* Documents and Research Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {researchData
            .filter(item => {
              // Search filter
              const matchesSearch = searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.content.toLowerCase().includes(searchTerm.toLowerCase())
              
              // View filter
              if (activeView === 'all') return matchesSearch
              if (activeView === 'documents') return matchesSearch && item.files?.some(f => !f.type?.startsWith('image/'))
              if (activeView === 'images') return matchesSearch && item.files?.some(f => f.type?.startsWith('image/'))
              if (activeView === 'social') return matchesSearch && item.category === 'social'
              
              return matchesSearch
            })
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
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        {item.files.slice(0, 4).map((file, index) => (
                          <div
                            key={index}
                            className="relative group bg-gray-50 rounded border overflow-hidden"
                          >
                            {file.type?.startsWith('image/') ? (
                              <div 
                                className="cursor-pointer"
                                onClick={() => viewDocument(file)}
                              >
                                {file.thumbnail || file.url ? (
                                  <img 
                                    src={file.thumbnail || file.url} 
                                    alt={file.name}
                                    className="w-full h-24 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-24 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="p-2 cursor-pointer h-24 flex flex-col justify-between"
                                onClick={() => viewDocument(file)}
                              >
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </span>
                                  <Eye className="h-3 w-3 text-gray-400 group-hover:text-blue-500" />
                                </div>
                              </div>
                            )}
                            
                            {/* Download button overlay */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadFile(file)
                              }}
                            >
                              <FileDown className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      {item.files.length > 4 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{item.files.length - 4} more files
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(item.files?.[0])}
                        disabled={!item.files?.length}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {item.files?.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(item.files[0])}
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {item.files?.length || 0} files
                    </div>
                  </div>
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

      {/* Image Upload Modal */}
      <ImageUploadModal />

      {/* Document Viewer Modal */}
      {showDocumentViewer && <DocumentViewer />}

      {/* Timeline Footer */}
      <TimelineFooter />
    </>
  )
}
