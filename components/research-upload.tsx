'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, Check, AlertCircle } from 'lucide-react'

interface ResearchUploadProps {
  personaId: string
  onUploadComplete?: (research: any) => void
}

interface UploadedFile {
  name: string
  type: string
  size: number
  content: string // base64 encoded
}

export function ResearchUpload({ personaId, onUploadComplete }: ResearchUploadProps) {
  const [loading, setLoading] = useState(false)
  const [processingRAG, setProcessingRAG] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'document',
    source: '',
    tags: '',
    relevantDate: new Date().toISOString().split('T')[0],
    content: '',
    dataSourceTypes: [] as string[]
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [ragProcessed, setRagProcessed] = useState(false)

  const DATA_SOURCE_OPTIONS = [
    'User Interviews',
    'Surveys & Questionnaires', 
    'Analytics Data',
    'Social Media Research',
    'Customer Support Data',
    'Focus Groups',
    'A/B Testing Results',
    'Market Research',
    'Competitor Analysis',
    'Ethnographic Studies'
  ]

  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  // Convert files to base64 for processing
  const processFiles = async (fileList: FileList): Promise<UploadedFile[]> => {
    const processedFiles: UploadedFile[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      
      // Validate file type and size
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert(`File type ${file.type} is not supported`)
        continue
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`)
        continue
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:type;base64, prefix
        }
        reader.readAsDataURL(file)
      })

      processedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64
      })
    }
    
    return processedFiles
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let processedFiles: UploadedFile[] = []
      
      // Process uploaded files
      if (files && files.length > 0) {
        processedFiles = await processFiles(files)
        setUploadedFiles(processedFiles)
      }

      // First, store the research data in persona metadata 
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'dataSourceTypes') {
          submitData.append(key, JSON.stringify(value))
        } else {
          submitData.append(key, String(value))
        }
      })
      
      submitData.append('personaId', personaId)
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        submitData.append('tags', JSON.stringify(tagsArray))
      }

      // Add file metadata
      if (processedFiles.length > 0) {
        submitData.append('hasFiles', 'true')
        submitData.append('filesMetadata', JSON.stringify(
          processedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
          }))
        ))
      }

      const response = await fetch(`/api/personas/${personaId}/research-upload`, {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Now process with RAG system if we have files or significant content
      if (processedFiles.length > 0 || formData.content.length > 100) {
        setProcessingRAG(true)
        
        try {
          // Prepare research data for RAG processing (similar to wizard format)
          const researchData = {
            uploadedFiles: processedFiles,
            manualKnowledge: formData.content,
            dataSourceTypes: formData.dataSourceTypes,
            researchMetadata: {
              title: formData.title,
              category: formData.category,
              source: formData.source,
              relevantDate: formData.relevantDate,
              tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
            }
          }

          // Update persona metadata with research data
          const persona = await fetch(`/api/personas/${personaId}`)
          const personaData = await persona.json()
          
          const currentMetadata = personaData.metadata || {}
          const updatedMetadata = {
            ...currentMetadata,
            research: {
              ...currentMetadata.research,
              uploadedFiles: [
                ...(currentMetadata.research?.uploadedFiles || []),
                ...processedFiles
              ],
              manualKnowledge: currentMetadata.research?.manualKnowledge 
                ? currentMetadata.research.manualKnowledge + '\n\n' + formData.content
                : formData.content,
              dataSourceTypes: Array.from(new Set([
                ...(currentMetadata.research?.dataSourceTypes || []),
                ...formData.dataSourceTypes
              ]))
            }
          }

          // Update persona with research data
          await fetch(`/api/personas/${personaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata: updatedMetadata })
          })

          // Process with RAG
          const ragResponse = await fetch(`/api/personas/${personaId}/research`, {
            method: 'POST'
          })

          if (ragResponse.ok) {
            const ragResult = await ragResponse.json()
            setRagProcessed(true)
            console.log(`RAG processing completed: ${ragResult.chunksProcessed} chunks processed`)
          }
          
        } catch (ragError) {
          console.error('RAG processing failed:', ragError)
          // Continue anyway since the upload was successful
        } finally {
          setProcessingRAG(false)
        }
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'document',
        source: '',
        tags: '',
        relevantDate: new Date().toISOString().split('T')[0],
        content: '',
        dataSourceTypes: []
      })
      setFiles(null)
      setUploadedFiles([])
      
      const fileInput = document.getElementById('files') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      onUploadComplete?.(result.research)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload research data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleDataSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      dataSourceTypes: prev.dataSourceTypes.includes(source)
        ? prev.dataSourceTypes.filter(s => s !== source)
        : [...prev.dataSourceTypes, source]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Research Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload research files and data that will be processed with vector embeddings for intelligent retrieval
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Customer Interview Series Q2 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of this research and its context"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="document">Document</option>
                <option value="interview">Interview</option>
                <option value="survey">Survey</option>
                <option value="observation">Observation</option>
                <option value="research">Research</option>
                <option value="feedback">Feedback</option>
                <option value="note">Note</option>
              </select>
            </div>

            <div>
              <Label htmlFor="relevantDate">Relevant Date</Label>
              <Input
                id="relevantDate"
                type="date"
                value={formData.relevantDate}
                onChange={(e) => handleInputChange('relevantDate', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              placeholder="e.g., Customer interview, Survey platform, Internal research"
            />
          </div>

          {/* Data Source Types */}
          <div>
            <Label>Data Source Types</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DATA_SOURCE_OPTIONS.map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => toggleDataSource(source)}
                  className={`text-left p-2 rounded border transition-colors ${
                    formData.dataSourceTypes.includes(source)
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="files">Research Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.csv,.json,.xlsx"
              onChange={(e) => setFiles(e.target.files)}
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported: PDF, DOCX, TXT, CSV, JSON, XLSX (Max 10MB each)
              <br />
              <strong>Files will be processed with vector embeddings for intelligent search</strong>
            </p>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="tag1, tag2, tag3"
            />
            <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          <div>
            <Label htmlFor="content">Manual Content / Notes</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Add any manual insights, observations, or notes here..."
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              This content will also be processed for vector search
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Button type="submit" disabled={loading || processingRAG} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : processingRAG ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Process Research
                </>
              )}
            </Button>
            
            {ragProcessed && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Vector embeddings created</span>
              </div>
            )}
          </div>

          {processingRAG && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Processing research data with AI
                  </p>
                  <p className="text-xs text-blue-600">
                    Creating vector embeddings for intelligent search and retrieval...
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
