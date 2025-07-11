'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Share2, Globe, Link, Copy, Eye, EyeOff, 
  Users, ExternalLink, Settings, Check, X
} from 'lucide-react'

interface PersonaSharingProps {
  personaId: string
  personaName: string
  isPublic: boolean
  shareToken?: string
  shareCount: number
  allowComments: boolean
  onSharingChange: (updates: SharingUpdates) => void
}

interface SharingUpdates {
  isPublic?: boolean
  allowComments?: boolean
  shareToken?: string
}

export function PersonaSharing({
  personaId,
  personaName,
  isPublic,
  shareToken,
  shareCount,
  allowComments,
  onSharingChange
}: PersonaSharingProps) {
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = shareToken 
    ? `${window.location.origin}/shared/persona/${shareToken}`
    : null

  const generateShareLink = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/sharing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateShareLink' })
      })

      if (response.ok) {
        const data = await response.json()
        onSharingChange({ shareToken: data.shareToken })
      }
    } catch (error) {
      console.error('Failed to generate share link:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePublicAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/sharing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateSharing',
          isPublic: !isPublic,
          allowComments
        })
      })

      if (response.ok) {
        onSharingChange({ isPublic: !isPublic })
      }
    } catch (error) {
      console.error('Failed to update public access:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${personaId}/sharing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateSharing',
          isPublic,
          allowComments: !allowComments
        })
      })

      if (response.ok) {
        onSharingChange({ allowComments: !allowComments })
      }
    } catch (error) {
      console.error('Failed to update comment settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const revokeShareLink = async () => {
    if (window.confirm('Are you sure you want to revoke this share link? Anyone with the current link will lose access.')) {
      try {
        setLoading(true)
        const response = await fetch(`/api/personas/${personaId}/sharing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'revokeShareLink' })
        })

        if (response.ok) {
          onSharingChange({ shareToken: undefined })
        }
      } catch (error) {
        console.error('Failed to revoke share link:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const SharingModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share "{personaName}"
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSharingModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Public Access */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <div>
                  <Label className="font-medium">Public Access</Label>
                  <p className="text-xs text-gray-600">Available to all platform users</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={togglePublicAccess}
                disabled={loading}
                className={isPublic ? 'bg-green-50 border-green-300 text-green-700' : ''}
              >
                {isPublic ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                {isPublic ? 'Public' : 'Private'}
              </Button>
            </div>
            
            {isPublic && (
              <div className="ml-6 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✓ This persona is visible in the public gallery and can be found by all users
                </p>
              </div>
            )}
          </div>

          {/* Share Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-600" />
                <div>
                  <Label className="font-medium">Share Link</Label>
                  <p className="text-xs text-gray-600">Anyone with link can view</p>
                </div>
              </div>
              {!shareToken ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateShareLink}
                  disabled={loading}
                >
                  <Link className="w-4 h-4 mr-1" />
                  Generate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeShareLink}
                  disabled={loading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              )}
            </div>
            
            {shareToken && shareUrl && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-3"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {shareCount} views
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrl, '_blank')}
                    className="h-6 px-2 text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Comments Setting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <Label className="font-medium">Allow Comments</Label>
                  <p className="text-xs text-gray-600">Let viewers leave feedback</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleComments}
                disabled={loading}
                className={allowComments ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
              >
                {allowComments ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-medium text-sm mb-2">Current Settings</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Globe className="w-3 h-3 text-green-600" />
                    <span>Public - visible to all users</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 text-gray-600" />
                    <span>Private - only you can see</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {shareToken ? (
                  <>
                    <Link className="w-3 h-3 text-blue-600" />
                    <span>Share link active ({shareCount} views)</span>
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 text-gray-600" />
                    <span>No share link</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Users className={`w-3 h-3 ${allowComments ? 'text-blue-600' : 'text-gray-600'}`} />
                <span>Comments {allowComments ? 'enabled' : 'disabled'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Indicators */}
        {isPublic && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            <Globe className="w-3 h-3 mr-1" />
            Public
          </Badge>
        )}
        {shareToken && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            <Link className="w-3 h-3 mr-1" />
            Shared ({shareCount})
          </Badge>
        )}

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSharingModal(true)}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Sharing Modal */}
      {showSharingModal && <SharingModal />}
    </>
  )
}
