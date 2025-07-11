'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Github } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: true, // Enable automatic redirect on success
        callbackUrl: '/', // Redirect to home page
      })
      
      // This won't execute if redirect is true and login is successful
      if (result?.error) {
        alert('Invalid credentials')
        setLoading(false)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PersonaDock</h1>
          <p className="text-gray-600">Personify you research</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Local Testing - Email/Password */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-b pb-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">🧪 Local Testing</h3>
                <form onSubmit={handleCredentialsSignIn} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In with Email'}
                  </Button>
                </form>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Test Credentials:</p>
                  <p className="text-xs text-blue-600">📧 test@example.com | 🔑 password123</p>
                  <p className="text-xs text-blue-600">📧 admin@test.com | 🔑 admin123</p>
                </div>
              </div>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">🌐 OAuth Sign In</h3>
              
              <Button
                onClick={() => signIn('google')}
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-12 text-base"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                onClick={() => signIn('github')}
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-12 text-base"
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500">
          By signing in, you agree to follow rules and permissions!
        </p>
      </div>
    </div>
  )
}
