'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Share2, Instagram, Linkedin, Twitter, Facebook, Target, Palette, Copy, RefreshCw, Brain } from 'lucide-react'

interface Persona {
  id: string
  name: string
  age?: number
  occupation?: string
  location?: string
  introduction?: string
  personalityTraits?: string[]
  interests?: string[]
  metadata?: any
}

interface SocialPostsTabProps {
  persona: Persona
}

interface GeneratedPost {
  id: string
  platform: string
  content: string
  reasoning: string
  hashtags?: string[]
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-500' }
]

const CAMPAIGN_GOALS = [
  'Brand Awareness',
  'Product Launch',
  'Community Building',
  'Thought Leadership',
  'User Generated Content',
  'Sales Conversion'
]

const TONE_OPTIONS = [
  'Professional',
  'Casual',
  'Humorous',
  'Inspirational',
  'Educational',
  'Conversational'
]

export default function SocialPostsTab({ persona }: SocialPostsTabProps) {
  const [productDescription, setProductDescription] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [campaignGoal, setCampaignGoal] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [toneOfVoice, setToneOfVoice] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [loading, setLoading] = useState(false)

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const generatePosts = async () => {
    if (!productDescription.trim() || selectedPlatforms.length === 0) return

    setLoading(true)
    try {
      const response = await fetch(`/api/personas/${persona.id}/social-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription,
          platforms: selectedPlatforms,
          campaignGoal,
          targetAudience,
          toneOfVoice
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to generate posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId)
    return platform ? platform.icon : Share2
  }

  const getPlatformColor = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId)
    return platform ? platform.color : 'bg-gray-500'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Form */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Product/Service Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="product-description">Product/Service Description</Label>
              <Textarea
                id="product-description"
                placeholder="Describe your product, service, or content you want to promote..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <div
                      key={platform.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlatforms.includes(platform.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{platform.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="campaign-goal">Campaign Goal</Label>
              <select
                id="campaign-goal"
                value={campaignGoal}
                onChange={(e) => setCampaignGoal(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a goal...</option>
                {CAMPAIGN_GOALS.map(goal => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="target-audience">Target Audience</Label>
              <Input
                id="target-audience"
                placeholder="e.g., Tech professionals, young parents..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tone-of-voice">Tone of Voice</Label>
              <select
                id="tone-of-voice"
                value={toneOfVoice}
                onChange={(e) => setToneOfVoice(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select tone...</option>
                {TONE_OPTIONS.map(tone => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={generatePosts}
              disabled={loading || !productDescription.trim() || selectedPlatforms.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Posts...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Persona Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {persona.name}'s Perspective
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Personality Influence</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {persona.personalityTraits?.slice(0, 4).map((trait, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Interests</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {persona.interests?.slice(0, 3).map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Posts will reflect {persona.name}'s communication style and preferences
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Posts */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Generated Social Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedPosts.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No posts generated yet</p>
                <p className="text-sm">Fill out the form and click "Generate Posts" to see {persona.name}'s social content</p>
              </div>
            ) : (
              <div className="space-y-6">
                {generatedPosts.map((post) => {
                  const Icon = getPlatformIcon(post.platform)
                  return (
                    <div key={post.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${getPlatformColor(post.platform)} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize">{post.platform}</h3>
                            <p className="text-sm text-gray-600">Posted as {persona.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(post.content)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {post.hashtags.map((hashtag, index) => (
                              <span key={index} className="text-blue-600 text-sm">
                                #{hashtag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Why {persona.name} would post this:
                            </p>
                            <p className="text-sm text-blue-800">{post.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
