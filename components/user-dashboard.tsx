'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { User, LogOut, MessageCircle, Users } from 'lucide-react'

interface UserDashboardProps {
  personaCount: number
  onCreateDemo: () => void
}

export default function UserDashboard({ personaCount, onCreateDemo }: UserDashboardProps) {
  const { data: session } = useSession()

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <User className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">PersonaDoc</h1>
          <p className="text-gray-600 flex items-center gap-2">
            Welcome back, {session?.user?.name}! 
            <span className="flex items-center gap-1 text-sm bg-blue-100 px-2 py-1 rounded-full">
              <Users className="w-3 h-3" />
              {personaCount} persona{personaCount !== 1 ? 's' : ''}
            </span>
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={onCreateDemo} className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Create Demo Persona
        </Button>
        <Button onClick={() => signOut()} variant="outline" className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
