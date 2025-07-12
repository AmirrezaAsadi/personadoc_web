'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, ArrowRight, Sparkles, Users, Brain, MessageCircle, Share, Eye, Globe, Lock, Zap, Target, BookOpen } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const handleSignIn = () => {
    router.push('/signin')
  }
  return (
    <div className="min-h-screen relative">
      {/* Animated Liquid Background */}
      <div className="sea-waves">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
        <div className="liquid-blob blob-4"></div>
        <div className="liquid-blob blob-5"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-morphism border-b border-white/20 underwater-glow">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-[8px] border border-white/30 rounded-full flex items-center justify-center shadow-lg ripple underwater-glow transition-all duration-300 hover:bg-white/25 hover:border-white/40">
                  <User className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
                <h1 className="text-2xl font-bold text-white">PersonaDock</h1>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleSignIn}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 ripple underwater-glow backdrop-blur-sm"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-lg ripple underwater-glow"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="floating mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl underwater-glow ripple">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl font-bold gradient-text mb-6 floating">
              Personify Your Research
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto floating">
              Create rich, interactive personas for user research, product development, and design thinking. 
              Build comprehensive character profiles with AI-powered insights and collaborative features.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center floating">
              <Button 
                onClick={handleSignIn}
                className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-xl ripple underwater-glow px-8 py-4 text-lg"
              >
                <User className="w-5 h-5 mr-2" />
                Create Your First Persona
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 ripple underwater-glow backdrop-blur-sm px-8 py-4 text-lg"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Eye className="w-5 h-5 mr-2" />
                Explore Features
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold gradient-text mb-4">Powerful Features</h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Everything you need to create, manage, and share comprehensive personas
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature Cards */}
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Insights</h3>
                <p className="text-white/70">
                  Generate detailed persona attributes with AI assistance. Get inclusivity suggestions and auto-enhancement recommendations.
                </p>
              </div>
              
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Interactive Interviews</h3>
                <p className="text-white/70">
                  Conduct realistic conversations with your personas. Build understanding through dynamic Q&A sessions.
                </p>
              </div>
              
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Share className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Collaboration & Sharing</h3>
                <p className="text-white/70">
                  Share personas publicly or privately. Collaborate with your team and build a shared understanding.
                </p>
              </div>
              
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Profiles</h3>
                <p className="text-white/70">
                  Build detailed personas with demographics, personality traits, goals, and behavioral patterns.
                </p>
              </div>
              
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Research Integration</h3>
                <p className="text-white/70">
                  Upload research documents and let AI extract insights to enhance your persona development.
                </p>
              </div>
              
              <div className="glass-morphism p-6 rounded-2xl floating underwater-glow">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Version Control</h3>
                <p className="text-white/70">
                  Track persona evolution with versioning. Maintain history and compare different iterations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-morphism p-12 rounded-3xl floating underwater-glow">
              <h2 className="text-4xl font-bold gradient-text mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-white/70 mb-8">
                Join researchers, designers, and product teams using PersonaDock to build better user understanding.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-xl ripple underwater-glow px-8 py-4 text-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Start Building Personas
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              
              <div className="mt-8 flex justify-center items-center gap-6 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>Public Gallery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Private Sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="glass-morphism border-t border-white/20 py-8 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-[8px] border border-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/25">
                <User className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
              <span className="text-lg font-semibold text-white">PersonaDock</span>
            </div>
            <p className="text-white/60 text-sm">
              © 2025 PersonaDock. Personify your research with confidence.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
