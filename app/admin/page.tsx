'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Database, Shield, Trash2, UserCheck, UserX, 
  Search, Filter, MoreVertical, AlertTriangle, Eye,
  Calendar, Clock, ArrowLeft, Activity
} from 'lucide-react'
import Link from 'next/link'

interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: string
  isActive: boolean
  role: string
  personaCount: number
  lastActive: string | null
}

interface AdminPersona {
  id: string
  name: string
  createdAt: string
  creator: {
    id: string
    name: string | null
    email: string
  }
  isPublic: boolean
  shareCount: number
  interactionCount: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'personas'>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [personas, setPersonas] = useState<AdminPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPersonas: 0,
    publicPersonas: 0
  })

  // Check if user is admin
  const isAdmin = session?.user?.email === 'admin@test.com'

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/signin')
      return
    }

    if (!isAdmin) {
      router.push('/')
      return
    }

    loadAdminData()
  }, [session, status, isAdmin, router])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // Load users
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.users.length,
          activeUsers: usersData.users.filter((u: AdminUser) => u.isActive).length
        }))
      }

      // Load personas
      const personasResponse = await fetch('/api/admin/personas')
      if (personasResponse.ok) {
        const personasData = await personasResponse.json()
        setPersonas(personasData.personas)
        setStats(prev => ({
          ...prev,
          totalPersonas: personasData.personas.length,
          publicPersonas: personasData.personas.filter((p: AdminPersona) => p.isPublic).length
        }))
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-status', isActive: !currentStatus })
      })

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        ))
        setStats(prev => ({
          ...prev,
          activeUsers: prev.activeUsers + (currentStatus ? -1 : 1)
        }))
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const deletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/personas/${personaId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPersonas(prev => prev.filter(persona => persona.id !== personaId))
        setStats(prev => ({
          ...prev,
          totalPersonas: prev.totalPersonas - 1
        }))
      }
    } catch (error) {
      console.error('Failed to delete persona:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPersonas = personas.filter(persona =>
    persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.creator.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen relative">
        <div className="sea-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mx-auto"></div>
            <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg">
              <p className="text-slate-700 font-medium">Loading admin panel...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Sea Wave Background */}
      <div className="sea-waves">
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/20 backdrop-blur-[8px] border border-white/25 text-slate-800 hover:bg-white/30 hover:text-slate-900 underwater-glow"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center floating underwater-glow">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-cyan-100 underwater-glow">Admin Panel</h1>
                <p className="text-cyan-200">System management and oversight</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg floating">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
                    <p className="text-sm text-slate-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg floating">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.activeUsers}</p>
                    <p className="text-sm text-slate-600">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg floating">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.totalPersonas}</p>
                    <p className="text-sm text-slate-600">Total Personas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg floating">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.publicPersonas}</p>
                    <p className="text-sm text-slate-600">Public Personas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setActiveTab('users')}
                variant={activeTab === 'users' ? 'default' : 'outline'}
                className={activeTab === 'users' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300/50 hover:border-cyan-400/60'}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
              <Button
                onClick={() => setActiveTab('personas')}
                variant={activeTab === 'personas' ? 'default' : 'outline'}
                className={activeTab === 'personas' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300/50 hover:border-cyan-400/60'}
              >
                <Database className="w-4 h-4 mr-2" />
                Personas
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/95 backdrop-blur-lg border-cyan-200/20 shadow-lg">
          <CardContent className="p-6">
            {activeTab === 'users' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">User Management</h3>
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{user.name || 'Unknown'}</h4>
                          <p className="text-sm text-slate-600">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-xs text-slate-500">{user.personaCount} personas</span>
                            <span className="text-xs text-slate-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          size="sm"
                          variant="outline"
                          className={user.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Persona Management</h3>
                <div className="space-y-3">
                  {filteredPersonas.map((persona) => (
                    <div key={persona.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {persona.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">{persona.name}</h4>
                          <p className="text-sm text-slate-600">
                            Created by {persona.creator.name || persona.creator.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={persona.isPublic ? 'default' : 'secondary'} className="text-xs">
                              {persona.isPublic ? 'Public' : 'Private'}
                            </Badge>
                            <span className="text-xs text-slate-500">{persona.shareCount} shares</span>
                            <span className="text-xs text-slate-500">{persona.interactionCount} interactions</span>
                            <span className="text-xs text-slate-500">
                              Created {new Date(persona.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/personas/${persona.id}`}>
                          <Button size="sm" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          onClick={() => deletePersona(persona.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
