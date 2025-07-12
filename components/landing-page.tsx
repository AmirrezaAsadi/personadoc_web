'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, ArrowRight, Sparkles, Users, Brain, MessageCircle, Share, Eye, Globe, Lock, Zap, Target, BookOpen, Search, Lightbulb, BarChart3, TestTube, Quote, Star, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const handleSignIn = () => {
    router.push('/signin')
  }

  const benefits = [
    {
      icon: Search,
      title: "Turn Data Into Conversations",
      description: "Upload your research files and create interactive personas that remember every detail. Your team can now \"interview\" users from past studies anytime.",
      outcome: "→ 10x more insights from same research budget",
      visual: "🔬"
    },
    {
      icon: Lightbulb,
      title: "Ask Questions You Forgot",
      description: "Explore user motivations, edge cases, and scenarios that weren't covered in your original interviews. Discover blind spots instantly.",
      outcome: "→ Uncover hidden user needs",
      visual: "💡"
    },
    {
      icon: BarChart3,
      title: "See Patterns Across Users",
      description: "AI synthesizes insights across multiple participants, revealing connections and trends you might miss in manual analysis.",
      outcome: "→ Spot the bigger picture in your data",
      visual: "📊"
    },
    {
      icon: TestTube,
      title: "Test Ideas Before Building",
      description: "Simulate how your users would react to new features or changes without scheduling additional research sessions.",
      outcome: "→ Validate concepts in minutes",
      visual: "🎯"
    }
  ]

  const testimonials = [
    {
      quote: "It really gives like a detailed in-depth explanation of the personas. So I guess the deeper we know about these people who are using the app.",
      attribution: "P5, UX Designer, 3 Years Experience",
      avatar: "👩‍💻"
    },
    {
      quote: "Make you your own like personal make. I mean again customize it based off of the real insight you gather from the from your audience.",
      attribution: "P8, UX Researcher, 6 Years Experience", 
      avatar: "👨‍🔬"
    }
  ]

  const dataQuotes = [
    { text: "Test Ideas", delay: "0s" },
    { text: "Time is limited", delay: "1s" },
    { text: "Participants to Go", delay: "2s" },
    { text: "Make User Research Reusable", delay: "3s" },
    { text: "Knowledge Retention", delay: "4s" },
    { text: "Evidence Based", delay: "5s" }
  ]

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
                  className="bg-white/20 backdrop-blur-[8px] border border-white/30 text-white hover:bg-white/25 hover:border-white/40 ripple underwater-glow transition-all duration-300"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleSignIn}
                  className="bg-white/25 backdrop-blur-[10px] border border-white/30 text-white hover:bg-white/30 hover:border-white/40 shadow-lg ripple underwater-glow transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Split Layout */}
        <section className="relative min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="space-y-8 floating">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white">
                    Go Deeper Into Your User Research
                  </h1>
                  <p className="text-xl text-white leading-relaxed">
                    Gain More From User Research, Uncover insights you missed and get 
                    <span className="text-teal-300 font-semibold"> "more in depth than you ever could with a research team."</span>
                  </p>
                </div>

                {/* Problem Statement */}
                <div className="glass-morphism p-6 rounded-xl underwater-glow border border-white/20">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-orange-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-300 text-lg">⚠️</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white/90 font-medium">Research teams are struggling:</p>
                      <div className="space-y-1 text-white/70">
                        <p className="italic">"We did this amazing research 6 months ago, but now no one remembers the insights"</p>
                        <p className="italic">"There's a lot of things that maybe you've never thought about before that this could introduce"</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleSignIn}
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-xl ripple underwater-glow transition-all duration-300 text-lg px-8 py-6"
                  >
                    See It In Action
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    onClick={handleSignIn}
                    variant="outline"
                    className="bg-white/10 backdrop-blur-[10px] border border-white/30 text-white hover:bg-white/20 hover:border-white/40 ripple underwater-glow transition-all duration-300 text-lg px-8 py-6"
                  >
                    Request Early Access
                  </Button>
                </div>

                {/* Trust Signal */}
              
              </div>

              {/* Right: Visual Storytelling */}
              <div className="relative">
                {/* Main Character */}
                <div className="relative z-10 flex justify-center">
                  <div className="w-80 h-80 glass-morphism rounded-full flex items-center justify-center border border-white/20 underwater-glow floating">
                    <div className="text-8xl">👩‍💻</div>
                  </div>
                </div>

                {/* Floating Data Bubbles */}
                {dataQuotes.map((quote, index) => (
                  <div
                    key={index}
                    className="absolute glass-morphism px-4 py-2 rounded-full border border-white/20 underwater-glow"
                    style={{
                      top: `${20 + Math.sin(index * 60 * Math.PI / 180) * 30}%`,
                      left: `${20 + Math.cos(index * 60 * Math.PI / 180) * 30}%`,
                      animationDelay: quote.delay,
                      animation: 'float 6s ease-in-out infinite'
                    }}
                  >
                    <span className="text-white/80 text-sm font-medium">"{quote.text}"</span>
                  </div>
                ))}

                {/* Background Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 floating">
              <h2 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
                Augment Your Research Data
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Stop letting valuable insights get lost. Turn your research into a living, breathing knowledge base 
                that your entire team can tap into anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group glass-morphism p-8 rounded-2xl border border-white/20 underwater-glow hover:border-white/30 transition-all duration-300 floating"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-6">
                    {/* Visual Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-r from-teal-400/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-white/20 group-hover:border-white/30 transition-all duration-300">
                        <span className="text-2xl">{benefit.visual}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-teal-300 transition-colors">
                          {benefit.title}
                        </h3>
                        <p className="text-white/80 leading-relaxed mb-4">
                          {benefit.description}
                        </p>
                      </div>
                      
                      <div className="inline-flex items-center gap-2 bg-teal-500/20 px-4 py-2 rounded-full border border-teal-400/30">
                        <Zap className="w-4 h-4 text-teal-300" />
                        <span className="text-teal-300 font-medium text-sm">{benefit.outcome}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 floating">
              <h2 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
                Real User Experiences
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                Hear from UX professionals who are already using PersonaDock to enhance their research workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="glass-morphism p-8 rounded-2xl border border-white/20 underwater-glow floating"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="space-y-6">
                    <Quote className="w-8 h-8 text-teal-300" />
                    
                    <blockquote className="text-lg text-white/90 italic leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-400/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-white/20">
                        <span className="text-2xl">{testimonial.avatar}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{testimonial.attribution}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-morphism p-12 rounded-3xl floating underwater-glow border border-white/20">
              <h2 className="text-4xl font-bold gradient-text mb-4">Ready to Transform Your Research?</h2>
              <p className="text-xl text-white/70 mb-8">
                Join researchers, designers, and product teams using PersonaDock to unlock deeper user insights.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleSignIn}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white border-0 shadow-xl ripple underwater-glow px-8 py-4 text-lg transition-all duration-300"
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
              © 2025 PersonaDock. Go deeper into your user research with confidence.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
