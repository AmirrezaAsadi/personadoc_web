'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Users, BarChart3, X, Plus } from 'lucide-react'

interface Step4ResearchProps {
  data: {
    researchFiles: File[]
    dataSourceTypes: string[]
    manualKnowledge: string
    researchMethodology: string
  }
  onUpdate: (data: any) => void
}

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

export default function Step4Research({ data, onUpdate }: Step4ResearchProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const newFiles = Array.from(files).filter(file => {
      // Accept common document and data formats
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/json',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB limit
    })

    onUpdate({
      researchFiles: [...data.researchFiles, ...newFiles]
    })
  }

  const removeFile = (index: number) => {
    const updatedFiles = data.researchFiles.filter((_, i) => i !== index)
    onUpdate({ researchFiles: updatedFiles })
  }

  const toggleDataSource = (source: string) => {
    const updatedSources = data.dataSourceTypes.includes(source)
      ? data.dataSourceTypes.filter(s => s !== source)
      : [...data.dataSourceTypes, source]
    
    onUpdate({ dataSourceTypes: updatedSources })
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="space-y-6">
      {/* Research Files Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Research Files & Documentation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload research documents, data files, or any supporting materials (PDF, Excel, CSV, Word, JSON)
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                Support for PDF, Excel, CSV, Word, JSON files up to 10MB each
              </p>
              <Input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.json,.txt,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>
          </div>

          {/* Uploaded Files List */}
          {data.researchFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label>Uploaded Files ({data.researchFiles.length})</Label>
              <div className="space-y-2">
                {data.researchFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Source Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Research Data Sources
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the types of research data that informed this persona
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {DATA_SOURCE_OPTIONS.map((source) => (
              <div
                key={source}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  data.dataSourceTypes.includes(source)
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleDataSource(source)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 border-2 rounded transition-colors ${
                      data.dataSourceTypes.includes(source)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    }`}
                  >
                    {data.dataSourceTypes.includes(source) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm">{source}</span>
                </div>
              </div>
            ))}
          </div>

          {data.dataSourceTypes.length > 0 && (
            <div className="mt-4">
              <Label>Selected Sources:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.dataSourceTypes.map((source) => (
                  <Badge key={source} variant="secondary">
                    {source}
                    <button
                      onClick={() => toggleDataSource(source)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Knowledge Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Additional Research Insights
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add any qualitative insights, quotes, or observations from your research
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="manual-knowledge">Key Insights & Quotes</Label>
            <Textarea
              id="manual-knowledge"
              placeholder="e.g., 'Users consistently mentioned feeling overwhelmed by too many options...' or include direct quotes from interviews"
              value={data.manualKnowledge}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ manualKnowledge: e.target.value })}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="research-methodology">Research Methodology</Label>
            <Textarea
              id="research-methodology"
              placeholder="Briefly describe how this persona was developed (e.g., '5 user interviews, 200-person survey, analytics from 10k users over 3 months')"
              value={data.researchMethodology}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ researchMethodology: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Research Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Research Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review the research foundation for this persona
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uploaded Files:</span>
              <span className="font-medium">{data.researchFiles.length} files</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Sources:</span>
              <span className="font-medium">{data.dataSourceTypes.length} selected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Research Insights:</span>
              <span className="font-medium">
                {data.manualKnowledge ? `${data.manualKnowledge.length} characters` : 'None added'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Methodology:</span>
              <span className="font-medium">
                {data.researchMethodology ? 'Documented' : 'Not specified'}
              </span>
            </div>
          </div>
          
          {(data.researchFiles.length === 0 && data.dataSourceTypes.length === 0 && !data.manualKnowledge) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> While research data is optional, providing some foundation 
                will make your persona more credible and actionable.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Review Message */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-blue-700 font-medium mb-2">
              🎉 Your persona is ready to be created!
            </div>
            <p className="text-sm text-blue-600">
              Review your information above, then click "Create Persona" to finalize your new AI persona.
              You can always edit and refine it later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
