'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ResearchUpload } from '@/components/research-upload'
import { TimelineView } from '@/components/timeline-view'
import { 
  Upload, Download, FileText, Clock, GitBranch, 
  Search, Filter, BookOpen, Database, BarChart3,
  Archive, Share, Trash2, Eye, Edit
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
}

export function KnowledgeManagementTab({ personaId, personaName }: KnowledgeManagementTabProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'research' | 'timeline' | 'versions' | 'export' | 'import'>('research')
  const [researchData, setResearchData] = useState<ResearchItem[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchResearchData()
    fetchVersions()
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
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const handleExport = async (format: 'json' | 'csv' | 'markdown' | 'personaDoc') => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/personas/${personaId}/export?format=${format}&includeInteractions=true&includeImages=true`
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${personaName}-export.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRAGProcessing = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/research`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully processed ${result.chunksProcessed} chunks for vector search`)
        fetchResearchData() // Refresh to show updated status
      }
    } catch (error) {
      console.error('RAG processing failed:', error)
      alert('RAG processing failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const createNewVersion = async () => {
    const version = prompt('Enter version number (e.g., 1.1, 2.0):')
    const name = prompt('Enter version name:')
    
    if (!version || !name) return

    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          name,
          notes: 'Manual version creation'
        })
      })
      
      if (response.ok) {
        fetchVersions()
        alert('Version created successfully!')
      }
    } catch (error) {
      console.error('Version creation failed:', error)
      alert('Failed to create version. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const publishVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to publish this version? It will become the active version.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/versions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          action: 'publish'
        })
      })
      
      if (response.ok) {
        fetchVersions()
        alert('Version published successfully!')
      }
    } catch (error) {
      console.error('Version publishing failed:', error)
      alert('Failed to publish version. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (file: File, options: {
    createAsTemplate?: boolean
    preserveId?: boolean
    importFiles?: boolean
    importInteractions?: boolean
  }) => {
    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('createAsTemplate', String(options.createAsTemplate || false))
      formData.append('preserveId', String(options.preserveId || false))
      formData.append('importFiles', String(options.importFiles || true))
      formData.append('importInteractions', String(options.importInteractions || true))
      
      const response = await fetch('/api/personas/import', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully imported persona: ${result.persona.name}\n` +
              `Research items: ${result.imported.researchItems}\n` +
              `Timeline events: ${result.imported.timelineEvents}\n` +
              `Files: ${result.imported.files}\n` +
              `Interactions: ${result.imported.interactions}`)
        
        // Refresh data if importing to current persona
        if (result.imported.personaId === personaId) {
          fetchResearchData()
          fetchVersions()
        }
      } else {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }
    } catch (error) {
      console.error('Import failed:', error)
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredResearch = researchData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(researchData.map(item => item.category)))

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'research', label: 'Research Library', icon: BookOpen },
            { id: 'upload', label: 'Upload Data', icon: Upload },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'versions', label: 'Versions', icon: GitBranch },
            { id: 'export', label: 'Export', icon: Download },
            { id: 'import', label: 'Import', icon: Share }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Research Library Tab */}
      {activeTab === 'research' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Research Library ({researchData.length} items)
                </span>
                <Button onClick={handleRAGProcessing} disabled={loading}>
                  <Database className="h-4 w-4 mr-2" />
                  Process with AI
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search research data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Research Items */}
              <div className="space-y-4">
                {filteredResearch.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No research data found. Upload some research to get started!
                  </p>
                ) : (
                  filteredResearch.map(item => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-gray-600 mt-1">{item.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Category: {item.category}</span>
                              <span>Date: {new Date(item.relevantDate).toLocaleDateString()}</span>
                              {item.files.length > 0 && (
                                <span>{item.files.length} file(s)</span>
                              )}
                            </div>

                            {item.source && (
                              <p className="text-sm text-gray-500 mt-1">
                                Source: {item.source}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mt-3">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                              ))}
                              {item.ragProcessed && (
                                <Badge className="bg-green-100 text-green-800">
                                  AI Processed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <ResearchUpload 
          personaId={personaId} 
          onUploadComplete={() => {
            fetchResearchData()
            setActiveTab('research')
          }}
        />
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <TimelineView personaId={personaId} />
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Version History
              </span>
              <Button onClick={createNewVersion} disabled={loading}>
                <GitBranch className="h-4 w-4 mr-2" />
                Create Version
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No versions found. Create your first version!
              </p>
            ) : (
              <div className="space-y-4">
                {versions.map(version => (
                  <Card key={version.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">
                            {version.name}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge className={version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {version.isActive ? 'Active' : version.isDraft ? 'Draft' : 'Inactive'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Version {version.version}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(version.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {version.notes && (
                            <p className="text-sm text-gray-600 mt-2">{version.notes}</p>
                          )}
                        </div>
                        
                        {!version.isActive && (
                          <Button 
                            onClick={() => publishVersion(version.id)}
                            disabled={loading}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Persona Data
            </CardTitle>
            <p className="text-sm text-gray-600">
              Export all persona data including research, timeline, and interactions
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                    <h3 className="font-medium text-blue-900">PersonaDoc Format</h3>
                    <p className="text-sm text-blue-700 mt-2">
                      Complete package with files, images, and all data
                    </p>
                    <Button 
                      onClick={() => handleExport('personaDoc')} 
                      disabled={loading}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Export .personaDoc
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="font-medium">JSON Export</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Raw data export for developers
                    </p>
                    <Button 
                      onClick={() => handleExport('json')} 
                      disabled={loading}
                      className="mt-4 w-full"
                    >
                      Export JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <h3 className="font-medium">CSV Export</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Spreadsheet format for analysis
                    </p>
                    <Button 
                      onClick={() => handleExport('csv')} 
                      disabled={loading}
                      className="mt-4 w-full"
                    >
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                    <h3 className="font-medium">Markdown Export</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Human-readable documentation
                    </p>
                    <Button 
                      onClick={() => handleExport('markdown')} 
                      disabled={loading}
                      className="mt-4 w-full"
                    >
                      Export Markdown
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Import Persona Data
            </CardTitle>
            <p className="text-sm text-gray-600">
              Import personas from PersonaDoc files or other formats
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* PersonaDoc Import */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                    <h3 className="font-medium text-blue-900 mb-2">Import PersonaDoc File</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Import a complete persona with research, timeline, and files
                    </p>
                    
                    <input
                      type="file"
                      accept=".personaDoc"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const options = {
                            importFiles: true,
                            importInteractions: true,
                            preserveId: false,
                            createAsTemplate: false
                          }
                          handleImport(file, options)
                        }
                      }}
                      className="hidden"
                      id="personaDocImport"
                    />
                    <label
                      htmlFor="personaDocImport"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose PersonaDoc File
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Import Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="importFiles" defaultChecked />
                        <label htmlFor="importFiles" className="text-sm">Import research files</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="importInteractions" defaultChecked />
                        <label htmlFor="importInteractions" className="text-sm">Import interactions</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="preserveId" />
                        <label htmlFor="preserveId" className="text-sm">Preserve original ID</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="createTemplate" />
                        <label htmlFor="createTemplate" className="text-sm">Create as template</label>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Importing will create a new persona or update an existing one if you own it and preserve ID is enabled.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Format Support */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Supported Formats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-blue-500 mt-1" />
                      <div>
                        <h4 className="font-medium">.personaDoc</h4>
                        <p className="text-sm text-gray-600">
                          Complete persona package with all data, files, and metadata
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Archive className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-400">JSON (Coming Soon)</h4>
                        <p className="text-sm text-gray-400">
                          Import from raw JSON exports
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
