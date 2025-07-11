'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Sparkles, Instagram, Linkedin, Twitter } from 'lucide-react'

interface SocialPost {
  content: string
  reasoning: string
  engagement_prediction: 'high' | 'medium' | 'low'
  platform_optimization: string
}

interface SocialPostsTabProps {
  personaId: string
  persona: any
}

export default function SocialPostsTab({ personaId, persona }: SocialPostsTabProps) {
  const [product, setProduct] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [goals, setGoals] = useState('')
  const [tone, setTone] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-blue-400' },
    { id: 'facebook', name: 'Facebook', icon: Instagram, color: 'bg-blue-700' }
  ]

  const generatePosts = async () => {
    if (!product.trim()) {
      setError('Please enter a product or service description')
      return
    }

    setLoading(true)
    setError('')
    setPosts([])

    try {
      const response = await fetch(`/api/personas/${personaId}/social-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product,
          platform,
          goals: goals || 'Increase engagement and awareness',
          tone: tone || 'authentic and engaging',
          targetAudience: targetAudience || 'general audience'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPosts(data.data.posts || [])
      } else {
        setError(data.error || 'Failed to generate posts')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Social posts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getEngagementColor = (prediction: string) => {
    switch (prediction) {
      case 'high': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Social Posts Generator</h2>
        <p className="text-cyan-200">Generate authentic social media content from {persona?.name}'s perspective</p>
      </div>

      {/* Input Form */}
      <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-600" />
            Content Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Description */}
          <div>
            <Label htmlFor="product" className="text-slate-700">Product/Service Description *</Label>
            <Textarea
              id="product"
              placeholder="Describe the product, service, or topic you want to create content about..."
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
              rows={3}
            />
          </div>

          {/* Platform Selection */}
          <div>
            <Label className="text-slate-700 mb-3 block">Social Media Platform</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      platform === p.id
                        ? `${p.color} border-slate-300 text-white`
                        : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Additional Parameters */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="goals" className="text-slate-700">Campaign Goals</Label>
              <Input
                id="goals"
                placeholder="e.g., Increase sales, Build awareness"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="tone" className="text-slate-700">Tone of Voice</Label>
              <Input
                id="tone"
                placeholder="e.g., Professional, Casual, Humorous"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="audience" className="text-slate-700">Target Audience</Label>
              <Input
                id="audience"
                placeholder="e.g., Young professionals, Tech enthusiasts"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePosts}
            disabled={loading || !product.trim()}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white font-medium py-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Posts...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Social Posts
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Generated Posts ({posts.length})</h3>
          
          {posts.map((post, index) => (
            <Card key={index} className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800 text-lg">Post Variation {index + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getEngagementColor(post.engagement_prediction)} text-white`}>
                      {post.engagement_prediction} engagement
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(post.content)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Post Content */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-slate-800 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Reasoning */}
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <h4 className="text-cyan-800 font-medium mb-1">Why this works for {persona?.name}:</h4>
                  <p className="text-cyan-700 text-sm">{post.reasoning}</p>
                </div>

                {/* Platform Optimization */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-blue-800 font-medium mb-1">Platform Optimization:</h4>
                  <p className="text-blue-700 text-sm">{post.platform_optimization}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {posts.length === 0 && !loading && (
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardContent className="text-center py-12">
            <Sparkles className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
            <h3 className="text-slate-800 text-lg font-medium mb-2">Ready to Generate Social Posts</h3>
            <p className="text-slate-600">Enter a product description and generate authentic social media content from {persona?.name}'s perspective</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
