'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Upload, Download, Image, Camera, Video, File, 
  Search, Filter, Grid, List, X, Eye, Edit, Trash2,
  Plus, FolderPlus, ImageIcon, Play, Pause, Volume2,
  Share, ExternalLink, Calendar, Tag, RefreshCw
} from 'lucide-react'

interface MediaTabProps {
  personaId: string
  personaName: string
  isOwner?: boolean
}

interface MediaItem {
  id: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  category: 'avatar' | 'lifestyle' | 'work' | 'social' | 'environment' | 'other'
  url?: string
  dataUrl?: string
  caption?: string
  tags: string[]
  metadata?: {
    size?: number
    dimensions?: { width: number; height: number }
    duration?: number
    format?: string
  }
  uploadedAt: string
  source?: string
}

const MEDIA_CATEGORIES = [
  'all',
  'avatar',
  'lifestyle', 
  'work',
  'social',
  'environment',
  'other'
] as const

const MEDIA_TYPES = [
  'all',
  'image',
  'video', 
  'audio',
  'document'
] as const

export default function MediaTab({ personaId, personaName, isOwner = false }: MediaTabProps) {
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Load media items
  useEffect(() => {
    loadMediaItems()
  }, [personaId])

  const loadMediaItems = async () => {
    try {
      setLoading(true)
      // For now, we'll simulate some sample data
      // TODO: Replace with actual API call
      const sampleMedia: MediaItem[] = [
        {
          id: '1',
          name: 'Profile Photo',
          type: 'image',
          category: 'avatar',
          caption: 'Professional headshot',
          tags: ['profile', 'professional'],
          uploadedAt: new Date().toISOString(),
          metadata: { size: 1024000, format: 'JPEG' }
        },
        {
          id: '2', 
          name: 'Workspace Setup',
          type: 'image',
          category: 'work',
          caption: 'Home office environment',
          tags: ['workspace', 'office', 'environment'],
          uploadedAt: new Date().toISOString(),
          metadata: { size: 2048000, format: 'PNG' }
        }
      ]
      setMediaItems(sampleMedia)
    } catch (error) {
      console.error('Failed to load media items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files?.length) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'other')
        formData.append('caption', '')

        const response = await fetch(`/api/personas/${personaId}/files/upload`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          // Reload media items
          await loadMediaItems()
        }
      }
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setUploading(false)
      setShowUploadDialog(false)
    }
  }

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesType = selectedType === 'all' || item.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Volume2 className="w-4 h-4" />
      default: return <File className="w-4 h-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const MediaViewer = ({ item, onClose }: { item: MediaItem; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {item.type === 'image' && item.dataUrl && (
            <img 
              src={item.dataUrl} 
              alt={item.name}
              className="max-w-full max-h-96 object-contain rounded"
            />
          )}
          
          {item.caption && (
            <p className="text-gray-600">{item.caption}</p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <div>Type: {item.type}</div>
            <div>Category: {item.category}</div>
            <div>Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}</div>
            {item.metadata?.size && <div>Size: {formatFileSize(item.metadata.size)}</div>}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading media...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Media Gallery</h2>
          <p className="text-gray-600">Manage images, videos, and media assets for {personaName}</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search media by name, caption, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {MEDIA_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {MEDIA_TYPES.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            <div className="flex border border-gray-300 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => setSelectedItem(item)}>
                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center">
                  {item.dataUrl ? (
                    <img 
                      src={item.dataUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      {getMediaIcon(item.type)}
                      <span className="text-sm mt-2">{item.type}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium truncate">{item.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">+{item.tags.length - 2}</Badge>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredItems.map(item => (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    {item.dataUrl ? (
                      <img 
                        src={item.dataUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      getMediaIcon(item.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.caption}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : isOwner ? 'Upload some images, videos, or documents to get started.' : 'No media available for this persona.'
              }
            </p>
            {isOwner && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Upload Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Images, videos, audio, or documents
                  </p>
                </label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={uploading}
                  onClick={() => document.getElementById('media-upload')?.click()}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Media Viewer */}
      {selectedItem && (
        <MediaViewer 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </div>
  )
}
